/**
 * Runs once per server process, before the first request.
 *
 * Environment problems should surface here, at boot, in a log an operator is
 * already watching — not three hours later when a buyer fills in a form and
 * the enquiry evaporates. In production a missing lead-capture variable throws
 * from `assertEnv` and the process refuses to come up, which is the loud
 * failure the silent one deserved.
 */
export async function register() {
  // Only the Node runtime has a console worth writing to and the full set of
  // variables; the edge runtime sees a subset.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnv } = await import("./lib/env");
    assertEnv();
  }
}
