import { Router, type IRouter } from "express";
import { and, count, eq } from "drizzle-orm";
import { db, customersTable, alertsTable } from "@workspace/db";
import { ListAlertsQueryParams, UpdateAlertBody } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuth);

function withCustomerJoin() {
  return db
    .select({
      id: alertsTable.id,
      customerId: alertsTable.customerId,
      ruleTriggered: alertsTable.ruleTriggered,
      severity: alertsTable.severity,
      description: alertsTable.description,
      createdAt: alertsTable.createdAt,
      resolved: alertsTable.resolved,
      customerName: customersTable.fullName,
      accountNo: customersTable.accountNo,
    })
    .from(alertsTable)
    .innerJoin(customersTable, eq(alertsTable.customerId, customersTable.id));
}

router.get("/alerts", async (req, res) => {
  const parsed = ListAlertsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { severity, resolved, page, limit } = parsed.data;
  const conditions = [];
  if (severity) conditions.push(eq(alertsTable.severity, severity));
  if (resolved !== undefined) conditions.push(eq(alertsTable.resolved, resolved));
  const where = conditions.length ? and(...conditions) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(alertsTable)
    .where(where);

  const items = await withCustomerJoin()
    .where(where)
    .limit(limit)
    .offset((page - 1) * limit)
    .orderBy(alertsTable.createdAt);

  res.json({ items, total, page, limit });
});

router.get("/alerts/:id", async (req, res) => {
  const [alert] = await withCustomerJoin().where(eq(alertsTable.id, req.params.id)).limit(1);
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(alert);
});

router.patch("/alerts/:id", async (req, res) => {
  const parsed = UpdateAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(alertsTable)
    .set(parsed.data)
    .where(eq(alertsTable.id, req.params.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  await logAudit(
    req.session!.sub,
    parsed.data.resolved ? "resolve_alert" : "update_alert",
    "alert",
    updated.id,
  );
  const [alert] = await withCustomerJoin().where(eq(alertsTable.id, updated.id)).limit(1);
  res.json(alert);
});

export default router;
