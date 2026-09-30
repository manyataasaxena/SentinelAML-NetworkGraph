import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });
try {
  await pool.query("SELECT 1");
  console.log("DB connection: OK");

  const tables = await pool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  console.log("Tables:", tables.rows.map((r) => r.tablename).join(", ") || "NONE");

  const users = await pool.query("SELECT email, role FROM users LIMIT 5");
  console.log("Users:", users.rows);
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
