import { Request, Response } from "express";
import { getIronSession, IronSession } from "iron-session";
import { AuthSession } from "./auth/types";

export interface ExpressContext {
  session: IronSession<AuthSession>;
}

export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<ExpressContext> {
  const session = await getIronSession<AuthSession>(req, res, {
    password: process.env.SESSION_SECRET!,
    cookieName: "session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    },
  });

  return { session };
}
