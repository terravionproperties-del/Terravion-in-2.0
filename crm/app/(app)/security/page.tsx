import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { MIN_LENGTH } from "@/lib/password-policy";
import {
  concurrentSessions,
  lockedAccounts,
  loginHistory,
  recentDevices,
  recentFailures,
  securityProfile,
  type FailureRow,
  type LockedAccountRow,
} from "@/lib/repos/security";
import { unlock } from "./actions";

export const metadata = { title: "Security — Terravion OS" };
export const dynamic = "force-dynamic";

const UNKNOWN = "—";

function when(d: Date | string | null | undefined): string {
  if (!d) return UNKNOWN;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return UNKNOWN;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function SecurityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const isAdmin = can(session.user.role, "user:manage");

  const [history, devices, active, profile] = await Promise.all([
    loginHistory(userId, 50),
    recentDevices(userId),
    concurrentSessions(userId),
    securityProfile(userId),
  ]);

  const [failures, locked]: [FailureRow[], LockedAccountRow[]] = isAdmin
    ? await Promise.all([recentFailures(50), lockedAccounts()])
    : [[], []];

  const allowList = (profile?.AllowedIps ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="px-8 py-7 space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-[1.6rem] font-serif font-semibold tracking-tight text-slate-900">
          Security & Access Forensics
        </h1>
        <p className="mt-1 max-w-[70ch] text-[0.8125rem] leading-relaxed text-slate-500 font-normal">
          Every sign-in attempt against your account, successful or not, with the address and browser it came from.
        </p>
      </header>

      {active.length > 1 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-5 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
            ⚠️ Signed in from {active.length} active addresses
          </p>
          <p className="mt-1 max-w-[70ch] text-[0.8125rem] leading-relaxed text-amber-900">
            This account signed in successfully from {active.length} different IP addresses in the last hour.
          </p>
          <ul className="mt-3 space-y-1">
            {active.map((a) => (
              <li key={a.Ip} className="text-[0.75rem] font-mono text-amber-800 font-medium">
                {a.Ip} · {[a.Browser, a.Os, a.City].filter(Boolean).join(" · ") || "unknown device"} · last {when(a.LastSeen)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Policy state */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Account Security Profile
        </h2>
        <dl className="grid gap-x-8 gap-y-4 text-[0.8125rem] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-semibold text-slate-400">Password Last Changed</dt>
            <dd className="mt-1 font-semibold text-slate-800">
              {profile?.PasswordChangedAt ? when(profile.PasswordChangedAt) : "Default Admin Password"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-400">Minimum Password Policy</dt>
            <dd className="mt-1 font-semibold text-slate-800">
              {MIN_LENGTH} characters, mixed classes
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-400">Two-Factor Authentication</dt>
            <dd className={`mt-1 font-semibold ${profile?.TwoFactorEnabled ? "text-emerald-600" : "text-slate-500"}`}>
              {profile?.TwoFactorEnabled ? "Enforced (TOTP)" : "Standard Credentials"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-400">IP Allowlist Policy</dt>
            <dd className="mt-1 font-semibold text-slate-800">
              {allowList.length === 0 ? "Any Authorised IP" : `${allowList.length} restricted`}
            </dd>
          </div>
        </dl>
      </section>

      {/* Devices table */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-[0.95rem] font-bold text-slate-900">Recognised Devices & Locations</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Distinct browser, operating system and address combinations that signed in successfully.
          </p>
        </div>

        {devices.length === 0 ? (
          <p className="px-6 py-8 text-center text-[0.8125rem] text-slate-400">
            No devices recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[0.8125rem]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Browser</th>
                  <th className="px-4 py-3">OS</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3 text-right">Logins</th>
                  <th className="px-4 py-3">First Seen</th>
                  <th className="px-6 py-3 text-right">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.map((d) => (
                  <tr key={`${d.Browser}-${d.Os}-${d.Ip}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3 font-semibold text-slate-900">{d.Browser ?? UNKNOWN}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">{d.Os ?? UNKNOWN}</td>
                    <td className="px-4 py-3 text-slate-600">{d.DeviceType ?? UNKNOWN}</td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">{d.Ip ?? UNKNOWN}</td>
                    <td className="px-4 py-3 text-slate-500">{d.City ?? UNKNOWN}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">{d.Logins}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{when(d.FirstSeen)}</td>
                    <td className="px-6 py-3 text-right text-xs font-semibold text-slate-700 tabular-nums">{when(d.LastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sign in history */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-[0.95rem] font-bold text-slate-900">Sign-in History</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Recent authentication attempts on this account.
          </p>
        </div>

        {history.length === 0 ? (
          <p className="px-6 py-8 text-center text-[0.8125rem] text-slate-400">
            No history recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[0.8125rem]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3">Time (IST)</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3">IP</th>
                  <th className="px-4 py-3">Browser</th>
                  <th className="px-4 py-3">OS</th>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-6 py-3">City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.Id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3 font-semibold text-slate-900 tabular-nums">{when(h.OccurredAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[0.6875rem] font-bold ${
                        h.Success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {h.Success ? "Signed in" : "Failed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">{h.Ip ?? UNKNOWN}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{h.Browser ?? UNKNOWN}</td>
                    <td className="px-4 py-3 text-slate-600">{h.Os ?? UNKNOWN}</td>
                    <td className="px-4 py-3 text-slate-600">{h.DeviceType ?? UNKNOWN}</td>
                    <td className="px-6 py-3 text-slate-500">{h.City ?? UNKNOWN}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Admin Locked Accounts */}
      {isAdmin && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-[0.95rem] font-bold text-slate-900 mb-1">Locked Accounts</h2>
          <p className="text-xs text-slate-500 mb-4">
            Accounts temporarily locked due to excessive failed attempts.
          </p>

          {locked.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">No account is currently locked.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {locked.map((acc) => (
                <div key={acc.Id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-bold text-slate-900">{acc.Email}</p>
                    <p className="text-xs text-rose-600">{acc.FailedAttempts} failed attempts</p>
                  </div>
                  <form action={unlock}>
                    <input type="hidden" name="userId" value={acc.Id} />
                    <button type="submit" className="btn btn-primary text-xs">
                      Unlock Account
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
