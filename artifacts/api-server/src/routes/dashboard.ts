import { Router, type IRouter } from "express";
import { count, eq, or, sql } from "drizzle-orm";
import {
  db,
  customersTable,
  transactionsTable,
  alertsTable,
} from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/dashboard/summary", async (_req, res) => {
  const [{ value: totalCustomers }] = await db
    .select({ value: count() })
    .from(customersTable);
  const [{ value: totalTransactions }] = await db
    .select({ value: count() })
    .from(transactionsTable);
  const [{ value: highRiskAccounts }] = await db
    .select({ value: count() })
    .from(customersTable)
    .where(sql`${customersTable.riskLevel} in ('high', 'critical')`);
  const [{ total: totalMoneyFlow }] = await db
    .select({ total: sql<string>`coalesce(sum(${transactionsTable.amount}), 0)` })
    .from(transactionsTable);
  const [{ value: openAlerts }] = await db
    .select({ value: count() })
    .from(alertsTable)
    .where(eq(alertsTable.resolved, false));

  const recent = await db
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
    .innerJoin(customersTable, eq(alertsTable.customerId, customersTable.id))
    .orderBy(sql`${alertsTable.createdAt} desc`)
    .limit(8);

  res.json({
    totalCustomers,
    totalTransactions,
    highRiskAccounts,
    totalMoneyFlow: Number(totalMoneyFlow),
    openAlerts,
    recentAlerts: recent,
  });
});

export default router;
