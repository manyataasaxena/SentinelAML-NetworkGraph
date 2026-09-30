import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const syntheticProcessingStatus = ["pending", "queued", "processing", "processed", "failed", "dead_lettered"] as const;
export type SyntheticProcessingStatus = (typeof syntheticProcessingStatus)[number];

export const syntheticTransactionsTable = pgTable("synthetic_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  processingStatus: text("processing_status", { enum: syntheticProcessingStatus }).notNull().default("pending"),
  processingAttempts: integer("processing_attempts").notNull().default(0),
  lastError: text("last_error"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});
