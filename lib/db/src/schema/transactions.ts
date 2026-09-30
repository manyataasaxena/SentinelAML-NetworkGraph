import {
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customersTable } from "./customers";

export const txStatusEnum = ["clean", "flagged", "under_review"] as const;
export type TxStatus = (typeof txStatusEnum)[number];

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
  status: text("status", { enum: txStatusEnum }).notNull().default("clean"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertTransaction = typeof transactionsTable.$inferInsert;
export type Transaction = typeof transactionsTable.$inferSelect;
