/**
 * Get Auth Step Use Case
 * Endpoint, Procedure, and Use Case in one file
 */
import { Micro, pipe } from "effect";
import { ContextWithInput } from "../http/context";
import { publicProcedure } from "../http/trpc";
import { enforceAuthGuard } from "./middleware";
import { UserQueries } from "./queries";
import { AuthStep, User } from "./types";

export const getAuthNextStepUseCase = (opts: {
  input: {
    user: User | null;
  };
  deps: {
    userQueries: UserQueries;
  };
}): Micro.Micro<AuthStep, never> => {
  return pipe(
    Micro.succeed(opts.input.user),
    Micro.andThen((user: User | null) => {
      if (user === null) {
        return Micro.succeed("requires-password" as AuthStep);
      }
      if (user.ssoId) {
        return Micro.succeed("requires-sso" as AuthStep);
      }
      return Micro.succeed("logged-in" as AuthStep);
    })
  );
};

// Procedure - boundary layer
export const getNextAuthStepProcedure = async ({
  input,
  ctx,
}: ContextWithInput) => {
  return pipe(
    enforceAuthGuard(ctx, (user) => user.id === input, "Access denied"),
    Micro.catchAll(() => Micro.succeed(null)),
    Micro.andThen((user: User | null) =>
      getAuthNextStepUseCase({
        input: {
          user: user,
        },
        deps: {
          userQueries: UserQueries.make(ctx.db),
        },
      })
    ),
    Micro.runPromise
  );
};

export const getNextAuthStepEndpoint = publicProcedure.query(
  getNextAuthStepProcedure
);
