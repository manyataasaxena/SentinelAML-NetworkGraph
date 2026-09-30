import { db, auditLogsTable } from "@workspace/db";

export async function logAudit(
  userId: string,
  action: string,
  targetType: string,
  targetId: string,
) {
  await db.insert(auditLogsTable).values({ userId, action, targetType, targetId });
}
