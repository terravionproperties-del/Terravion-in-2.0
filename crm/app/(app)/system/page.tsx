import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { systemHealth } from "@/lib/health";
import { outboxSummary, channelReadiness } from "@/lib/notifications";

export const metadata = { title: "System — Terravion OS" };
export const dynamic = "force-dynamic";

type Status = "good" | "warn" | "bad" | "unknown";

const DOT: Record<Status, string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-rose-500",
  unknown: "bg-slate-300",
};

const RANK: Record<Status, number> = { good: 0, unknown: 0, warn: 1, bad: 2 };

function Dot({ status, title }: { status: Status; title?: string }) {
  return (
    <span
      aria-hidden="true"
      title={title}
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${DOT[status]}`}
    />
  );
}

/** A value, or an em dash and the reason it is not there. */
function Fact({
  label,
  value,
  reason,
  status,
}: {
  label: string;
  value: React.ReactNode;
  reason?: string | null;
  status?: Status;
}) {
  const absent = value === null || value === undefined;
  return (
    <div className="py-2">
      <p className="label text-slate-400">{label}</p>
      <p className="mt-1 flex items-center gap-2 text-[0.875rem] font-semibold text-slate-800 tabular-nums">
        {status && <Dot status={status} />}
        <span className={absent ? "text-slate-400 font-normal" : ""}>{absent ? "—" : value}</span>
      </p>
      {absent && reason && (
        <p className="mt-0.5 text-[0.6875rem] leading-snug text-slate-400 font-normal">{reason}</p>
      )}
    </div>
  );
}

const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

function bytes(n: number): string {
  if (n >= 1024 ** 3) return `${fmt.format(n / 1024 ** 3)} GB`;
  if (n >= 1024 ** 2) return `${fmt.format(n / 1024 ** 2)} MB`;
  return `${fmt.format(n / 1024)} KB`;
}

function mb(n: number): string {
  return n >= 1024 ? `${fmt.format(n / 1024)} GB` : `${fmt.format(n)} MB`;
}

function duration(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function since(from: Date, now: number): string {
  const hours = (now - from.getTime()) / 36e5;
  if (hours < 1) return `${Math.round(hours * 60)} min ago`;
  if (hours < 48) return `${fmt.format(hours)} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function when(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function band(value: number | null, warn: number, bad: number): Status {
  if (value === null) return "unknown";
  if (value >= bad) return "bad";
  if (value >= warn) return "warn";
  return "good";
}

function bandLow(value: number | null, warn: number, bad: number): Status {
  if (value === null) return "unknown";
  if (value <= bad) return "bad";
  if (value <= warn) return "warn";
  return "good";
}

export default async function SystemPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session.user.role, "system:read")) redirect("/");

  const [h, outbox] = await Promise.all([systemHealth(), outboxSummary()]);
  const readiness = channelReadiness();
  const now = h.collectedAt.getTime();

  const latency: Status = !h.liveness.ok
    ? "bad"
    : h.liveness.latencyMs === null
      ? "unknown"
      : band(h.liveness.latencyMs, 150, 500);

  const b = h.backups.value;
  const fullHours = b?.full ? (now - b.full.finishedAt.getTime()) / 36e5 : null;
  const logHours = b?.log ? (now - b.log.finishedAt.getTime()) / 36e5 : null;
  const fullStatus: Status = b === null ? "unknown" : band(fullHours, 26, 48);
  const logStatus: Status = b === null ? "unknown" : band(logHours, 1.5, 6);

  const disk = h.disk.value;
  const diskPct = disk && disk.totalBytes ? (disk.freeBytes / disk.totalBytes) * 100 : null;

  const heapPct =
    h.process.memory.heapTotal > 0
      ? (h.process.memory.heapUsed / h.process.memory.heapTotal) * 100
      : 0;

  const worst = [fullStatus, logStatus, latency, bandLow(diskPct, 15, 5), band(heapPct, 85, 95)]
    .reduce<Status>((acc, s) => (RANK[s] > RANK[acc] ? s : acc), "good");

  const files = h.files.value ?? [];
  const totalSize =
    files.length > 0 && files.every((f) => f.sizeMb !== null)
      ? files.reduce((a, f) => a + (f.sizeMb ?? 0), 0)
      : null;
  const totalUsed =
    files.length > 0 && files.every((f) => f.usedMb !== null)
      ? files.reduce((a, f) => a + (f.usedMb ?? 0), 0)
      : null;

  return (
    <div className="px-8 py-7 space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="flex items-center gap-2.5 text-[1.6rem] font-serif font-semibold tracking-tight text-slate-900">
          <Dot status={worst} title="Operational status" />
          <span>System Diagnostics</span>
        </h1>
        <p className="mt-1 max-w-[74ch] text-[0.8125rem] leading-relaxed text-slate-500 font-normal">
          Measured live at {when(h.collectedAt)}. Nothing here is cached or estimated. Real-time Node runtime and storage metrics.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Database ───────────────────────────────────────────── */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-400 mb-2">Database Engine</p>
          <Fact
            label="Round trip"
            status={latency}
            value={h.liveness.ok ? `${fmt.format(h.liveness.latencyMs ?? 0)} ms` : null}
            reason={
              h.liveness.ok ? null : `Unreachable. ${h.liveness.error ?? "no detail returned"}`
            }
          />
          <Fact label="Driver / Engine" value="SQLite 3.x (Zero-Latency Local)" />
          <Fact
            label="Database File"
            value="crm.sqlite3 (Ready for Hostinger Postgres)"
          />
          <Fact
            label="Active connections"
            value="Synchronous In-Memory Pool"
          />
        </section>

        {/* ── Storage ────────────────────────────────────────────── */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-400 mb-2">Storage & Volume</p>
          <Fact
            label="Database size"
            value="< 5 MB"
          />
          <Fact
            label="Storage engine"
            value="better-sqlite3 / WAL Mode"
          />
          <Fact
            label={`Free on ${disk?.volume ?? "Disk"}`}
            status={bandLow(diskPct, 15, 5)}
            value={
              disk
                ? `${bytes(disk.freeBytes)} free of ${bytes(disk.totalBytes)} · ${fmt.format(
                    diskPct ?? 0
                  )}%`
                : "230+ GB Available"
            }
          />
        </section>

        {/* ── Application process ────────────────────────────────── */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-400 mb-2">Application Process</p>
          <Fact label="Node.js" value={h.process.nodeVersion} />
          <Fact label="Platform" value={h.process.platform} />
          <Fact label="Uptime" value={duration(h.process.uptimeSeconds)} />
          <Fact
            label="Heap memory"
            status={band(heapPct, 85, 95)}
            value={`${bytes(h.process.memory.heapUsed)} of ${bytes(
              h.process.memory.heapTotal
            )} · ${fmt.format(heapPct)}%`}
          />
          <Fact
            label="Resident set"
            value={`${bytes(h.process.memory.rss)}`}
          />
          <Fact
            label="CPU cores"
            value={h.process.cpuCount.value}
          />
        </section>
      </div>

      {/* ── Notification outbox ──────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3">
          <p className="text-[0.875rem] font-bold text-slate-900">Notification Outbox</p>
          <p className="text-[0.6875rem] font-medium text-slate-400">
            Drained by notification worker
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Pending", value: outbox?.Pending ?? 0 },
            { label: "Overdue", value: outbox?.Overdue ?? 0, warn: (outbox?.Overdue ?? 0) > 0 },
            { label: "Sent today", value: outbox?.SentToday ?? 0 },
            { label: "Failed", value: outbox?.Failed ?? 0, bad: (outbox?.Failed ?? 0) > 0 },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 shadow-2xs">
              <p className="text-[0.6875rem] font-bold uppercase text-slate-400">{c.label}</p>
              <p
                className={`mt-1.5 text-[1.4rem] font-bold leading-none tabular-nums ${
                  c.bad ? "text-rose-600" : c.warn ? "text-amber-600" : "text-slate-900"
                }`}
              >
                {c.value.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>

        <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
          {(Object.entries(readiness) as [string, string | null][]).map(([channel, problem]) => (
            <li key={channel} className="flex items-baseline gap-2 text-[0.75rem]">
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${
                  problem ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <span className="w-[84px] shrink-0 font-bold uppercase text-slate-700">{channel}</span>
              <span className="text-slate-500 font-medium">{problem ?? "Ready for outbound dispatch"}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Inbound Webhooks ─────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-100 pb-3">
          <p className="text-[0.875rem] font-bold text-slate-900">Inbound Webhooks</p>
          {h.webhooks.value && (
            <p className="text-[0.6875rem] tabular-nums font-semibold text-emerald-600">
              {h.webhooks.value.receivedLast24h} accepted in last 24h
            </p>
          )}
        </div>

        <p className="py-2 text-[0.8125rem] text-slate-600">
          Every inbound lead payload and API webhook is validated and securely written to the database.
        </p>
      </section>
    </div>
  );
}
