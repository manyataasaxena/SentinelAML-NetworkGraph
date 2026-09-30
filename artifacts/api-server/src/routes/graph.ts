import { Router, type IRouter } from "express";
import { gte } from "drizzle-orm";
import { db, customersTable, transactionsTable } from "@workspace/db";
import { GetGraphQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";
import { degreeCentrality } from "../lib/graphAnalytics";

const HIGH_VALUE_FLAG_THRESHOLD = 10000;

const router: IRouter = Router();
router.use(requireAuth);

router.get("/graph", async (req, res) => {
  const parsed = GetGraphQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { riskLevel, minAmount, currency, flaggedOnly } = parsed.data;

  const customers = await db.select().from(customersTable);
  let txns = await db.select().from(transactionsTable);

  if (minAmount !== undefined) {
    txns = txns.filter((t) => Number(t.amount) >= minAmount);
  }
  if (currency) {
    txns = txns.filter((t) => t.currency === currency);
  }
  if (flaggedOnly) {
    txns = txns.filter(
      (t) => t.status === "flagged" || Number(t.amount) >= HIGH_VALUE_FLAG_THRESHOLD,
    );
  }

  let filteredCustomers = customers;
  if (riskLevel) {
    filteredCustomers = customers.filter((c) => c.riskLevel === riskLevel);
  }
  const allowedIds = new Set(filteredCustomers.map((c) => c.id));
  if (riskLevel) {
    txns = txns.filter(
      (t) => allowedIds.has(t.senderId) || allowedIds.has(t.receiverId),
    );
  }

  const involvedIds = new Set<string>();
  txns.forEach((t) => {
    involvedIds.add(t.senderId);
    involvedIds.add(t.receiverId);
  });
  const nodeCustomers = riskLevel
    ? customers.filter((c) => involvedIds.has(c.id))
    : customers;

  const degrees = degreeCentrality(
    nodeCustomers.map((c) => c.id),
    txns.map((t) => ({ source: t.senderId, target: t.receiverId })),
  );

  const nodes = nodeCustomers.map((c) => ({
    id: c.id,
    accountNo: c.accountNo,
    customerName: c.fullName,
    riskScore: c.riskScore,
    riskLevel: c.riskLevel,
    degree: degrees.get(c.id) ?? 0,
  }));

  const edges = txns.map((t) => ({
    id: t.id,
    txId: t.id,
    source: t.senderId,
    target: t.receiverId,
    amount: Number(t.amount),
    currency: t.currency,
    timestamp: t.timestamp,
    flagged:
      t.status === "flagged" || Number(t.amount) >= HIGH_VALUE_FLAG_THRESHOLD,
  }));

  res.json({ nodes, edges });
});

export default router;
