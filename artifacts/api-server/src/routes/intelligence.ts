import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  banksTable,
  customersTable,
  transactionsTable,
  alertsTable,
  usersTable,
  investigationsTable,
  investigationEvidenceTable,
  investigationNotesTable,
  disclosureRequestsTable,
  type InvestigationStatus,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import { logAudit } from "../lib/audit";
import { anonymousEntityId } from "../lib/privacy";

const router: IRouter = Router();
router.use(requireAuth);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

function bankForCustomer(customer: { bankId: string | null }, banks: Map<string, typeof banksTable.$inferSelect>) {
  return customer.bankId ? banks.get(customer.bankId) : undefined;
}

async function loadBanks() {
  const banks = await db.select().from(banksTable).orderBy(banksTable.name);
  return new Map(banks.map((bank) => [bank.id, bank]));
}

async function calculateMules() {
  const [customers, transactions, banks] = await Promise.all([
    db.select().from(customersTable),
    db.select().from(transactionsTable),
    loadBanks(),
  ]);
  const result = customers.map((customer) => {
    const related = transactions.filter(
      (transaction) =>
        transaction.senderId === customer.id || transaction.receiverId === customer.id,
    );
    const incoming = related.filter((transaction) => transaction.receiverId === customer.id);
    const outgoing = related.filter((transaction) => transaction.senderId === customer.id);
    const counterparties = new Set(
      related.map((transaction) =>
        transaction.senderId === customer.id ? transaction.receiverId : transaction.senderId,
      ),
    );
    const received = incoming.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const sent = outgoing.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const passThrough = received ? Math.min(100, (sent / received) * 100) : 0;
    const bankIds = new Set(
      related.flatMap((transaction) => {
        const sender = customers.find((item) => item.id === transaction.senderId);
        const receiver = customers.find((item) => item.id === transaction.receiverId);
        return [sender?.bankId, receiver?.bankId].filter(Boolean) as string[];
      }),
    );
    const crossBank = bankIds.size > 1;
    const reasons: string[] = [];
    if (incoming.length >= 4) reasons.push("High fan-in");
    if (outgoing.length >= 4) reasons.push("High fan-out");
    if (passThrough >= 70) reasons.push(`${Math.round(passThrough)}% of received funds transferred onward`);
    if (crossBank) reasons.push("Cross-bank activity");
    if (incoming.length + outgoing.length >= 10) reasons.push("High transaction velocity");
    const score = Math.min(
      100,
      (incoming.length >= 4 ? 22 : 0) +
        (outgoing.length >= 4 ? 22 : 0) +
        (passThrough >= 70 ? 20 : passThrough >= 40 ? 10 : 0) +
        (crossBank ? 18 : 0) +
        (incoming.length + outgoing.length >= 10 ? 18 : 0),
    );
    const bank = bankForCustomer(customer, banks);
    return {
      id: customer.id,
      anonymousId: bank ? anonymousEntityId(bank.bankCode, customer.id) : `LOCAL-${customer.accountNo}`,
      bank: bank?.name || "Unassigned",
      accountNo: bank ? undefined : customer.accountNo,
      identity: bank ? "restricted" : "available",
      incomingCount: incoming.length,
      outgoingCount: outgoing.length,
      counterpartyCount: counterparties.size,
      receivedAmount: received,
      sentAmount: sent,
      passThroughPercentage: Math.round(passThrough),
      crossBank,
      score,
      status: score >= 70 ? "potential_mule" : "screened",
      reasons,
    };
  });
  return result
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

router.get("/banks", async (_req, res) => {
  const banks = await db.select().from(banksTable).orderBy(banksTable.name);
  res.json(banks);
});

router.get("/cross-bank/networks", async (req, res) => {
  const [customers, transactions, banks] = await Promise.all([
    db.select().from(customersTable),
    db.select().from(transactionsTable),
    db.select().from(banksTable),
  ]);
  const bankMap = new Map(banks.map((bank) => [bank.id, bank]));
  const customerMap = new Map(customers.map((customer) => [customer.id, customer]));
  const crossBankTransactions = transactions.filter((transaction) => {
    const sender = customerMap.get(transaction.senderId);
    const receiver = customerMap.get(transaction.receiverId);
    return Boolean(sender?.bankId && receiver?.bankId && sender.bankId !== receiver.bankId);
  });
  const involved = new Set<string>();
  crossBankTransactions.forEach((transaction) => {
    involved.add(transaction.senderId);
    involved.add(transaction.receiverId);
  });
  const involvedBanks = new Set<string>();
  involved.forEach((id) => {
    const bankId = customerMap.get(id)?.bankId;
    if (bankId) involvedBanks.add(bankId);
  });
  const mules = await calculateMules();
  const muleIds = new Set(mules.filter((mule) => mule.score >= 70).map((mule) => mule.id));
  const networkScore = Math.min(
    100,
    Math.min(30, involved.size * 4) +
      Math.min(25, involvedBanks.size * 10) +
      Math.min(20, crossBankTransactions.length * 3) +
      (muleIds.size ? 25 : 0),
  );
  const nodes = [...involved].map((id) => {
    const customer = customerMap.get(id)!;
    const bank = customer.bankId ? bankMap.get(customer.bankId) : undefined;
    return {
      id: bank ? anonymousEntityId(bank.bankCode, customer.id) : `LOCAL-${customer.accountNo}`,
      bank: bank?.name || "Unassigned",
      bankCode: bank?.bankCode,
      identity: bank ? "restricted" : "available",
      riskScore: customer.riskScore,
      riskLevel: customer.riskLevel,
    };
  });
  const nodeIds = new Map([...involved].map((id) => {
    const customer = customerMap.get(id)!;
    const bank = customer.bankId ? bankMap.get(customer.bankId) : undefined;
    return [id, bank ? anonymousEntityId(bank.bankCode, customer.id) : `LOCAL-${customer.accountNo}`] as const;
  }));
  const edges = crossBankTransactions.map((transaction) => ({
    id: transaction.id,
    source: nodeIds.get(transaction.senderId),
    target: nodeIds.get(transaction.receiverId),
    amount: Number(transaction.amount),
    currency: transaction.currency,
    timestamp: transaction.timestamp,
    flagged: transaction.status === "flagged" || Number(transaction.amount) >= 10000,
  }));
  await logAudit(req.session!.sub, "view_cross_bank_network", "network", "cross-bank");
  res.json({
    stats: {
      banksInvolved: involvedBanks.size,
      accountsInvolved: involved.size,
      crossBankTransactions: crossBankTransactions.length,
      potentialMules: muleIds.size,
      networkRiskScore: networkScore,
    },
    reasons: [
      `${involvedBanks.size} simulated bank(s) involved`,
      `${crossBankTransactions.length} cross-bank transaction(s)`,
      ...(muleIds.size ? ["Potential mule account detected"] : []),
    ],
    banks,
    nodes,
    edges,
  });
});

router.get("/cross-bank/entities/:anonymousId", async (req, res) => {
  const [customers, banks] = await Promise.all([
    db.select().from(customersTable),
    db.select().from(banksTable),
  ]);
  const bankMap = new Map(banks.map((bank) => [bank.id, bank]));
  const customer = customers.find((candidate) => {
    const bank = candidate.bankId ? bankMap.get(candidate.bankId) : undefined;
    return bank && anonymousEntityId(bank.bankCode, candidate.id) === req.params.anonymousId;
  });
  if (!customer || !customer.bankId) {
    res.status(404).json({ error: "Anonymous entity not found" });
    return;
  }
  const bank = bankMap.get(customer.bankId)!;
  const approved = await db
    .select()
    .from(disclosureRequestsTable)
    .where(
      and(
        eq(disclosureRequestsTable.internalCustomerId, customer.id),
        eq(disclosureRequestsTable.status, "approved"),
        eq(disclosureRequestsTable.requestingUserId, req.session!.sub),
      ),
    )
    .limit(1);
  await logAudit(req.session!.sub, "view_cross_bank_entity", "external_entity", req.params.anonymousId);
  res.json({
    anonymousId: req.params.anonymousId,
    bank: bank.name,
    identity: approved[0]
      ? { status: "disclosed", name: customer.fullName, accountEnding: customer.accountNo.slice(-4) }
      : { status: "restricted" },
  });
});

router.get("/mules", async (_req, res) => {
  res.json({ items: await calculateMules() });
});

router.get("/mules/:id", async (req, res) => {
  const mule = (await calculateMules()).find((item) => item.id === req.params.id);
  if (!mule) {
    res.status(404).json({ error: "Mule profile not found" });
    return;
  }
  res.json(mule);
});

router.get("/investigations", async (_req, res) => {
  const investigations = await db
    .select({
      id: investigationsTable.id,
      caseNumber: investigationsTable.caseNumber,
      title: investigationsTable.title,
      description: investigationsTable.description,
      status: investigationsTable.status,
      severity: investigationsTable.severity,
      networkRiskScore: investigationsTable.networkRiskScore,
      muleRiskScore: investigationsTable.muleRiskScore,
      createdAt: investigationsTable.createdAt,
      updatedAt: investigationsTable.updatedAt,
      createdByName: usersTable.name,
    })
    .from(investigationsTable)
    .innerJoin(usersTable, eq(investigationsTable.createdBy, usersTable.id))
    .orderBy(desc(investigationsTable.updatedAt));
  res.json({ items: investigations });
});

router.post("/investigations", async (req, res) => {
  const { title, description, sourceAlertId, sourceCustomerId, networkRiskScore, muleRiskScore, severity } = req.body ?? {};
  if (!isNonEmptyString(title) || !isNonEmptyString(description)) {
    res.status(400).json({ error: "Title and description are required" });
    return;
  }
  const [created] = await db
    .insert(investigationsTable)
    .values({
      caseNumber: `INV-${Date.now().toString().slice(-8)}`,
      title: title.trim(),
      description: description.trim(),
      createdBy: req.session!.sub,
      sourceAlertId: isNonEmptyString(sourceAlertId) ? sourceAlertId : undefined,
      sourceCustomerId: isNonEmptyString(sourceCustomerId) ? sourceCustomerId : undefined,
      networkRiskScore: Number.isFinite(Number(networkRiskScore)) ? Math.max(0, Math.min(100, Number(networkRiskScore))) : 0,
      muleRiskScore: Number.isFinite(Number(muleRiskScore)) ? Math.max(0, Math.min(100, Number(muleRiskScore))) : 0,
      severity: isNonEmptyString(severity) ? severity : "medium",
    })
    .returning();
  await logAudit(req.session!.sub, "create_investigation", "investigation", created.id);
  res.status(201).json(created);
});

router.get("/investigations/:id", async (req, res) => {
  const [investigation] = await db.select().from(investigationsTable).where(eq(investigationsTable.id, req.params.id)).limit(1);
  if (!investigation) {
    res.status(404).json({ error: "Investigation not found" });
    return;
  }
  const [evidence, notes, disclosures] = await Promise.all([
    db.select().from(investigationEvidenceTable).where(eq(investigationEvidenceTable.investigationId, investigation.id)).orderBy(desc(investigationEvidenceTable.createdAt)),
    db.select().from(investigationNotesTable).where(eq(investigationNotesTable.investigationId, investigation.id)).orderBy(desc(investigationNotesTable.createdAt)),
    db.select().from(disclosureRequestsTable).where(eq(disclosureRequestsTable.investigationId, investigation.id)).orderBy(desc(disclosureRequestsTable.createdAt)),
  ]);
  res.json({ ...investigation, evidence, notes, disclosures });
});

router.patch("/investigations/:id", async (req, res) => {
  const { status, assignedInvestigator, title, description } = req.body ?? {};
  const allowedStatuses: InvestigationStatus[] = ["open", "under_investigation", "escalated", "resolved", "closed"];
  if (status !== undefined && !allowedStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid investigation status" });
    return;
  }
  const id = String(req.params.id);
  const [updated] = await db
    .update(investigationsTable)
    .set({
      ...(isNonEmptyString(status) ? { status: status as InvestigationStatus } : {}),
      ...(isNonEmptyString(assignedInvestigator) ? { assignedInvestigator } : {}),
      ...(isNonEmptyString(title) ? { title: title.trim() } : {}),
      ...(isNonEmptyString(description) ? { description: description.trim() } : {}),
      updatedAt: new Date(),
      ...(status === "closed" ? { closedAt: new Date() } : {}),
    })
    .where(eq(investigationsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Investigation not found" });
    return;
  }
  await logAudit(req.session!.sub, "update_investigation", "investigation", updated.id);
  res.json(updated);
});

router.post("/investigations/:id/evidence", async (req, res) => {
  const { evidenceType, referenceId, description } = req.body ?? {};
  if (!isNonEmptyString(evidenceType) || !isNonEmptyString(referenceId) || !isNonEmptyString(description)) {
    res.status(400).json({ error: "Evidence type, reference ID, and description are required" });
    return;
  }
  const [item] = await db.insert(investigationEvidenceTable).values({
    investigationId: req.params.id,
    evidenceType: evidenceType.trim(),
    referenceId: referenceId.trim(),
    description: description.trim(),
    createdBy: req.session!.sub,
  }).returning();
  await logAudit(req.session!.sub, "add_investigation_evidence", "investigation", req.params.id);
  res.status(201).json(item);
});

router.post("/investigations/:id/notes", async (req, res) => {
  const { note } = req.body ?? {};
  if (!isNonEmptyString(note)) {
    res.status(400).json({ error: "Note is required" });
    return;
  }
  const [item] = await db.insert(investigationNotesTable).values({
    investigationId: req.params.id,
    note: note.trim(),
    createdBy: req.session!.sub,
  }).returning();
  await logAudit(req.session!.sub, "add_investigation_note", "investigation", req.params.id);
  res.status(201).json(item);
});

router.get("/disclosure-requests", async (req, res) => {
  const isReviewer = ["admin", "compliance_officer"].includes(req.session!.role);
  const requests = await db
    .select({
      id: disclosureRequestsTable.id,
      investigationId: disclosureRequestsTable.investigationId,
      anonymousEntityId: disclosureRequestsTable.anonymousEntityId,
      reason: disclosureRequestsTable.reason,
      status: disclosureRequestsTable.status,
      reviewedAt: disclosureRequestsTable.reviewedAt,
      decisionComment: disclosureRequestsTable.decisionComment,
      createdAt: disclosureRequestsTable.createdAt,
      owningBank: banksTable.name,
      requestingUser: usersTable.name,
      internalCustomerId: disclosureRequestsTable.internalCustomerId,
    })
    .from(disclosureRequestsTable)
    .innerJoin(banksTable, eq(disclosureRequestsTable.owningBankId, banksTable.id))
    .innerJoin(usersTable, eq(disclosureRequestsTable.requestingUserId, usersTable.id))
    .where(isReviewer ? undefined : eq(disclosureRequestsTable.requestingUserId, req.session!.sub))
    .orderBy(desc(disclosureRequestsTable.createdAt));
  res.json({
    items: requests.map(({ internalCustomerId: _internalCustomerId, ...request }) => request),
  });
});

router.post("/disclosure-requests", requireRole("investigator", "admin"), async (req, res) => {
  const { investigationId, anonymousEntityId: requestedAnonymousId, reason } = req.body ?? {};
  if (!isNonEmptyString(investigationId) || !isNonEmptyString(requestedAnonymousId) || !isNonEmptyString(reason)) {
    res.status(400).json({ error: "Investigation, anonymous entity, and reason are required" });
    return;
  }
  const [customers, banks] = await Promise.all([db.select().from(customersTable), db.select().from(banksTable)]);
  const bankMap = new Map(banks.map((bank) => [bank.id, bank]));
  const customer = customers.find((candidate) => {
    const bank = candidate.bankId ? bankMap.get(candidate.bankId) : undefined;
    return bank && anonymousEntityId(bank.bankCode, candidate.id) === requestedAnonymousId;
  });
  if (!customer?.bankId) {
    res.status(404).json({ error: "Anonymous entity not found" });
    return;
  }
  const [request] = await db.insert(disclosureRequestsTable).values({
    investigationId,
    anonymousEntityId: requestedAnonymousId,
    internalCustomerId: customer.id,
    requestingUserId: req.session!.sub,
    owningBankId: customer.bankId,
    reason: reason.trim(),
  }).returning();
  await logAudit(req.session!.sub, "request_identity_disclosure", "disclosure_request", request.id);
  const { internalCustomerId: _internalCustomerId, ...safeRequest } = request;
  res.status(201).json(safeRequest);
});

router.patch("/disclosure-requests/:id", requireRole("admin", "compliance_officer"), async (req, res) => {
  const { status, decisionComment } = req.body ?? {};
  const id = String(req.params.id);
  if (status !== "approved" && status !== "rejected") {
    res.status(400).json({ error: "Decision must be approved or rejected" });
    return;
  }
  const [request] = await db.select().from(disclosureRequestsTable).where(eq(disclosureRequestsTable.id, id)).limit(1);
  if (!request) {
    res.status(404).json({ error: "Disclosure request not found" });
    return;
  }
  const [updated] = await db.update(disclosureRequestsTable).set({
    status,
    reviewedBy: req.session!.sub,
    reviewedAt: new Date(),
    decisionComment: isNonEmptyString(decisionComment) ? decisionComment.trim() : undefined,
  }).where(eq(disclosureRequestsTable.id, request.id)).returning();
  await logAudit(req.session!.sub, status === "approved" ? "approve_identity_disclosure" : "reject_identity_disclosure", "disclosure_request", request.id);
  const { internalCustomerId: _internalCustomerId, ...safeRequest } = updated;
  res.json(safeRequest);
});

export default router;