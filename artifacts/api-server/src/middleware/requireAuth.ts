import type { NextFunction, Request, Response } from "express";
import { getSessionFromRequest, type SessionPayload } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      session?: SessionPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  req.session = session;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.session.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
