/**
 * Database errors - low-level errors
 */
import { TRPCError } from "@trpc/server";

export class DatabaseError extends TRPCError {
  _tag = "DatabaseError" as const;
  constructor(
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super({
      code: "INTERNAL_SERVER_ERROR",
      message: `Database error: ${operation}`,
      cause,
    });
    this.name = "DatabaseError";
  }
}

export class DatabaseQueryError extends TRPCError {
  _tag = "DatabaseQueryError" as const;
  constructor(public readonly query: string, public readonly cause?: Error) {
    super({
      code: "INTERNAL_SERVER_ERROR",
      message: `Database query error: ${query}`,
      cause,
    });
    this.name = "DatabaseQueryError";
  }
}

export class DatabaseConnectionError extends TRPCError {
  _tag = "DatabaseConnectionError" as const;
  constructor(
    public readonly message: string = "Database connection error",
    public readonly cause?: Error
  ) {
    super({
      code: "INTERNAL_SERVER_ERROR",
      message,
      cause,
    });
    this.name = "DatabaseConnectionError";
  }
}

export class DatabaseQueryTimeoutError extends TRPCError {
  _tag = "DatabaseQueryTimeoutError" as const;
  constructor() {
    super({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database query timed out",
    });
  }
}

export class FullScanError extends TRPCError {
  _tag = "FullScanError" as const;
  constructor() {
    super({
      code: "PRECONDITION_FAILED",
      message: "Full scan is not supported",
    });
    this.name = "FullScanError";
  }
}

export class EmptyResultSetError extends TRPCError {
  _tag = "EmptyResultSetError" as const;
  constructor() {
    super({
      code: "NOT_FOUND",
      message: "Empty result set",
    });
    this.name = "EmptyResultSetError";
  }
}
