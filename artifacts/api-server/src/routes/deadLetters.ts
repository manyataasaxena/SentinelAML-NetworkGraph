import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  deadLetterEventsTable,
  syntheticTransactionsTable,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middleware/requireAuth";
import { logAudit } from "../lib/audit";
import { eventTopics, publishEvent, type TransactionReceivedEvent } from "../lib/eventBus";

const router: IRouter = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/admin/dead-letter-events", async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const query = db
    .select()
    .from(deadLetterEventsTable)
    .orderBy(desc(deadLetterEventsTable.createdAt))
    .limit(limit);
  const items = status
    ? await query.where(eq(deadLetterEventsTable.status, status as "pending" | "replayed" | "resolved"))
    : await query;
  res.json({ items, limit });
});

router.post("/admin/dead-letter-events/:id/replay", async (req, res) => {
  const [deadLetter] = await db
    .select()
    .from(deadLetterEventsTable)
    .where(eq(deadLetterEventsTable.id, req.params.id))
    .limit(1);

  if (!deadLetter) {
    res.status(404).json({ error: "Dead-letter event not found" });
    return;
  }
  if (deadLetter.status === "resolved") {
    res.status(409).json({ error: "Dead-letter event is already resolved" });
    return;
  }

  const event = deadLetter.payload as unknown as TransactionReceivedEvent;
  if (!event || event.eventType !== "transaction.received" || !event.payload?.eventId) {
    res.status(422).json({ error: "Dead-letter payload cannot be replayed" });
    return;
  }

  await publishEvent(eventTopics.transactionReceived, event);
  await db
    .update(deadLetterEventsTable)
    .set({ status: "replayed", replayedAt: new Date(), updatedAt: new Date() })
    .where(eq(deadLetterEventsTable.id, deadLetter.id));
  await db
    .update(syntheticTransactionsTable)
    .set({ processingStatus: "queued", lastError: null })
    .where(eq(syntheticTransactionsTable.id, event.payload.eventId));
  await logAudit(req.session!.sub, "replay_dead_letter_event", "dead_letter_event", deadLetter.id);

  res.status(202).json({
    replayed: true,
    deadLetterId: deadLetter.id,
    eventId: event.eventId,
    transactionId: event.payload.transactionId,
  });
});

export default router;