import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  ssoId: varchar("sso_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type UserEntity = typeof users.$inferSelect;

export const forms = pgTable("forms", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  fields: jsonb("fields").notNull(),
  cachedHtml: text("cached_html"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FormEntity = typeof forms.$inferSelect;

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
});
