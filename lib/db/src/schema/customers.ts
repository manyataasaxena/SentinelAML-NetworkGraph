import { date, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { banksTable } from "./banks";

export const riskLevelEnum = ["low", "medium", "high", "critical"] as const;
export type RiskLevel = (typeof riskLevelEnum)[number];

export const customersTable = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  country: text("country").notNull(),
  dob: date("dob", { mode: "string" }).notNull(),
  accountNo: text("account_no").notNull().unique(),
  bankId: uuid("bank_id").references(() => banksTable.id, { onDelete: "set null" }),
  riskScore: integer("risk_score").notNull().default(0),
  riskLevel: text("risk_level", { enum: riskLevelEnum })
    .notNull()
    .default("low"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertCustomer = typeof customersTable.$inferInsert;
export type Customer = typeof customersTable.$inferSelect;
