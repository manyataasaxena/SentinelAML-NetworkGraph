import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const deadLetterStatus = ["pending", "replayed", "resolved"] as const;
export type DeadLetterStatus = (typeof deadLetterStatus)[number];

export const deadLetterEventsTable = pgTable(
  "dead_letter_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: text("event_id").notNull(),
    transactionId: text("transaction_id"),
    topic: text("topic").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    failureReason: text("failure_reason").notNull(),
    retryCount: integer("retry_count").notNull(),
    worker: text("worker").notNull(),
    status: text("status", { enum: deadLetterStatus }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    replayedAt: timestamp("replayed_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => ({
    eventIdUnique: uniqueIndex("dead_letter_events_event_id_idx").on(table.eventId),
    statusCreatedAtIdx: index("dead_letter_events_status_created_at_idx").on(table.status, table.createdAt),
    transactionIdIdx: index("dead_letter_events_transaction_id_idx").on(table.transactionId),
  }),
);

export type InsertDeadLetterEvent = typeof deadLetterEventsTable.$inferInsert;
export type DeadLetterEvent = typeof deadLetterEventsTable.$inferSelect;