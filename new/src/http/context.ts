import { Request, Response } from "express";
import { getIronSession, IronSession } from "iron-session";
import { Database } from "../db/service";
import { AuthSession } from "../auth/types";

export interface Context {
  req: Request;
  res: Response;

  session: {
    store: IronSession<AuthSession>;
    data: AuthSession["data"] | null;
  };

  db: Database;
}

export type ContextWithInput<T = void> = {
  input: T;
  ctx: Context;
};

export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<Context> {
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
  return {
    req,
    res,
    session: { store: session, data: session.data ?? null },
    db: Database.make(process.env.DATABASE_URL!),
  };
}
