import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getUserById(id: number) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

export async function createUser(email: string, name: string, ssoId?: string) {
  const result = await db
    .insert(users)
    .values({
      email,
      name,
      ssoId: ssoId || null,
      createdAt: new Date(),
    })
    .returning();
  return result[0];
}
