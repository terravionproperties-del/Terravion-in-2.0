import { query, queryOne } from "@/lib/db";
import type { RequestContext } from "@/lib/request-context";

/**
 * Login forensics and account lockout — SQLite version.
 * Uses datetime('now', ...) arithmetic, 0/1 for booleans, LIMIT for paging.
 */

const WINDOW_MINUTES = 15;
const LOCK_AFTER = 5;
const LOCK_LADDER_MINUTES = [1, 5, 15, 60];

export type LoginReason =
  | "BAD_PASSWORD"
  | "INACTIVE"
  | "UNKNOWN_USER"
  | "LOCKED"
  | "IP_BLOCKED";

export interface LoginAttempt {
  userId: string | null;
  email: string;
  success: boolean;
  reason?: LoginReason | null;
  ctx: RequestContext;
}

export interface LoginRow {
  Id: number;
  UserId: string | null;
  Email: string;
  Success: boolean;
  Reason: LoginReason | null;
  Ip: string | null;
  Browser: string | null;
  Os: string | null;
  DeviceType: string | null;
  City: string | null;
  Country: string | null;
  OccurredAt: Date;
}

export async function recordLogin({
  userId, email, success, reason, ctx,
}: LoginAttempt): Promise<void> {
  await query`
    INSERT INTO login_history
      (user_id, email, success, reason, ip, user_agent, browser, os, device_type, city, country)
    VALUES
      (${userId}, ${email}, ${success ? 1 : 0}, ${reason ?? null},
       ${ctx.ip}, ${ctx.userAgent}, ${ctx.browser}, ${ctx.os}, ${ctx.deviceType},
       ${ctx.city}, ${ctx.country})
  `;
}

export interface FailureOutcome {
  attempts: number;
  lockedUntil: Date | null;
}

export async function noteFailure(email: string): Promise<FailureOutcome | null> {
  const user = await queryOne<{ id: string; failed_attempts: number }>`
    SELECT id, failed_attempts FROM users WHERE email = ${email}
  `;
  if (!user) return null;

  const recent = await queryOne<{ n: number }>`
    SELECT COUNT(*) AS n
    FROM login_history
    WHERE email = ${email}
      AND success = 0
      AND occurred_at >= datetime('now', ${`-${WINDOW_MINUTES} minutes`})
  `;

  const inWindow = Number(recent?.n ?? 0);
  const attempts = inWindow <= 1 ? 1 : Math.min(user.failed_attempts + 1, 250);

  if (attempts < LOCK_AFTER) {
    await query`
      UPDATE users
      SET failed_attempts = ${attempts}, updated_at = datetime('now')
      WHERE id = ${user.id}
    `;
    return { attempts, lockedUntil: null };
  }

  const step = Math.min(
    Math.floor(attempts / LOCK_AFTER) - 1,
    LOCK_LADDER_MINUTES.length - 1
  );
  const minutes = LOCK_LADDER_MINUTES[step];

  const row = await queryOne<{ locked_until: string }>`
    UPDATE users
    SET failed_attempts = ${attempts},
        locked_until    = datetime('now', ${`+${minutes} minutes`}),
        updated_at      = datetime('now')
    WHERE id = ${user.id}
    RETURNING locked_until
  `;

  return { attempts, lockedUntil: row?.locked_until ? new Date(row.locked_until) : null };
}

export async function clearFailures(userId: string): Promise<void> {
  await query`
    UPDATE users
    SET failed_attempts = 0,
        locked_until    = NULL,
        last_login_at   = datetime('now'),
        updated_at      = datetime('now')
    WHERE id = ${userId}
  `;
}

export function isLockedOut(user: { locked_until?: Date | string | null; LockedUntil?: Date | string | null }): boolean {
  const lu = user.locked_until || user.LockedUntil;
  if (!lu) return false;
  return new Date(lu).getTime() > Date.now();
}

export function ipAllowed(
  user: { allowed_ips?: string | null; AllowedIps?: string | null },
  ip: string | null
): boolean {
  const ips = user.allowed_ips ?? user.AllowedIps ?? "";
  const entries = ips
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (entries.length === 0) return true;
  if (!ip) return false;

  const candidate = normaliseIp(ip);
  return entries.some((entry) =>
    entry.includes("/")
      ? inCidr4(candidate, entry)
      : normaliseIp(entry) === candidate
  );
}

function normaliseIp(ip: string): string {
  return ip.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/^::ffff:/, "");
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    n = n * 256 + octet;
  }
  return n;
}

function inCidr4(ip: string, cidr: string): boolean {
  const [network, bitsRaw] = cidr.split("/");
  const bits = Number(bitsRaw);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  const a = ipv4ToInt(ip);
  const b = ipv4ToInt(network);
  if (a === null || b === null) return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return ((a & mask) >>> 0) === ((b & mask) >>> 0);
}

export function loginHistory(userId: string, limit = 50) {
  return query<LoginRow>`
    SELECT id AS Id, user_id AS UserId, email AS Email, success AS Success, reason AS Reason,
           ip AS Ip, browser AS Browser, os AS Os, device_type AS DeviceType,
           city AS City, country AS Country, occurred_at AS OccurredAt
    FROM login_history
    WHERE user_id = ${userId}
    ORDER BY occurred_at DESC
    LIMIT ${limit}
  `;
}

export interface DeviceRow {
  Ip: string | null;
  Browser: string | null;
  Os: string | null;
  DeviceType: string | null;
  City: string | null;
  Country: string | null;
  Logins: number;
  FirstSeen: Date;
  LastSeen: Date;
}

export function recentDevices(userId: string, limit = 40) {
  return query<DeviceRow>`
    SELECT ip AS Ip, browser AS Browser, os AS Os,
           MAX(device_type) AS DeviceType,
           MAX(city)        AS City,
           MAX(country)     AS Country,
           COUNT(*)         AS Logins,
           MIN(occurred_at) AS FirstSeen,
           MAX(occurred_at) AS LastSeen
    FROM login_history
    WHERE user_id = ${userId} AND success = 1
    GROUP BY ip, browser, os
    ORDER BY MAX(occurred_at) DESC
    LIMIT ${limit}
  `;
}

export interface ActiveIpRow {
  Ip: string;
  Browser: string | null;
  Os: string | null;
  City: string | null;
  Logins: number;
  LastSeen: Date;
}

export function concurrentSessions(userId: string) {
  return query<ActiveIpRow>`
    SELECT ip AS Ip,
           MAX(browser)     AS Browser,
           MAX(os)          AS Os,
           MAX(city)        AS City,
           COUNT(*)         AS Logins,
           MAX(occurred_at) AS LastSeen
    FROM login_history
    WHERE user_id  = ${userId}
      AND success  = 1
      AND ip IS NOT NULL
      AND occurred_at >= datetime('now', '-1 hour')
    GROUP BY ip
    ORDER BY MAX(occurred_at) DESC
  `;
}

export interface SecurityProfile {
  PasswordChangedAt?: Date | null;
  MustChangePassword?: boolean;
  TwoFactorEnabled?: boolean;
  FailedAttempts: number;
  LockedUntil: Date | null;
  AllowedIps: string | null;
  LastLoginAt: Date | null;
}

export function securityProfile(userId: string) {
  return queryOne<SecurityProfile>`
    SELECT NULL AS PasswordChangedAt, 0 AS MustChangePassword, 0 AS TwoFactorEnabled,
           failed_attempts AS FailedAttempts, locked_until AS LockedUntil, allowed_ips AS AllowedIps, last_login_at AS LastLoginAt
    FROM users
    WHERE id = ${userId}
  `;
}

export interface FailureRow extends LoginRow {
  Name: string | null;
}

export function recentFailures(limit = 50, hours = 168) {
  return query<FailureRow>`
    SELECT h.id AS Id, h.user_id AS UserId, h.email AS Email, h.success AS Success, h.reason AS Reason,
           h.ip AS Ip, h.browser AS Browser, h.os AS Os,
           h.device_type AS DeviceType, h.city AS City, h.country AS Country, h.occurred_at AS OccurredAt,
           u.name AS Name
    FROM login_history AS h
    LEFT JOIN users AS u ON u.id = h.user_id
    WHERE h.success = 0
      AND h.occurred_at >= datetime('now', ${`-${hours} hours`})
    ORDER BY h.occurred_at DESC
    LIMIT ${limit}
  `;
}

export interface LockedAccountRow {
  Id: string;
  Name: string;
  Email: string;
  Role: string;
  FailedAttempts: number;
  LockedUntil: Date;
}

export function lockedAccounts() {
  return query<LockedAccountRow>`
    SELECT id AS Id, name AS Name, email AS Email, role AS Role,
           failed_attempts AS FailedAttempts, locked_until AS LockedUntil
    FROM users
    WHERE locked_until IS NOT NULL AND locked_until > datetime('now')
    ORDER BY locked_until DESC
  `;
}

export async function unlockUser(
  userId: string,
  actorId: string,
  ctx: RequestContext
): Promise<void> {
  const before = await queryOne<{ failed_attempts: number; locked_until: Date | null }>`
    SELECT failed_attempts, locked_until FROM users WHERE id = ${userId}
  `;
  if (!before) throw new Error("No such user");

  await query`
    UPDATE users
    SET failed_attempts = 0, locked_until = NULL, updated_at = datetime('now')
    WHERE id = ${userId}
  `;

  await query`
    INSERT INTO audit_log
      (user_id, action, entity, entity_id, before_json, after_json, ip, user_agent)
    VALUES
      (${actorId}, 'user.unlock', 'User', ${userId},
       ${JSON.stringify(before)},
       ${JSON.stringify({ failed_attempts: 0, locked_until: null })},
       ${ctx.ip}, ${ctx.userAgent})
  `;
}
