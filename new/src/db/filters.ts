/**
 * Filter conversion layer - serializable filters to SQL clauses
 * Registry pattern: table columns are fetched dynamically from registry
 */
import { sql, SQL } from "drizzle-orm";
import { Column } from "drizzle-orm";
import { PgSelect } from "drizzle-orm/pg-core";

export type FilterOperator =
  | "eq"
  | "ne"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "in"
  | "isNull"
  | "isNotNull";

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: unknown;
}

export type FilterExpression =
  | FilterCondition
  | { and: FilterExpression[] }
  | { or: FilterExpression[] }
  | { not: FilterExpression };

/**
 * Table registry - maps table names to their column definitions
 * Singleton instance pattern
 */
export class TableRegistry {
  private tables: Map<string, Record<string, Column>> = new Map();

  constructor() {}

  register(tableName: string, columns: Record<string, Column>): void {
    this.tables.set(tableName, columns);
  }

  getColumns(tableName: string): Record<string, Column> {
    const columns = this.tables.get(tableName);
    if (!columns) {
      throw new Error(`Table ${tableName} not found in registry`);
    }
    return columns;
  }
}

/**
 * Filter compiler - emits SQL values using registry pattern
 */
export class FilterCompiler {
  constructor(private tableName: string, private registry: TableRegistry) {}

  compile(expression?: FilterExpression): SQL | undefined {
    if (!expression) {
      return undefined;
    }

    if ("and" in expression) {
      return expression.and.reduce(
        (acc, expr) => sql`${acc} AND ${this.compile(expr)}`,
        this.compile(expression.and[0])
      );
    }

    if ("or" in expression) {
      return expression.or.reduce(
        (acc, expr) => sql`${acc} OR ${this.compile(expr)}`,
        this.compile(expression.or[0])
      );
    }

    if ("not" in expression) {
      return sql`NOT ${this.compile(expression.not)}`;
    }

    const condition = expression as FilterCondition;
    const columns = this.registry.getColumns(this.tableName);
    const column = columns[condition.field];

    if (!column) {
      throw new Error(
        `Column ${condition.field} not found in table ${this.tableName}`
      );
    }

    switch (condition.operator) {
      case "eq":
        return sql`${column} = ${condition.value}`;
      case "ne":
        return sql`${column} != ${condition.value}`;
      case "gt":
        return sql`${column} > ${condition.value}`;
      case "gte":
        return sql`${column} >= ${condition.value}`;
      case "lt":
        return sql`${column} < ${condition.value}`;
      case "lte":
        return sql`${column} <= ${condition.value}`;
      case "like":
        return sql`${column} LIKE ${condition.value}`;
      case "in":
        return sql`${column} IN ${sql.join(
          (condition.value as unknown[]).map((v) => sql`${v}`),
          sql`, `
        )}`;
      case "isNull":
        return sql`${column} IS NULL`;
      case "isNotNull":
        return sql`${column} IS NOT NULL`;
      default:
        throw new Error(`Unknown operator: ${condition.operator}`);
    }
  }

  withFilters<T extends PgSelect>(query: T, expression?: FilterExpression) {
    if (expression) {
      return query.where(this.compile(expression));
    }
    return query;
  }
}
