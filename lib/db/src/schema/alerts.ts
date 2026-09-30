import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { customersTable, riskLevelEnum } from "./customers";

export const alertsTable = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customersTable.id, { onDelete: "cascade" }),
  ruleTriggered: text("rule_triggered").notNull(),
  severity: text("severity", { enum: riskLevelEnum }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolved: boolean("resolved").notNull().default(false),
});

export type InsertAlert = typeof alertsTable.$inferInsert;
export type Alert = typeof alertsTable.$inferSelect;
