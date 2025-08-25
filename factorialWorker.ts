import { Resonate, Context } from "@resonatehq/sdk";
import assert from "assert";

const resonate = Resonate.remote({
  group: "factorial-workers",
});

function* factorial(ctx: Context, n: number): Generator<any, number, any> {
  console.log(`Calculating factorial(${n})`);
  if (n <= 1) {
    return 1;
  }
  const result = yield* ctx.rpc(
    "factorial",
    n - 1,
    ctx.options({ target: "poll://any@factorial-workers" })
  );
  assert(
    typeof result === "number",
    `Expected result to be a number, got ${typeof result}`
  );

  return n * result;
}

resonate.register("factorial", factorial);

console.log("factorial worker running...");
