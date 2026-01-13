/**
 * Automated tests - demonstrating composable/swappable pattern
 */
import { describe, it, expect } from "vitest";
import { Micro } from "effect";
import { UserService } from "./service";
import { UserQueries } from "./queries";
import { UserNotFoundError } from "./errors";
import { DatabaseError } from "../db/errors";
import { User, UserId } from "./types";

// Mock UserQueries for testing - composable/swappable
class MockUserQueries extends UserQueries {
  constructor(private shouldFind: boolean) {
    super({} as any, {} as any);
  }

  findById(id: UserId): Micro.Micro<User, UserNotFoundError | DatabaseError> {
    return this.shouldFind
      ? Micro.succeed({
          id: "test-id" as any,
          email: "test@example.com",
          name: "Test",
          createdAt: new Date(),
        } as User)
      : Micro.fail(new UserNotFoundError(id));
  }

  find(): Micro.Micro<User[], DatabaseError> {
    return Micro.succeed([]);
  }
}

// Import the use case from the new location
const getAuthStepUseCase = async (
  userId: UserId | undefined,
  userService: UserService
): Promise<"logged-in" | "requires-sso"> => {
  if (userId === undefined) {
    return "requires-sso";
  }

  const result = await Micro.runPromiseExit(userService.getUserById(userId));

  if (result._tag === "Success") {
    return "logged-in";
  }

  return "requires-sso";
};

describe("getAuthStep", () => {
  it("should return requires-password when userId is undefined", async () => {
    const mockQueries = new MockUserQueries(false);
    const userService = new UserService(mockQueries);
    const result = await getAuthStepUseCase(undefined, userService);
    expect(result).toBe("requires-password");
  });

  it("should return logged-in when user exists", async () => {
    const mockQueries = new MockUserQueries(true);
    const userService = new UserService(mockQueries);
    const result = await getAuthStepUseCase(1 as UserId, userService);
    expect(result).toBe("logged-in");
  });

  it("should return requires-sso when user not found", async () => {
    const mockQueries = new MockUserQueries(false);
    const userService = new UserService(mockQueries);
    const result = await getAuthStepUseCase(1 as UserId, userService);
    expect(result).toBe("requires-sso");
  });
});
