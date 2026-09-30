import { Router, type IRouter } from "express";
import { and, count, eq, gte, ilike, lte, or } from "drizzle-orm";
import { db, customersTable, transactionsTable } from "@workspace/db";
import {
  ListTransactionsQueryParams,
  CreateTransactionBody,
  UpdateTransactionBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuth);

async function enrichTransaction(t: typeof transactionsTable.$inferSelect) {
  const [sender] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, t.senderId))
    .limit(1);
  const [receiver] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, t.receiverId))
    .limit(1);
  return {
    ...t,
    amount: Number(t.amount),
    senderAccountNo: sender?.accountNo ?? "",
    receiverAccountNo: receiver?.accountNo ?? "",
    senderName: sender?.fullName ?? null,
    receiverName: receiver?.fullName ?? null,
  };
}

router.get("/transactions", async (req, res) => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { currency, status, minAmount, maxAmount, page, limit } = parsed.data;

  const conditions = [];
  if (currency) conditions.push(eq(transactionsTable.currency, currency));
  if (status) conditions.push(eq(transactionsTable.status, status));
  if (minAmount !== undefined)
    conditions.push(gte(transactionsTable.amount, String(minAmount)));
  if (maxAmount !== undefined)
    conditions.push(lte(transactionsTable.amount, String(maxAmount)));
  const where = conditions.length ? and(...conditions) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(transactionsTable)
    .where(where);

  let items = await db
    .select()
    .from(transactionsTable)
    .where(where)
    .limit(limit)
    .offset((page - 1) * limit)
    .orderBy(transactionsTable.timestamp);

  const enriched = await Promise.all(items.map(enrichTransaction));

  const { search } = parsed.data;
  const filtered = search
    ? enriched.filter(
        (t) =>
          t.senderAccountNo.includes(search) ||
          t.receiverAccountNo.includes(search) ||
          (t.senderName ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (t.receiverName ?? "").toLowerCase().includes(search.toLowerCase()),
      )
    : enriched;

  res.json({ items: filtered, total, page, limit });
});

router.post("/transactions", async (req, res) => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { senderId, receiverId, amount, currency, timestamp, status } =
    parsed.data;
  const [tx] = await db
    .insert(transactionsTable)
    .values({
      senderId,
      receiverId,
      amount: String(amount),
      currency,
      timestamp: timestamp ?? new Date(),
      status: status ?? "clean",
    })
    .returning();
  await logAudit(req.session!.sub, "create_transaction", "transaction", tx.id);
  res.status(201).json(await enrichTransaction(tx));
});

router.get("/transactions/:id", async (req, res) => {
  const [tx] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, req.params.id))
    .limit(1);
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json(await enrichTransaction(tx));
});

router.patch("/transactions/:id", async (req, res) => {
  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, ...rest } = parsed.data;
  const [tx] = await db
    .update(transactionsTable)
    .set({ ...rest, ...(amount !== undefined ? { amount: String(amount) } : {}) })
    .where(eq(transactionsTable.id, req.params.id))
    .returning();
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  await logAudit(req.session!.sub, "update_transaction", "transaction", tx.id);
  res.json(await enrichTransaction(tx));
});

router.delete("/transactions/:id", async (req, res) => {
  const [tx] = await db
    .delete(transactionsTable)
    .where(eq(transactionsTable.id, req.params.id))
    .returning();
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  await logAudit(
    req.session!.sub,
    "delete_transaction",
    "transaction",
    req.params.id,
  );
  res.status(204).end();
});

export default router;
