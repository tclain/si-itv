/**
 * Auth Router - aggregates auth endpoints
 */
import { router } from "../http/trpc";
import { getNextAuthStepEndpoint } from "./get-next-auth-step";

export const authRouter = router({
  getNextState: getNextAuthStepEndpoint,
});
