import { Router, Request, Response } from "express";
import { getSessionUser } from "./middleware";

const router = Router();

/**
 * GET /api/auth/next-step
 * Returns the next authentication step for the current user
 */
router.get("/next-step", async (req: Request, res: Response) => {
  const user = await getSessionUser(req);

  if (!user) {
    return res.json({ step: "requires-password" });
  }

  if (user.ssoId) {
    return res.json({ step: "requires-sso" });
  }

  return res.json({ step: "logged-in" });
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user
 */
router.get("/me", async (req: Request, res: Response) => {
  const user = await getSessionUser(req);

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return res.json({
    id: user.id,
    email: user.email,
    name: user.name,
  });
});

export const authRoutes = router;
