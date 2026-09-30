import { Router, type IRouter } from "express";
import { and, count, eq } from "drizzle-orm";
import { db, usersTable, auditLogsTable } from "@workspace/db";
import { ListAuditLogsQueryParams } from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middleware/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/audit-logs", requireRole("admin"), async (req, res) => {
  const parsed = ListAuditLogsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId, action, page, limit } = parsed.data;
  const conditions = [];
  if (userId) conditions.push(eq(auditLogsTable.userId, userId));
  if (action) conditions.push(eq(auditLogsTable.action, action));
  const where = conditions.length ? and(...conditions) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(auditLogsTable)
    .where(where);

  const items = await db
    .select({
      id: auditLogsTable.id,
      userId: auditLogsTable.userId,
      action: auditLogsTable.action,
      targetType: auditLogsTable.targetType,
      targetId: auditLogsTable.targetId,
      timestamp: auditLogsTable.timestamp,
      userName: usersTable.name,
    })
    .from(auditLogsTable)
    .innerJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
    .where(where)
    .limit(limit)
    .offset((page - 1) * limit)
    .orderBy(auditLogsTable.timestamp);

  res.json({ items, total, page, limit });
});

export default router;
