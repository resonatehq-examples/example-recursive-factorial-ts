![resonate example application readme banner](/assets/resonate-example-app-readme-banner.png)

# Recursive factorial

**Resonate TypeScript SDK**

This example showcases Resonate's ability to durably invoke functions recursively.

Instructions on [How to run this example](#how-to-run-this-example) are below.

![distributed factorial gif](/assets/distributed-factorial-ts.gif)

## The problem

There are two problems to address here.

The first problem exists within the context of platforms that provide "Durable Execution".

Most of these platforms force the usage of a "workflow" function and "step" / "activity" functions.
The reason is that the "workflow" function is paired with an event history, queue, or journal which is used during a replay of the execution to know where to resume the execution without repeating side-effects.

This separation makes for a messy and expensive process for a Workflow function to directly call itself.
It is messy in that the code is usually overly complicated, and it is expensive in that there are multiple events per invocation entered into the history, each of them often requiring a network call.
So, how do you have simple, clean, but also durable code?

The second problem is more general, which is how do you cache results for expensive operations and not repeat them?

Consider calculating factorials. The result of any given factorial is always the same. The greater the factorial, the more expensive the operation is.
It would be ideal to cache the result of an expensive operation in case it is needed again right?

But where is the cache? What does the code look like to access it? How do you check if there is already a result there?

## The solution

Resonate's solution to both of these problems is the Durable Promise.

The first thing to know is that there is a 1:1 relationship between a Durable Promise and a function invocation.
That is — when a function is invoked, a single Durable Promise is created.
The Durable Promise represents the invocation event.
And it remains in a PENDING state until it is either RESOLVED with a result or REJECTED by the business process.

This means that there is no distinction between "workflow" functions and "step"/"activity" functions. There are just Durable Functions.

And this means it is relatively trivial for a function to call itself recursively without the code looking messy, and without that operation being expensive in terms of bloating an event history and unnecessary network calls.

The second thing to know is that a Durable Promise is a write once register.
A Durable Promise is permanent and once it has a value, it will never change.

To be a permanent write once register, each Durable Promise must have a unique ID in the system. Therefore the result of a Durable Promise becomes perfectly cacheable, with no cache invalidation required.

Again, consider calculating factorials.
If you ever have to calculate the factorial of 5, you can attach the "factorial-5" promise ID to that invocation.
Once that has been calculated the promise will resolve permanently storing the value inside of it.

If any other operation needs the value of factorial 5, it can use the promise ID "factorial-5" and immediately receive the result.

## About this example

This example has a single `factorial()` funtion that calls itself recursively:

```typescript
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

  return n * result;
}

resonate.register("factorial", factorial);
```

This function runs in the `factorialWorker.ts` file.

As the operator, we recommend that you run three separate instances of the worker.

Then you will run the `clientFactorial.ts` script while supplying a number to calculate.

You will see the factorial calculations spread out across the workers, each awaiting the result of factorial n-1.

If you use a large enough number (anything 8 or above), you will see a delay while the final result is calculated.

After, try running the same factorial calculation, or any number less than that, and you will see the calculation complete almost instantly.

This is because the result of each of the previously calculated factorials has been permanently "cached" in respective Durable Promises.

You can see from the previous code sample that each invocation corresponds to the id "factorial-n" where n is the number.

So, moving forward, if any other operation in the application needs the result of a factorial, it need only call `factorial()` with the promise ID of `factorial-n` — and any factorial that has already been calculated will provide the result directly from the cached promise ID().

## How to run this example

Run the Resonate Server:

```shell
resonate dev
```

Install dependencies:

```shell
bun install
```

Run multiple instances of the factorial worker (recommend 3):

```shell
bun run factorialWorker.ts
```

Calculate a factorial

```shell
bun run factorialClient.ts 6
```
