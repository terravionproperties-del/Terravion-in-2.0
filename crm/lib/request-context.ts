import { headers } from "next/headers";

/**
 * Who is acting, from where, on what.
 *
 * Parsed from request headers at the moment of the action, because a timeline
 * entry written a second later cannot recover it. Deliberately small: a full
 * user-agent database would be more accurate and is not worth the dependency
 * for a field a salesperson glances at.
 *
 * Geo comes from Cloudflare's headers when the app sits behind it. There is no
 * IP-geolocation lookup here — doing one per activity would put a third-party
 * network call in the write path of every note.
 */
export interface RequestContext {
  ip: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  deviceType: "desktop" | "mobile" | "tablet" | null;
  city: string | null;
  country: string | null;
  channel: "CRM" | "WEBSITE" | "WHATSAPP" | "API";
}

export async function requestContext(
  channel: RequestContext["channel"] = "CRM"
): Promise<RequestContext> {
  const h = await headers();
  const ua = h.get("user-agent");

  // x-forwarded-for is a list; the client is the first entry. Trust it only
  // because a reverse proxy we control sets it.
  const forwarded = h.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    null;

  return {
    ip,
    userAgent: ua ? ua.slice(0, 400) : null,
    browser: ua ? browserOf(ua) : null,
    os: ua ? osOf(ua) : null,
    deviceType: ua ? deviceOf(ua) : null,
    city: h.get("cf-ipcity"),
    country: h.get("cf-ipcountry"),
    channel,
  };
}

/**
 * Build a context from values carried in a payload rather than from this
 * request's own headers.
 *
 * The lead webhook is a server-to-server call: `requestContext()` there would
 * record the marketing server's datacentre IP and Node's user-agent, and the
 * timeline would then claim a buyer enquired from a rack in Mumbai. The
 * originating request's details are forwarded in the payload instead, and this
 * turns them into the same shape.
 */
export function forwardedContext(
  channel: RequestContext["channel"],
  ip?: string | null,
  ua?: string | null,
  city?: string | null,
  country?: string | null
): RequestContext {
  return {
    ip: ip?.trim() || null,
    userAgent: ua ? ua.slice(0, 400) : null,
    browser: ua ? browserOf(ua) : null,
    os: ua ? osOf(ua) : null,
    deviceType: ua ? deviceOf(ua) : null,
    city: city?.trim() || null,
    country: country?.trim() || null,
    channel,
  };
}

function browserOf(ua: string): string {
  // order matters: Edge and Opera both claim Chrome, Chrome claims Safari
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua)) return "Opera";
  if (/chrome\//i.test(ua)) return "Chrome";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/safari\//i.test(ua)) return "Safari";
  return "Other";
}

function osOf(ua: string): string {
  if (/windows nt/i.test(ua)) return "Windows";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

function deviceOf(ua: string): RequestContext["deviceType"] {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}
