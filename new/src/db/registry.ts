import { TableRegistry } from "./filters";
import { users, forms, sessions } from "./schema";

export const transactionalDbRegistry = new TableRegistry();

transactionalDbRegistry.register("users", {
  id: users.id,
  email: users.email,
  name: users.name,
  ssoId: users.ssoId,
  createdAt: users.createdAt,
});

transactionalDbRegistry.register("forms", {
  id: forms.id,
  userId: forms.userId,
  title: forms.title,
  fields: forms.fields,
  cachedHtml: forms.cachedHtml,
  createdAt: forms.createdAt,
});

transactionalDbRegistry.register("sessions", {
  id: sessions.id,
  userId: sessions.userId,
  expiresAt: sessions.expiresAt,
});
