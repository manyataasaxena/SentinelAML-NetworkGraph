import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/notifications", async (_req, res) => {
  const items = await db
    .select()
    .from(notificationsTable)
    .orderBy(notificationsTable.createdAt)
    .limit(50);
  res.json(items.reverse());
});

router.patch("/notifications/:id/read", async (req, res) => {
  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, req.params.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  res.json(updated);
});

export default router;
