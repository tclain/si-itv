import { TRPCError } from "@trpc/server";
import { Micro } from "effect/index";

export const runPromiseWithBoundaryError = async <T, E>(
  pipeline: Micro.Micro<T, E>
): Promise<T> => {
  const awaited = await pipeline.pipe(Micro.runPromiseExit);

  if (awaited._tag === "Success") {
    return awaited.value;
  }

  if (awaited._tag === "Failure") {
    throw awaited.cause.cause as TRPCError;
  }

  throw new Error("Unexpected error");
};
