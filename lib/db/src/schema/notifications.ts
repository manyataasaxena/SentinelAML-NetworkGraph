import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { riskLevelEnum } from "./customers";

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity", { enum: riskLevelEnum }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  read: boolean("read").notNull().default(false),
});

export type InsertNotification = typeof notificationsTable.$inferInsert;
export type Notification = typeof notificationsTable.$inferSelect;
