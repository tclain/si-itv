/**
 * Parse don't validate - use Zod schemas for parsing
 */
import { z } from "zod";
import { Micro } from "effect";

export const parse = <T, R>(
  schema: z.ZodSchema<T>,
  input: unknown
): Micro.Micro<T, z.ZodError, R> => {
  const parseResult = schema.safeParse(input);
  return parseResult.success
    ? Micro.succeed(parseResult.data)
    : Micro.fail(parseResult.error);
};
