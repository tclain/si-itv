# Code Snippet, Stack Influence, Tim

This repository demonstrates a refactoring from simpler legacy code to scalable conventions that enable teams to build and maintain complex applications at scale.

**Note:** This codebase is anonymized (~90% match with original) and serves as an example of architectural patterns and principles.

## Overview

The old code (in `old`) was _fine_ for small-scale applications but lacked the structure needed to scale the codebase and team. It used express with some "controller" code.

This refactoring introduces consistent patterns, explicit error handling, and composable architecture that pays dividends as the application grows to dozens or hundreds of endpoints with complex integration logic.

## Key Patterns & File Structure

### Use Case Pattern: Endpoint → Procedure → Use Case → Service

Each feature follows a consistent three-layer pattern in a single file:

```
src/
  auth/
    get-next-auth-step.ts    # Example use case file
    get-current-user.ts      # Follows same pattern
```

**Structure:**

1. **Service** Single Responsibility Domain

- Single set of capabilities (using classes, but could be a js module)

2. **Use Case** Coordination layer

   - Takes `opts: { input, deps }`
   - Returns `Micro.Micro<Result, Error>`
   - Independent of context (app, cli, webhooks etc...)

3. **Procedure** (Boundary Layer) - Connects use cases to actual implementations (sessions, datase) and build deps

   - Takes `{ input, ctx }: ContextWithInput`
   - Handles authentication, parsing, dependency injection
   - Returns `Promise<Result>`

4. **Endpoint** Transport layer: plugs a procedure to an http hanlder

**Example:** See `src/auth/get-next-auth-step.ts` as the reference implementation.

## Core Principles

### 1. Invalid State Unrepresentable

Types are designed so invalid states cannot be expressed:

```typescript
// ❌ Old: Could have invalid combinations
type User = { id: number | null; email: string };

// ✅ New: Invalid states are impossible
type UserId = string & Brand<"UserId">; // Branded type prevents mixing
type User = UserEntity & { id: UserId }; // Always has valid id
type AuthStep = "logged-in" | "requires-sso" | "requires-password"; // Exhaustive union
```

**Files:** `src/auth/types.ts`, `src/db/schema.ts`

### 2. Errors as Values

Errors are first-class values in the type system, not exceptions:

```typescript
// ✅ Errors are part of the return type
Micro.Micro<User, UserNotFoundError | DatabaseError>;

// ✅ Explicit error handling and remapping from low level error to domain error
pipe(
  userService.getUserById(userId),
  Micro.mapError((error) => {
    if (error instanceof UserNotFoundError) {
      return new UnauthorizedError("Invalid session");
    }
    return error;
  })
);
```

**Files:** `src/auth/errors.ts`, `src/db/errors.ts`

### 3. Parse Don't Validate

Input parsing transforms unknown data into typed values at the boundary of the system, rather than validating and keeping it as `unknown`:

```typescript
// ✅ Parse transforms unknown → typed
const parseEffect = parse(UserId, input);
const validatedUserId = await Micro.runPromiseExit(parseEffect);

// ❌ Old: Validate but keep as unknown
if (!isValid(input)) throw new Error("Invalid");
```

**Files:** `src/core/parse.ts`, `src/auth/types.ts`

### 4. No Empty Values as Semantics

Avoid using `null`, `undefined`, or empty strings to represent meaningful states:

```typescript
// ✅ Explicit state representation
type AuthStep = "logged-in" | "requires-sso" | "requires-password";

// ✅ Explicit null handling
if (user === null) {
  return Micro.succeed("requires-password" as AuthStep);
}
```

**Files:** `src/auth/types.ts`, `src/auth/get-next-auth-step.ts`

### 5. Composable & Swappable

Each step is a Micro/Effect (a lazy unified sync/async operation) with built-in support for chaining, wrapping etc...

Each unit of your system can be seen as DAG of operations. Once a step is in error, further dependencies are skipped (error shortcircuit).

### 6. Opinionated but Not Dogmatic Layering

Our architecture borrows some ideas from Hexagonal / Onion / DDD Architecture, but tries not dogmatic.
We want code to be reused, easy to test, to be consistent and to be replaceable with functionally identical alternative implementations.

## Micro as One Implementation Approach

This codebase uses [Effect](https://effect.website/) (inspired by ZIO in scala) for:

- **Error handling** - Typed errors in return types
- **Composition** - Piping operations with `pipe()`
- **Async operations** - `Micro.Micro<T, E>` for composable computations
- **Resource management** - Safe handling of side effects

However, these principles can be achieved with pure TypeScript with some types & a bit of discipline. Here's an alternative implementation:

**Pure TypeScript Result Pattern:**

```typescript
// Result type - represents success or failure
type Result<T, E> = { success: true; value: T } | { success: false; error: E };

// Helper functions
const succeed = <T>(value: T): Result<T, never> => ({ success: true, value });
const fail = <E>(error: E): Result<never, E> => ({ success: false, error });

// Composition helpers
const map = <T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> => {
  return result.success ? succeed(fn(result.value)) : result;
};

const flatMap = <T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  return result.success ? fn(result.value) : result;
};

const mapError = <T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> => {
  return result.success ? result : fail(fn(result.error));
};

// Promise-based async Result
type AsyncResult<T, E> = Promise<Result<T, E>>;

const fromPromise = async <T, E>(
  promise: Promise<T>,
  mapError: (error: unknown) => E
): Promise<Result<T, E>> => {
  try {
    const value = await promise;
    return succeed(value);
  } catch (error) {
    return fail(mapError(error));
  }
};

// Example: Use case with pure TypeScript
export const getAuthNextStepUseCase = (opts: {
  input: { user: User | null };
  deps: { userQueries: IUserQueries };
}): Result<AuthStep, never> => {
  if (opts.input.user === null) {
    return succeed("requires-password" as AuthStep);
  }
  if (opts.input.user.ssoId) {
    return succeed("requires-sso" as AuthStep);
  }
  return succeed("logged-in" as AuthStep);
};

// Example: Procedure with pure TypeScript
export const getNextAuthStepProcedure = async ({
  input,
  ctx,
}: ContextWithInput): Promise<AuthStep> => {
  // Compose operations
  const userResult = await fromPromise(
    userService.getUserById(userId),
    (error) => new UnauthorizedError("Invalid user")
  );

  // Handle user lookup, then get auth step
  const user = userResult.success ? userResult.value : null;
  const stepResult = getAuthNextStepUseCase({
    input: { user },
    deps: { userQueries: UserQueries.make(ctx.db) },
  });

  // Result type guarantees success (never fails in this case)
  return stepResult.value;
};

// Example: Composing multiple operations
const composedOperation = async (
  userId: UserId
): Promise<Result<User, UnauthorizedError>> => {
  const userResult = await fromPromise(
    userService.getUserById(userId),
    () => new UnauthorizedError("User not found")
  );

  // Transform success value
  const transformed = map(userResult, (user) => ({
    ...user,
    displayName: `${user.name} (${user.email})`,
  }));

  // Chain another operation
  return flatMap(transformed, (user) =>
    user.ssoId ? succeed(user) : fail(new UnauthorizedError("SSO required"))
  );
};
```

## AI Usage

This repository and documentation were created with assistance from AI tools:

- **README Documentation** - AI was used to help write and structure this README, explaining the refactoring patterns, principles, and architectural decisions. Content has been carefully edited and proofed.
- **Code Anonymization** - Cursor autocomplete and AI assistance were used to anonymize the codebase (~90% match with original), replacing domain-specific names and details while preserving the architectural patterns and principles
