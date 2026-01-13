/**
 * Micro/Effect-based middleware for authentication
 * - extractUser: Extracts user from session context (optional)
 * - requireAuth: Guard that ensures user is authenticated (required)
 */
import { Micro, pipe } from "effect";
import { Context } from "../http/context";
import { UserService } from "./service";
import { UnauthorizedError } from "./errors";
import {
  DatabaseError,
  DatabaseQueryTimeoutError,
  EmptyResultSetError,
  FullScanError,
} from "../db/errors";
import { User, UserId } from "./types";

/**
 * Require authentication - guard that ensures user is authenticated
 * Returns Micro that succeeds with authenticated user or fails with UnauthorizedError
 */
export const withAuth = (
  ctx: Context
): Micro.Micro<
  User,
  | UnauthorizedError
  | DatabaseError
  | DatabaseQueryTimeoutError
  | EmptyResultSetError
  | FullScanError
> => {
  const userId = ctx.session.data?.userId;

  if (userId === undefined) {
    return Micro.fail(new UnauthorizedError("Authentication required"));
  }

  const userService = UserService.make(ctx.db);

  return pipe(
    userService.getUserById(userId as UserId),
    Micro.mapError((_error) => {
      return new UnauthorizedError("Invalid user");
    })
  );
};

/**
 * Enforce authentication with a guard function
 * First requires authentication, then applies a guard function to check authorization
 *
 * @param ctx - The tRPC context
 * @param guard - A function that takes a User and returns Micro<boolean, UnauthorizedError>
 *                Returns true if authorized, false if not authorized
 * @param reason - Optional reason message if guard fails (default: "Access denied")
 *
 * @returns Micro that succeeds with authenticated and authorized user, or fails with UnauthorizedError
 */
export const enforceAuthGuard = (
  ctx: Context,
  guard: (user: User) => boolean,
  reason: string = "Access denied"
): Micro.Micro<
  User,
  | UnauthorizedError
  | DatabaseError
  | DatabaseQueryTimeoutError
  | EmptyResultSetError
  | FullScanError
> => {
  return pipe(
    withAuth(ctx),
    Micro.filterOrFail(
      (u): u is User => guard(u),
      () => new UnauthorizedError(reason)
    )
  );
};

export const enforceAuth = (ctx: Context, message: string = "Access denied") =>
  enforceAuthGuard(ctx, (user) => Boolean(user), message);
