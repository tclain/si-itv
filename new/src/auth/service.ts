/**
 * User Service - domain service layer
 * Composable/swappable: Accepts UserQueries as dependency
 */
import { Micro } from "effect";
import { UserQueries } from "./queries";
import { UserNotFoundError } from "./errors";
import {
  DatabaseError,
  DatabaseQueryTimeoutError,
  EmptyResultSetError,
  FullScanError,
} from "../db/errors";
import { User, UserId } from "./types";
import { Database } from "../db/service";

export class UserService {
  constructor(private readonly queries: UserQueries) {}

  static make(database: Database) {
    const queries = UserQueries.make(database);
    return new UserService(queries);
  }

  getUserById(
    id: UserId
  ): Micro.Micro<
    User,
    | UserNotFoundError
    | DatabaseError
    | DatabaseQueryTimeoutError
    | EmptyResultSetError
    | FullScanError
  > {
    return this.queries.findById(id);
  }
}
