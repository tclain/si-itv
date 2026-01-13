/**
 * Auth domain errors
 */
import { TRPCError } from "@trpc/server";

export class UserNotFoundError extends TRPCError {
  constructor(public readonly userId: number) {
    super({
      code: "NOT_FOUND",
      message: `User ${userId} not found`,
    });
    this.name = "UserNotFoundError";
  }
}

export class UnauthenticatedError extends TRPCError {
  constructor() {
    super({
      code: "UNAUTHORIZED",
      message: "Unauthenticated",
    });
    this.name = "UnauthenticatedError";
  }
}
export class UnauthorizedError extends TRPCError {
  constructor(public readonly reason: string) {
    super({
      code: "UNAUTHORIZED",
      message: reason,
    });
    this.name = "UnauthorizedError";
  }
}
