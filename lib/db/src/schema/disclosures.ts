import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { investigationsTable } from "./investigations";
import { usersTable } from "./users";
import { banksTable } from "./banks";

export const disclosureStatusEnum = ["pending", "approved", "rejected", "expired"] as const;
export type DisclosureStatus = (typeof disclosureStatusEnum)[number];

export const disclosureRequestsTable = pgTable("disclosure_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  investigationId: uuid("investigation_id").notNull().references(() => investigationsTable.id, { onDelete: "cascade" }),
  anonymousEntityId: text("anonymous_entity_id").notNull(),
  internalCustomerId: uuid("internal_customer_id").notNull(),
  requestingUserId: uuid("requesting_user_id").notNull().references(() => usersTable.id),
  owningBankId: uuid("owning_bank_id").notNull().references(() => banksTable.id),
  reason: text("reason").notNull(),
  status: text("status", { enum: disclosureStatusEnum }).notNull().default("pending"),
  reviewedBy: uuid("reviewed_by").references(() => usersTable.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  decisionComment: text("decision_comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InsertDisclosureRequest = typeof disclosureRequestsTable.$inferInsert;
export type DisclosureRequest = typeof disclosureRequestsTable.$inferSelect;