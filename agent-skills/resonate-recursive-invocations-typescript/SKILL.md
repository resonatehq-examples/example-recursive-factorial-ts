---
name: resonate-recursive-invocations-typescript
description: Implement durable recursive invocation patterns in Resonate TypeScript/Node apps by defining recursive generator functions, using ctx.rpc self-calls with deterministic Durable Promise IDs, and triggering with a stable top-level promise id for cacheable results and replay. Use when a Resonate function must call itself or repeat subproblem calls (factorial, divide-and-conquer, memoized recursion) and you want durable caching across runs.
---

# Skill: Implement recursive invocations (TypeScript)

## Summary
- Enable durable recursion by pairing each invocation with a deterministic Durable Promise id.
- Implement self-invocation with `ctx.rpc` and a poll target for distributed execution.
- Trigger recursion from a client with `resonate.rpc` and a stable top-level promise id.

## Preconditions / Assumptions
- Assume a Resonate server is available (for example, `resonate dev`).
- Assume `@resonatehq/sdk` is installed and TypeScript can be executed (for example, with Bun).
- Assume recursion depth is reasonable for the runtime stack and base cases are defined.

## Inputs
- Choose a durable function name (for example, `factorial`).
- Define a deterministic promise id scheme for each subproblem (for example, `factorial-${n}`).
- Choose a worker group name (for example, `factorial-workers`).

## Outputs
- Create a worker file that registers the recursive function.
- Create a client file that triggers the recursion with a stable promise id.
- Produce logs and results that demonstrate durable caching across runs.

## Core concepts
- Use one Durable Promise per invocation; treat the promise id as a write-once cache key.
- Use `ctx.rpc` inside the generator to call the same function recursively.
- Pass `ctx.options({ target, id })` to route work and pin the Durable Promise id.
- Use `resonate.rpc(promiseId, fnName, args, options)` for the top-level trigger.

## Procedure

### 1) Define a deterministic promise id scheme
Intent: Make recursion cacheable and replay-safe.

- Choose a stable id derived only from input arguments.
- Keep ids globally unique within the application namespace.

Example scheme:
```
factorial-${n}
```

### 2) Implement the recursive worker
Intent: Register a durable function that calls itself with a stable id.

Create a worker similar to `factorialWorker.ts`:

```typescript
import { Resonate, Context } from "@resonatehq/sdk";
import assert from "assert";

const resonate = Resonate.remote({ group: "factorial-workers" });

function* factorial(ctx: Context, n: number): Generator<any, number, any> {
  console.log(`Calculating factorial(${n})`);
  if (n <= 1) {
    return 1;
  }
  const result = yield* ctx.rpc(
    "factorial",
    n - 1,
    ctx.options({
      target: "poll://any@factorial-workers",
      id: `factorial-${n - 1}`,
    })
  );
  assert(typeof result === "number", `Expected number, got ${typeof result}`);
  return n * result;
}

resonate.register("factorial", factorial);
console.log("factorial worker running...");
```

### 3) Implement the client trigger
Intent: Start recursion with a stable top-level promise id.

Create a client similar to `factorialClient.ts`:

```typescript
import { Resonate } from "@resonatehq/sdk";
import assert from "assert";

const resonate = Resonate.remote({ group: "factorial-client" });

async function main(): Promise<void> {
  const arg = process.argv[2];
  const n = arg ? Number(arg) : 5;
  assert(!isNaN(n), "input must be a number");
  assert(n > 0, "input must be a non-negative number");

  const result = await resonate.rpc(
    `factorial-${n}`,
    "factorial",
    n,
    resonate.options({ target: "poll://any@factorial-workers" })
  );
  console.log(`Factorial of ${n} is ${result}`);
  resonate.stop();
}

main();
```

### 4) Run workers and trigger the recursion
Intent: Distribute recursive work across multiple worker instances.

Commands:

```shell
resonate dev
```

```shell
bun install
```

```shell
bun run factorialWorker.ts
```

Run the worker command in multiple terminals (recommend 3).

Trigger a factorial:

```shell
bun run factorialClient.ts 6
```

Expected outcome:
- Workers log a descending chain like `Calculating factorial(6)` ... `Calculating factorial(1)`.
- Client prints `Factorial of 6 is 720`.

### 5) Verify durable caching
Intent: Confirm that previously computed subproblems return immediately.

- Re-run the same client command and observe a much faster response.
- Expect fewer or no new recursive logs for already-resolved promise ids.

## Code patterns

### Recursive invocation with deterministic promise id

```typescript
function* fn(ctx: Context, input: Input): Generator<any, Output, any> {
  if (baseCase(input)) {
    return baseResult(input);
  }
  const sub = deriveSubproblem(input);
  const subId = `fn-${sub.key}`;
  const subResult = yield* ctx.rpc(
    "fn",
    sub.value,
    ctx.options({ target: "poll://any@worker-group", id: subId })
  );
  return combine(input, subResult);
}
```

### Top-level trigger with stable promise id

```typescript
await resonate.rpc(
  `fn-${input.key}`,
  "fn",
  input.value,
  resonate.options({ target: "poll://any@worker-group" })
);
```

## Verification
- Run `bun run factorialWorker.ts` and see `factorial worker running...`.
- Run `bun run factorialClient.ts 6` and see `Factorial of 6 is 720`.
- Re-run the client command and see faster completion with fewer recursive logs.

Consider done when all three checks pass.

## Troubleshooting
- If the client hangs, ensure workers are running and the poll target matches the worker group.
- If recursion never terminates, confirm the base case and input validation.
- If results are not cached, confirm the promise id is deterministic and passed via `ctx.options({ id })` and the top-level `resonate.rpc` id.

## Pitfalls / Anti-patterns
- Avoid non-deterministic promise ids (random, timestamps), which break caching.
- Avoid missing or weak base cases, which cause infinite recursion.
- Avoid heavy side effects inside the recursive function; keep it deterministic for replay.
- Avoid mismatched worker group names or poll targets.

## Extensions
- Apply the same pattern to divide-and-conquer or dynamic programming problems.
- Add input validation and typed result assertions for safer recursion.
