import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { SignupBody, LoginBody } from "@workspace/api-zod";
import {
  hashPassword,
  comparePassword,
  signSession,
  setSessionCookie,
  clearSessionCookie,
} from "../lib/auth";
import { requireAuth } from "../middleware/requireAuth";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

router.post("/auth/signup", async (req, res) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { name, email, password, role } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash, role: role ?? "analyst" })
    .returning();

  const token = signSession({ sub: user.id, role: user.role });
  setSessionCookie(res, token);
  await logAudit(user.id, "signup", "user", user.id);
  res.status(201).json(serializeUser(user));
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signSession({ sub: user.id, role: user.role });
  setSessionCookie(res, token);
  await logAudit(user.id, "login", "user", user.id);
  res.json(serializeUser(user));
});

router.post("/auth/logout", requireAuth, async (req, res) => {
  clearSessionCookie(res);
  await logAudit(req.session!.sub, "logout", "user", req.session!.sub);
  res.status(204).end();
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session!.sub))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(serializeUser(user));
});

export default router;
