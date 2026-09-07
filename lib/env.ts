import { z } from "zod";

/**
 * Environment validation.
 *
 * This exists because of a specific, expensive failure: `submitLead` read
 * `CRM_LEAD_ENDPOINT` and `LEAD_WEBHOOK_SECRET` straight from `process.env`,
 * and when either was unset it returned `{ queued: false }` and moved on. The
 * visitor still got the WhatsApp hand-off and saw success. The enquiry simply
 * never reached the CRM, and nothing anywhere said so. A silent failure that
 * looks like a success is the worst kind, and it was sitting on the revenue
 * path.
 *
 * Two rules follow from that:
 *
 *   1. Variables are grouped by subsystem, not thrown into one list. A missing
 *      Maps key should disable a map. It should not stop the site booting, and
 *      it certainly should not be conflated with a missing webhook secret.
 *   2. Lead capture is the one subsystem allowed to halt a production boot. If
 *      the site cannot record an enquiry, it should not be taking enquiries.
 */

const isProd = process.env.NODE_ENV === "production";

/** A secret long enough to be one. Checked for length, never printed. */
const secret = z.string().min(32, "must be at least 32 characters");
const url = z.string().url("must be a full URL including https://");

const schema = z.object({
  // ── lead capture · critical ───────────────────────────────────────────
  CRM_LEAD_ENDPOINT: url.optional(),
  LEAD_WEBHOOK_SECRET: secret.optional(),

  // ── site identity ─────────────────────────────────────────────────────
  NEXT_PUBLIC_SITE_URL: url.optional(),

  // ── analytics · optional, degrade quietly ─────────────────────────────
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z
    .string()
    .regex(/^G-[A-Z0-9]{6,}$/, "looks like G-XXXXXXXXXX")
    .optional(),
  NEXT_PUBLIC_GTM_ID: z
    .string()
    .regex(/^GTM-[A-Z0-9]{4,}$/, "looks like GTM-XXXXXXX")
    .optional(),
  NEXT_PUBLIC_CLARITY_ID: z
    .string()
    .regex(/^[a-z0-9]{6,}$/, "is a lowercase alphanumeric Clarity project id")
    .optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z
    .string()
    .regex(/^\d{6,}$/, "is a numeric pixel id")
    .optional(),

  // ── search console verification · optional ────────────────────────────
  // Not secrets — both end up in a public <meta> tag — but they are read on
  // the server only, so they carry no NEXT_PUBLIC_ prefix and never enter the
  // browser bundle. Length is the only check worth making: the tokens are
  // opaque, and the failure mode of a wrong one is a console that will not
  // verify, which the operator sees immediately.
  GOOGLE_SITE_VERIFICATION: z.string().min(10, "is too short to be a Google token").optional(),
  BING_SITE_VERIFICATION: z.string().min(10, "is too short to be a Bing token").optional(),

  // ── maps · optional ───────────────────────────────────────────────────
  NEXT_PUBLIC_GOOGLE_MAPS_KEY: z.string().min(20).optional(),

  // ── SQL Server · read by the CRM, listed so a shared .env validates ───
  SQLSERVER_HOST: z.string().min(1).optional(),
  SQLSERVER_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  SQLSERVER_DATABASE: z.string().min(1).optional(),
  SQLSERVER_USERNAME: z.string().min(1).optional(),
  SQLSERVER_PASSWORD: z.string().min(1).optional(),
});

type RawEnv = z.infer<typeof schema>;

/**
 * Subsystems, each with the variables it needs and what breaks without them.
 *
 * `critical` means a production boot fails rather than continues degraded.
 * Only lead capture carries it, and only in production — a developer running
 * the site locally without CRM credentials is a normal Tuesday.
 */
const SUBSYSTEMS = [
  {
    name: "Lead capture",
    critical: true,
    vars: ["CRM_LEAD_ENDPOINT", "LEAD_WEBHOOK_SECRET"],
    consequence:
      "Website enquiries cannot reach the CRM. Visitors would see a success " +
      "message while the enquiry is discarded.",
  },
  {
    name: "Analytics",
    critical: false,
    vars: ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
    consequence: "No traffic or conversion measurement. The site works.",
  },
  {
    name: "Tag Manager",
    critical: false,
    vars: ["NEXT_PUBLIC_GTM_ID"],
    consequence:
      "No GTM container loads. GA4 is independent of this and keeps working; " +
      "only tags managed from the GTM console are absent.",
  },
  {
    name: "Microsoft Clarity",
    critical: false,
    vars: ["NEXT_PUBLIC_CLARITY_ID"],
    consequence: "No session replays or heatmaps. Nothing else is affected.",
  },
  {
    name: "Search verification",
    critical: false,
    vars: ["GOOGLE_SITE_VERIFICATION", "BING_SITE_VERIFICATION"],
    consequence:
      "The verification <meta> tags are omitted, so Search Console and Bing " +
      "Webmaster Tools cannot confirm ownership by the HTML-tag method. " +
      "Harmless if the properties were verified by DNS instead.",
  },
  {
    name: "Meta Pixel",
    critical: false,
    vars: ["NEXT_PUBLIC_META_PIXEL_ID"],
    consequence: "Meta ad campaigns cannot attribute conversions.",
  },
  {
    name: "Maps",
    critical: false,
    vars: ["NEXT_PUBLIC_GOOGLE_MAPS_KEY"],
    consequence: "Location maps do not render. Addresses still display.",
  },
  {
    name: "SQL Server",
    critical: false,
    vars: ["SQLSERVER_HOST", "SQLSERVER_DATABASE", "SQLSERVER_USERNAME", "SQLSERVER_PASSWORD"],
    consequence:
      "The marketing site does not use SQL Server directly; the CRM does. " +
      "Listed here so a shared .env is validated in one place.",
  },
] as const;

export type SubsystemName = (typeof SUBSYSTEMS)[number]["name"];

export interface EnvReport {
  ok: boolean;
  values: RawEnv;
  /** Variables that failed their format check, with the reason. */
  invalid: { key: string; reason: string }[];
  /** Subsystem name → the variables it is missing. */
  disabled: Record<string, string[]>;
  criticalFailures: string[];
}

function inspect(): EnvReport {
  const parsed = schema.safeParse(process.env);

  const invalid: { key: string; reason: string }[] = [];
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      invalid.push({ key: String(issue.path[0]), reason: issue.message });
    }
  }

  // Even when one value is malformed, treat the rest as usable rather than
  // discarding everything — a bad pixel id must not disable lead capture.
  const values = (parsed.success ? parsed.data : {}) as RawEnv;
  const raw = process.env as Record<string, string | undefined>;

  const disabled: Record<string, string[]> = {};
  const criticalFailures: string[] = [];

  for (const sub of SUBSYSTEMS) {
    const missing = sub.vars.filter((v) => {
      const present = raw[v] !== undefined && raw[v] !== "";
      const isInvalid = invalid.some((i) => i.key === v);
      return !present || isInvalid;
    });
    if (missing.length) {
      disabled[sub.name] = [...missing];
      if (sub.critical && isProd) criticalFailures.push(sub.name);
    }
  }

  return {
    ok: invalid.length === 0 && Object.keys(disabled).length === 0,
    values,
    invalid,
    disabled,
    criticalFailures,
  };
}

let cached: EnvReport | null = null;

export function envReport(): EnvReport {
  cached ??= inspect();
  return cached;
}

/** Typed access. Undefined means "not configured", never an empty string. */
export function envValue<K extends keyof RawEnv>(key: K): RawEnv[K] {
  return envReport().values[key];
}

/** Is a subsystem usable right now? Components ask this instead of guessing. */
export function isEnabled(name: SubsystemName): boolean {
  return !(name in envReport().disabled);
}

/**
 * Print the diagnosis and, in production, refuse to boot on a critical gap.
 *
 * Called once from instrumentation.ts. The output names the variable, the
 * subsystem and the consequence — because "invalid environment" in a log at
 * 2am tells nobody which of eleven values to go and look at.
 */
export function assertEnv(): void {
  const r = envReport();

  if (r.invalid.length) {
    console.error("\n  Environment — malformed values\n");
    for (const i of r.invalid) console.error(`    ${i.key}  ${i.reason}`);
  }

  const names = Object.keys(r.disabled);
  if (names.length) {
    console.error("\n  Environment — subsystems disabled\n");
    for (const n of names) {
      const sub = SUBSYSTEMS.find((s) => s.name === n)!;
      console.error(`    ${n}`);
      console.error(`      missing:  ${r.disabled[n].join(", ")}`);
      console.error(`      effect:   ${sub.consequence}`);
    }
    console.error("\n  See .env.example for every variable and what it does.\n");
  }

  if (r.criticalFailures.length) {
    console.error(
      `  Refusing to start in production: ${r.criticalFailures.join(", ")} cannot function.\n`
    );
    // Only the critical subsystem's variables. Listing every optional gap here
    // too would read as "all of these are required", sending an operator off
    // to find a Maps key at 2am when the actual blocker is two values.
    const blocking = r.criticalFailures.flatMap((n) => r.disabled[n] ?? []);
    throw new Error(
      `Missing required environment for: ${r.criticalFailures.join(", ")}. ` +
        `Set ${blocking.join(", ")} and restart. ` +
        `Other subsystems are degraded but not blocking — see the log above.`
    );
  }

  if (r.ok) console.log("  Environment: all subsystems configured.");
}
