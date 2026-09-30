import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const roleEnum = ["admin", "compliance_officer", "analyst", "investigator"] as const;
export type UserRole = (typeof roleEnum)[number];

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: roleEnum }).notNull().default("analyst"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;
