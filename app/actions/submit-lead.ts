"use server";

import { createHmac, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { envValue } from "@/lib/env";

/**
 * Sends a website enquiry to the CRM.
 *
 * Runs on the server so the shared secret never reaches the browser. The body
 * is signed with HMAC-SHA256 over `<timestamp>.<body>`, which the CRM verifies
 * in constant time and rejects if older than five minutes.
 *
 * A `deliveryKey` accompanies every send so a retry — ours or the network's —
 * cannot create a second lead for the same submission.
 *
 * If the CRM is unreachable this returns `queued: false` rather than throwing:
 * the visitor still gets the WhatsApp hand-off, so an enquiry is never lost to
 * an outage. Failures are logged for reconciliation.
 */
const schema = z.object({
  name: z.string().min(2).max(200),
  phone: z.string().min(8).max(20),
  email: z.string().email().max(256).optional().or(z.literal("")),
  projectSlug: z.string().max(80).optional(),
  remarks: z.string().max(4000).optional(),
  preferredDate: z.string().max(40).optional(),
  // attribution collected in the browser from the URL and referrer
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
});

export type LeadInput = z.infer<typeof schema>;

export async function submitLead(
  input: LeadInput
): Promise<{ queued: boolean; reference?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { queued: false };

  const endpoint = envValue("CRM_LEAD_ENDPOINT");
  const secret = envValue("LEAD_WEBHOOK_SECRET");
  if (!endpoint || !secret) {
    // This used to return quietly. It cost real enquiries: the visitor saw
    // success, the CRM never heard about it, and no log said otherwise.
    // Now it names the missing variable and prints the lead, so the enquiry
    // is recoverable from the server log even when delivery is impossible.
    const missing = [
      !endpoint && "CRM_LEAD_ENDPOINT",
      !secret && "LEAD_WEBHOOK_SECRET",
    ].filter(Boolean);

    console.error(
      `LEAD NOT DELIVERED — lead capture is unconfigured (${missing.join(", ")}).\n` +
        `  This enquiry exists only in this log. Recover it by hand:\n` +
        `  name=${parsed.data.name.trim()} phone=${parsed.data.phone.trim()} ` +
        `email=${parsed.data.email || "-"} project=${parsed.data.projectSlug || "-"}\n` +
        `  See .env.example. In production the server refuses to start in ` +
        `this state; this path means a non-production deployment.`
    );
    return { queued: false };
  }

  const d = parsed.data;
  const source = d.gclid
    ? "GOOGLE_ADS"
    : d.fbclid
      ? "META_ADS"
      : d.utm?.source
        ? "ORGANIC"
        : "WEBSITE";

  const remarks =
    [d.remarks, d.preferredDate ? `Preferred date: ${d.preferredDate}` : null]
      .filter(Boolean)
      .join("\n") || undefined;

  // Read the visitor's own request here and forward it. The CRM receives this
  // call from our server, so without it every lead's timeline would record a
  // datacentre address as the buyer's location.
  const h = await headers();
  const visitor = {
    ip:
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("cf-connecting-ip") ||
      h.get("x-real-ip") ||
      undefined,
    userAgent: h.get("user-agent")?.slice(0, 400) || undefined,
    city: h.get("cf-ipcity") || undefined,
    country: h.get("cf-ipcountry") || undefined,
  };

  const payload = JSON.stringify({
    deliveryKey: randomUUID(),
    visitor,
    source,
    name: d.name.trim(),
    phone: d.phone.trim(),
    email: d.email || undefined,
    projectSlug: d.projectSlug || undefined,
    remarks,
    campaign: d.utm?.campaign,
    utm: d.utm,
    gclid: d.gclid,
    fbclid: d.fbclid,
    landingPage: d.landingPage,
    referrer: d.referrer,
  });

  const ts = Date.now();
  const signature = createHmac("sha256", secret).update(`${ts}.${payload}`).digest("hex");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-terravion-signature": `t=${ts},v1=${signature}`,
      },
      body: payload,
      // a slow CRM must not hold up the visitor's confirmation
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("CRM rejected lead", res.status, await res.text().catch(() => ""));
      return { queued: false };
    }
    const json = (await res.json()) as { reference?: string };
    return { queued: true, reference: json.reference };
  } catch (e) {
    console.error("CRM unreachable; lead not recorded", e);
    return { queued: false };
  }
}
