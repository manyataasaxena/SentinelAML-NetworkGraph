import { db, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const users = await db.select({ email: usersTable.email }).from(usersTable).limit(5);
console.log("Users:", users);

const tables = await db.execute<{ tablename: string }>(
  sql`select tablename from pg_tables where schemaname = 'public' order by tablename`,
);
console.log("Tables:", tables.rows.map((r) => r.tablename).join(", ") || "NONE");

process.exit(0);
