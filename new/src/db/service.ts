/**
 * Database service - composable/swappable
 * Low-level service layer
 */
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

export class Database {
  private dbInstance: Db | null = null;

  constructor(private readonly connectionString: string) {}

  static make(connectionString: string) {
    return new Database(connectionString);
  }

  get client(): Db {
    if (this.dbInstance) {
      return this.dbInstance;
    }

    const pool = new Pool({
      connectionString: this.connectionString,
    });

    this.dbInstance = drizzle(pool, { schema });
    return this.dbInstance;
  }
}
