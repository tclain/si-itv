import { eq } from "drizzle-orm";
import { Micro, pipe } from "effect";
import {
  DatabaseError,
  DatabaseQueryTimeoutError,
  EmptyResultSetError,
  FullScanError,
} from "../db/errors";
import { FilterCompiler, FilterExpression } from "../db/filters";
import "../db/registry";
import { transactionalDbRegistry } from "../db/registry";
import { UserEntity, users } from "../db/schema";
import { Database } from "../db/service";
import { DatabaseQueryMany, DatabaseQuerySingle } from "../db/units";
import { UserNotFoundError } from "./errors";
import { User, UserId } from "./types";

export class UserQueries {
  constructor(
    private readonly database: Database,
    private readonly filterCompiler: FilterCompiler
  ) { }

  static make(database: Database) {
    return new UserQueries(
      database,
      new FilterCompiler("users", transactionalDbRegistry)
    );
  }

  findById(
    filter: FilterExpression
  ): Micro.Micro<
    User,
    | UserNotFoundError
    | DatabaseError
    | DatabaseQueryTimeoutError
    | EmptyResultSetError
    | FullScanError
  > {
    return pipe(
      DatabaseQuerySingle(() =>
        this.database.client
          .select()
          .from(users)
          .where(this.filterCompiler.compile(filter))
          .limit(1)
          .then((rows) => rows[0])
      ),
      Micro.map((user) => {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          ssoId: user.ssoId ?? undefined,
          createdAt: user.createdAt,
        } as User;
      })
    );
  }

  find(
    filter?: FilterExpression,
    preventFullScan = true
  ): Micro.Micro<
    User[],
    | EmptyResultSetError
    | DatabaseError
    | FullScanError
    | DatabaseQueryTimeoutError
  > {
    return pipe(
      Micro.succeed(filter),
      Micro.filterOrFail((f): f is FilterExpression => !f && preventFullScan, () => new FullScanError()),
      Micro.andThen((filter: FilterExpression) =>
        DatabaseQueryMany(() =>
          this.database.client
            .select()
            .from(users)
            .where(this.filterCompiler.compile(filter))
            .then((rows) => rows)
        )
      ),
      Micro.andThen((users: UserEntity[]) => {
        if (users.length === 0) {
          return Micro.fail(new EmptyResultSetError());
        }
        return Micro.succeed(
          users.map(
            (user) =>
            ({
              id: user.id as unknown as UserId,
              email: user.email,
              name: user.name,
              ssoId: user.ssoId ?? undefined,
              createdAt: user.createdAt,
            } as User)
          )
        );
      })
    );
  }
}
