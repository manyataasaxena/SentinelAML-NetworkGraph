import { Router, type IRouter } from "express";
import { and, count, eq, ilike, or } from "drizzle-orm";
import {
  db,
  customersTable,
  transactionsTable,
} from "@workspace/db";
import {
  ListCustomersQueryParams,
  CreateCustomerBody,
  UpdateCustomerBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/customers", async (req, res) => {
  const parsed = ListCustomersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, country, riskLevel, page, limit } = parsed.data;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(customersTable.fullName, `%${search}%`),
        ilike(customersTable.email, `%${search}%`),
        ilike(customersTable.accountNo, `%${search}%`),
      ),
    );
  }
  if (country) conditions.push(eq(customersTable.country, country));
  if (riskLevel) conditions.push(eq(customersTable.riskLevel, riskLevel));
  const where = conditions.length ? and(...conditions) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(customersTable)
    .where(where);

  const items = await db
    .select()
    .from(customersTable)
    .where(where)
    .limit(limit)
    .offset((page - 1) * limit)
    .orderBy(customersTable.createdAt);

  res.json({ items, total, page, limit });
});

router.post("/customers", async (req, res) => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [customer] = await db
    .insert(customersTable)
    .values({
      ...parsed.data,
      dob: parsed.data.dob.toISOString().slice(0, 10),
    })
    .returning();
  await logAudit(req.session!.sub, "create_customer", "customer", customer.id);
  res.status(201).json(customer);
});

router.get("/customers/:id", async (req, res) => {
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.id, req.params.id))
    .limit(1);
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json(customer);
});

router.patch("/customers/:id", async (req, res) => {
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { dob, ...rest } = parsed.data;
  const [customer] = await db
    .update(customersTable)
    .set({ ...rest, ...(dob ? { dob: dob.toISOString().slice(0, 10) } : {}) })
    .where(eq(customersTable.id, req.params.id))
    .returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  await logAudit(req.session!.sub, "update_customer", "customer", customer.id);
  res.json(customer);
});

router.delete("/customers/:id", async (req, res) => {
  const [customer] = await db
    .delete(customersTable)
    .where(eq(customersTable.id, req.params.id))
    .returning();
  if (!customer) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  await logAudit(req.session!.sub, "delete_customer", "customer", req.params.id);
  res.status(204).end();
});

router.get("/customers/:id/transactions", async (req, res) => {
  const senderTable = customersTable;
  const receiverTable = customersTable;
  const txns = await db
    .select({
      id: transactionsTable.id,
      senderId: transactionsTable.senderId,
      receiverId: transactionsTable.receiverId,
      amount: transactionsTable.amount,
      currency: transactionsTable.currency,
      timestamp: transactionsTable.timestamp,
      status: transactionsTable.status,
      createdAt: transactionsTable.createdAt,
    })
    .from(transactionsTable)
    .where(
      or(
        eq(transactionsTable.senderId, req.params.id),
        eq(transactionsTable.receiverId, req.params.id),
      ),
    )
    .orderBy(transactionsTable.timestamp);

  const customerIds = new Set<string>();
  txns.forEach((t) => {
    customerIds.add(t.senderId);
    customerIds.add(t.receiverId);
  });
  const customers = customerIds.size
    ? await db.select().from(customersTable)
    : [];
  const byId = new Map(customers.map((c) => [c.id, c]));

  res.json(
    txns.map((t) => ({
      ...t,
      amount: Number(t.amount),
      senderAccountNo: byId.get(t.senderId)?.accountNo ?? "",
      receiverAccountNo: byId.get(t.receiverId)?.accountNo ?? "",
      senderName: byId.get(t.senderId)?.fullName ?? null,
      receiverName: byId.get(t.receiverId)?.fullName ?? null,
    })),
  );
});

export default router;
