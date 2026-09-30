import { Router, type IRouter } from "express";
import { ilike, or } from "drizzle-orm";
import { db, customersTable, transactionsTable } from "@workspace/db";
import { GlobalSearchQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/search", async (req, res) => {
  const parsed = GlobalSearchQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { q } = parsed.data;

  const customers = await db
    .select()
    .from(customersTable)
    .where(
      or(
        ilike(customersTable.fullName, `%${q}%`),
        ilike(customersTable.accountNo, `%${q}%`),
        ilike(customersTable.email, `%${q}%`),
      ),
    )
    .limit(10);

  const results = customers.flatMap((c) => [
    {
      type: "customer" as const,
      id: c.id,
      label: c.fullName,
      subtitle: c.email,
      href: `/customers/${c.id}`,
    },
    {
      type: "account" as const,
      id: c.id,
      label: c.accountNo,
      subtitle: `${c.fullName} — ${c.riskLevel} risk`,
      href: `/customers/${c.id}`,
    },
  ]);

  res.json(results);
});

export default router;
