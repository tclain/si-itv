import { Micro } from "effect/index";
import {
  DatabaseError,
  DatabaseQueryTimeoutError,
  EmptyResultSetError,
} from "./errors";

type DatabaseOperationOpts = {
  timeout?: number;
  retry?: { times: number };
};

const remapTimeoutExceptionToBoundaryError = <T, E>(
  micro: Micro.Micro<T, E | Micro.TimeoutException>
): Micro.Micro<T, E | DatabaseQueryTimeoutError> => {
  return micro.pipe(
    Micro.catchTag("TimeoutException", () =>
      Micro.fail(new DatabaseQueryTimeoutError())
    )
  );
};

export const DatabaseQuerySingle = <T>(
  query: () => Promise<T>,
  opts?: DatabaseOperationOpts
): Micro.Micro<
  T,
  DatabaseError | EmptyResultSetError | DatabaseQueryTimeoutError
> => {
  return Micro.promise(() => query()).pipe(
    Micro.mapError((error: Error) => new DatabaseError("query", error)),
    Micro.andThen((result: T) => {
      if (!result) {
        return Micro.fail(new EmptyResultSetError());
      }
      return Micro.succeed(result);
    }),
    Micro.timeout(opts?.timeout ?? 10_000),
    Micro.retry({
      times: opts?.retry?.times ?? 3,
    }),
    remapTimeoutExceptionToBoundaryError
  );
};

export const DatabaseQueryMany = <T>(
  query: () => Promise<T[]>,
  opts?: DatabaseOperationOpts
): Micro.Micro<
  T[],
  DatabaseError | EmptyResultSetError | DatabaseQueryTimeoutError
> => {
  return Micro.promise(() => query()).pipe(
    Micro.mapError((error: Error) => new DatabaseError("query", error)),
    Micro.andThen((result: T[]) => {
      if (result.length === 0) {
        return Micro.fail(new EmptyResultSetError());
      }
      return Micro.succeed(result);
    }),
    Micro.timeout(opts?.timeout ?? 10_000),
    Micro.retry({
      times: opts?.retry?.times ?? 3,
    }),
    remapTimeoutExceptionToBoundaryError
  );
};

export const DatabaseMutation = <T, R>(
  mutation: () => Promise<T>,
  opts?: DatabaseOperationOpts
): Micro.Micro<T, DatabaseError | DatabaseQueryTimeoutError, R> => {
  return Micro.promise(() => mutation()).pipe(
    Micro.mapError((error: Error) => new DatabaseError("mutation", error)),
    Micro.timeout(opts?.timeout ?? 10_000),
    Micro.retry({
      times: opts?.retry?.times ?? 3,
    }),
    remapTimeoutExceptionToBoundaryError
  );
};
