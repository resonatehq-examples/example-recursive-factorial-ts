import { Resonate } from "@resonatehq/sdk";
import assert from "assert";

const resonate = Resonate.remote({
  group: "factorial-client",
});

async function main(): Promise<void> {
  let n: number;
  try {
    const arg = process.argv[2];
    n = arg ? Number(arg) : 5;
    assert(!isNaN(n), "input must be a number");
    assert(n > 0, "input must be a non-negative number");
  } catch (error) {
    resonate.stop();
    process.exit(1);
  }

  try {
    const result = await resonate.rpc(
      `factorial-${n}`,
      "factorial",
      n,
      resonate.options({
        target: "poll://any@factorial-workers",
      })
    );
    console.log(`Factorial of ${n} is ${result}`);
  } catch (error) {
    console.log(error);
  }
  resonate.stop();
}

main();
