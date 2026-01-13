import { Request, Response, NextFunction } from "express";
import { getUserById } from "./data";

/**
 * Middleware to validate session and ensure user is authenticated
 * Adds user to request if session is valid
 */
export async function validateSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const user = await getUserById(req.session.userId);
  if (!user) {
    res.status(401).json({ error: "Invalid session" });
    return;
  }

  // Attach user to request for use in route handlers
  req.user = user;
  next();
}

/**
 * Middleware to optionally validate session
 * Adds user to request if session exists and is valid, but doesn't fail if missing
 */
export async function optionalSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.session.userId) {
    const user = await getUserById(req.session.userId);
    if (user) {
      req.user = user;
    }
  }

  next();
}

/**
 * Helper function to check if session is valid
 * Returns user if valid, null otherwise
 */
export async function getSessionUser(
  req: Request
): Promise<{
  id: number;
  email: string;
  name: string;
  ssoId: string | null;
} | null> {
  if (!req.session.userId) {
    return null;
  }

  const user = await getUserById(req.session.userId);
  return user;
}

/**
 * Helper function to check if user is authenticated
 */
export function isAuthenticated(req: Request): boolean {
  return !!req.session.userId;
}
