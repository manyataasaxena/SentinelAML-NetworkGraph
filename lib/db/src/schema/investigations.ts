import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { alertsTable } from "./alerts";
import { usersTable } from "./users";

export const investigationStatusEnum = [
  "open",
  "under_investigation",
  "escalated",
  "resolved",
  "closed",
] as const;
export type InvestigationStatus = (typeof investigationStatusEnum)[number];

export const investigationsTable = pgTable("investigations", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseNumber: text("case_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdBy: uuid("created_by").notNull().references(() => usersTable.id),
  assignedInvestigator: uuid("assigned_investigator").references(() => usersTable.id),
  sourceAlertId: uuid("source_alert_id").references(() => alertsTable.id, { onDelete: "set null" }),
  sourceCustomerId: uuid("source_customer_id"),
  networkRiskScore: integer("network_risk_score").notNull().default(0),
  muleRiskScore: integer("mule_risk_score").notNull().default(0),
  severity: text("severity").notNull().default("medium"),
  status: text("status", { enum: investigationStatusEnum }).notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const investigationEvidenceTable = pgTable("investigation_evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  investigationId: uuid("investigation_id").notNull().references(() => investigationsTable.id, { onDelete: "cascade" }),
  evidenceType: text("evidence_type").notNull(),
  referenceId: text("reference_id").notNull(),
  description: text("description").notNull(),
  createdBy: uuid("created_by").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const investigationNotesTable = pgTable("investigation_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  investigationId: uuid("investigation_id").notNull().references(() => investigationsTable.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdBy: uuid("created_by").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InsertInvestigation = typeof investigationsTable.$inferInsert;
export type Investigation = typeof investigationsTable.$inferSelect;