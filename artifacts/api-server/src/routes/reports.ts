import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, customersTable, transactionsTable, alertsTable } from "@workspace/db";
import { ExportReportQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/reports/summary", async (_req, res) => {
  const customers = await db.select().from(customersTable);
  const riskCounts = { low: 0, medium: 0, high: 0, critical: 0 };
  customers.forEach((c) => {
    riskCounts[c.riskLevel]++;
  });

  const [{ value: totalFlaggedTransactions }] = await db
    .select({ value: sql<number>`count(*)` })
    .from(transactionsTable)
    .where(sql`${transactionsTable.status} = 'flagged'`);

  const alerts = await db.select().from(alertsTable);
  const alertsByCustomer = new Map<string, string[]>();
  alerts.forEach((a) => {
    if (!alertsByCustomer.has(a.customerId)) alertsByCustomer.set(a.customerId, []);
    alertsByCustomer.get(a.customerId)!.push(a.ruleTriggered);
  });

  const suspiciousAccounts = customers
    .filter((c) => c.riskLevel === "high" || c.riskLevel === "critical")
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 20)
    .map((c) => ({
      accountNo: c.accountNo,
      customerName: c.fullName,
      riskScore: c.riskScore,
      riskLevel: c.riskLevel,
      topRules: [...new Set(alertsByCustomer.get(c.id) ?? [])].slice(0, 5),
    }));

  res.json({
    generatedAt: new Date(),
    riskCounts,
    totalFlaggedTransactions: Number(totalFlaggedTransactions),
    suspiciousAccounts,
  });
});

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    const str = val === null || val === undefined ? "" : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

router.get("/reports/export", async (req, res) => {
  const parsed = ExportReportQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { type } = parsed.data;

  let csv = "";
  if (type === "customers") {
    const rows = await db.select().from(customersTable);
    csv = toCsv(rows);
  } else if (type === "transactions") {
    const rows = await db.select().from(transactionsTable);
    csv = toCsv(rows.map((r) => ({ ...r, amount: Number(r.amount) })));
  } else {
    const rows = await db.select().from(alertsTable);
    csv = toCsv(rows);
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${type}-report.csv"`,
  );
  res.send(csv);
});

export default router;
