import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { createLead, type LeadSource } from "@/lib/repos/leads";
import { forwardedContext } from "@/lib/request-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The connection between the public website and the CRM.
 *
 * Every enquiry — website form, WhatsApp, Google, Meta, a landing page — POSTs
 * here and becomes a lead with its attribution attached.
 *
 * Three things this endpoint has to survive, because it sits on the open
 * internet with no session behind it:
 *
 *   1. Forgery. The body is signed with HMAC-SHA256 using a shared secret and
 *      compared in constant time. An unsigned request is rejected outright.
 *   2. Replay. The signature covers a timestamp, and anything older than five
 *      minutes is refused, so a captured request cannot be resent tomorrow.
 *   3. Retries. Ad platforms retry aggressively. A `deliveryKey` is recorded
 *      with a primary-key constraint, so the second delivery of an event
 *      returns the first result instead of creating a second lead.
 */

const bodySchema = z.object({
  deliveryKey: z.string().min(8).max(128).optional(),
  source: z
    .enum([
      "WEBSITE",
      "WHATSAPP",
      "GOOGLE_ADS",
      "META_ADS",
      "ORGANIC",
      "PHONE",
      "WALK_IN",
      "BROKER",
      "REFERRAL",
      "MANUAL",
      "PORTAL",
      "OTHER",
    ])
    .default("WEBSITE"),
  name: z.string().min(2).max(200),
  phone: z.string().min(8).max(20),
  whatsapp: z.string().max(20).optional(),
  email: z.string().email().max(256).optional().or(z.literal("")),
  projectSlug: z.string().max(80).optional().or(z.literal("")),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  preferredFacing: z
    .enum([
      "NORTH",
      "SOUTH",
      "EAST",
      "WEST",
      "NORTH_EAST",
      "NORTH_WEST",
      "SOUTH_EAST",
      "SOUTH_WEST",
    ])
    .optional(),
  plotSizeMin: z.number().nonnegative().optional(),
  plotSizeMax: z.number().nonnegative().optional(),
  remarks: z.string().max(4000).optional(),
  campaign: z.string().max(200).optional(),
  utm: z
    .object({
      source: z.string().max(120).optional(),
      medium: z.string().max(120).optional(),
      campaign: z.string().max(200).optional(),
      term: z.string().max(200).optional(),
      content: z.string().max(200).optional(),
    })
    .optional(),
  gclid: z.string().max(200).optional(),
  fbclid: z.string().max(200).optional(),
  landingPage: z.string().max(400).optional(),
  referrer: z.string().max(400).optional(),

  // The originating visitor, forwarded by whichever front end took the
  // enquiry. Signed along with everything else, so it cannot be spoofed
  // without the shared secret.
  visitor: z
    .object({
      ip: z.string().max(64).optional(),
      userAgent: z.string().max(400).optional(),
      city: z.string().max(120).optional(),
      country: z.string().max(8).optional(),
    })
    .optional(),
});

const MAX_SKEW_MS = 5 * 60 * 1000;

function verifySignature(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  // format: t=<unix-ms>,v1=<hex>
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=").map((s) => s.trim()) as [string, string])
  );
  const ts = Number(parts.t);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_SKEW_MS) return false;

  const expected = createHmac("sha256", secret).update(`${ts}.${raw}`).digest();
  let given: Buffer;
  try {
    given = Buffer.from(parts.v1 ?? "", "hex");
  } catch {
    return false;
  }
  if (given.length !== expected.length) return false;
  return timingSafeEqual(given, expected);
}

export async function POST(req: NextRequest) {
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  if (!secret) {
    console.error("LEAD_WEBHOOK_SECRET is not configured; refusing all deliveries.");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const raw = await req.text();
  if (raw.length > 32_000) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  if (!verifySignature(raw, req.headers.get("x-terravion-signature"), secret)) {
    // Deliberately vague: a forger learns nothing about why it failed.
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const body = parsed.data;

  // ── idempotency ────────────────────────────────────────────────────
  if (body.deliveryKey) {
    const seen = await queryOne<{ LeadId: string | null }>`
      SELECT lead_id AS LeadId FROM webhook_deliveries WHERE delivery_key = ${body.deliveryKey}
    `;
    if (seen) {
      return NextResponse.json({ ok: true, leadId: seen.LeadId, replayed: true });
    }
  }

  const project = body.projectSlug
    ? await queryOne<{ Id: string }>`
        SELECT id AS Id FROM projects WHERE slug = ${body.projectSlug}
      `
    : null;

  try {
    const result = await createLead(
      {
        name: body.name.trim(),
        phone: body.phone,
        whatsapp: body.whatsapp || null,
        email: body.email || null,
        source: body.source as LeadSource,
        projectId: project?.Id ?? null,
        budgetMin: body.budgetMin ?? null,
        budgetMax: body.budgetMax ?? null,
        preferredFacing: body.preferredFacing ?? null,
        plotSizeMin: body.plotSizeMin ?? null,
        plotSizeMax: body.plotSizeMax ?? null,
        remarks: body.remarks ?? null,
        campaign: body.campaign ?? null,
        utmSource: body.utm?.source ?? null,
        utmMedium: body.utm?.medium ?? null,
        utmCampaign: body.utm?.campaign ?? null,
        utmTerm: body.utm?.term ?? null,
        utmContent: body.utm?.content ?? null,
        gclid: body.gclid ?? null,
        fbclid: body.fbclid ?? null,
        landingPage: body.landingPage ?? null,
        referrer: body.referrer ?? null,
      },
      null, // no signed-in actor; the website is the author
      forwardedContext(
        body.source === "WHATSAPP" ? "WHATSAPP" : body.source === "WEBSITE" ? "WEBSITE" : "API",
        body.visitor?.ip,
        body.visitor?.userAgent,
        body.visitor?.city,
        body.visitor?.country
      )
    );

    if (body.deliveryKey) {
      await query`
        INSERT INTO webhook_deliveries (delivery_key, source, lead_id)
        VALUES (${body.deliveryKey}, ${body.source}, ${result.id})
      `;
    }

    return NextResponse.json({
      ok: true,
      leadId: result.id,
      reference: result.reference,
      duplicate: result.duplicate,
    });
  } catch (e) {
    // Never surface a database error to an unauthenticated caller.
    console.error("lead webhook failed", e);
    return NextResponse.json({ error: "could not record lead" }, { status: 500 });
  }
}
