import { NextResponse } from "next/server";
import { databaseLiveness } from "@/lib/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness, for an uptime monitor.
 *
 * No session is required, because a monitor cannot hold one — and that decides
 * everything else about this endpoint. Two fields go out: whether the database
 * answered, and how long it took. Nothing else.
 *
 * What is deliberately absent: the SQL Server version and edition, the
 * database name, file paths, connection counts, process memory, uptime, and
 * the text of any error. Each is free reconnaissance for whoever finds the
 * URL. A version string tells an attacker which CVEs to try; a connection
 * error names the host and the login. The detailed view lives at /system
 * behind an admin session. This one stays deaf.
 *
 * 200 means the database answered. 503 means it did not, and says no more.
 */
export async function GET() {
  const { ok, latencyMs } = await databaseLiveness();

  return NextResponse.json(
    ok ? { status: "ok", latencyMs } : { status: "unavailable" },
    {
      status: ok ? 200 : 503,
      // A cached health check reports the state of a minute ago, which is the
      // one minute that matters.
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
