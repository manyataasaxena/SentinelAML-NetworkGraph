import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const bankStatusEnum = ["active", "suspended"] as const;
export type BankStatus = (typeof bankStatusEnum)[number];

export const banksTable = pgTable("banks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  bankCode: text("bank_code").notNull().unique(),
  country: text("country").notNull().default("India"),
  status: text("status", { enum: bankStatusEnum }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InsertBank = typeof banksTable.$inferInsert;
export type Bank = typeof banksTable.$inferSelect;