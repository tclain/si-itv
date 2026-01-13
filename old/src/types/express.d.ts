import { ExpressContext } from "../context";

declare global {
  namespace Express {
    interface Request {
      session: ExpressContext["session"];
      user?: {
        id: number;
        email: string;
        name: string;
        ssoId: string | null;
      };
    }
  }
}

export {};
