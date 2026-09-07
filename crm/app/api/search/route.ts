import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { searchAll, MIN_TERM_LENGTH } from "@/lib/repos/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Feeds the command palette.
 *
 * Results are scoped to the caller, so this response is private to one user:
 * `no-store` keeps it out of any shared cache between here and the browser.
 *
 * The cap is small on purpose. A palette shows what fits on a screen; the rest
 * of the answer lives at /search, which is a page and can show more.
 */

const MAX_RESULTS = 20;
const MAX_TERM_LENGTH = 120;
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const term = (req.nextUrl.searchParams.get("q") ?? "")
    .trim()
    .slice(0, MAX_TERM_LENGTH);

  if (term.length < MIN_TERM_LENGTH) {
    return NextResponse.json({ term, results: [] }, { headers: NO_STORE });
  }

  try {
    const results = await searchAll(term, session.user.role, session.user.id, MAX_RESULTS);
    return NextResponse.json({ term, results }, { headers: NO_STORE });
  } catch (e) {
    // The caller is signed in, but a driver message still tells them nothing
    // useful and may name columns.
    console.error("search failed", e);
    return NextResponse.json({ error: "search failed" }, { status: 500 });
  }
}
