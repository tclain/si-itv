/**
 * Auth types - invalid state unrepresentable
 */
import { z } from "zod";
import { UserEntity } from "../db/schema";
import { Brand } from "effect/Brand";

export type User = UserEntity & { id: UserId };

export type UserId = number & Brand<"Int">;
export const UserId = z
  .number()
  .int()
  .positive()
  .transform((n) => n as UserId);
export type AuthStep = "logged-in" | "requires-sso" | "requires-password";

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthSession {
  data: {
    userId: UserId;
    roles: string[];
  } | null;
}
