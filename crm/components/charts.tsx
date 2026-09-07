/**
 * Charts — Light Luxury Theme.
 * Plain SVG rendered on the server with clean light-theme typography.
 */

const GOLD = "#b88d23";
const GOLD_LIGHT = "#d4af37";

function Empty({ height, label }: { height: number; label: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-[0.75rem] text-slate-400"
      style={{ height }}
    >
      {label}
    </div>
  );
}

/* ── Trend ─────────────────────────────────────────────────────────── */

export function TrendChart({
  series,
  height = 160,
  label = "No activity in this period",
}: {
  series: { x: string; a: number; b?: number }[];
  height?: number;
  label?: string;
}) {
  if (!series.length || series.every((p) => p.a === 0 && !p.b)) {
    return <Empty height={height} label={label} />;
  }

  const w = 640;
  const h = height;
  const pad = { top: 12, right: 8, bottom: 20, left: 8 };
  const max = Math.max(1, ...series.map((p) => Math.max(p.a, p.b ?? 0)));
  const stepX = (w - pad.left - pad.right) / Math.max(1, series.length - 1);
  const y = (v: number) => pad.top + (1 - v / max) * (h - pad.top - pad.bottom);
  const x = (i: number) => pad.left + i * stepX;

  const line = (key: "a" | "b") =>
    series
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p[key] ?? 0).toFixed(1)}`)
      .join(" ");

  const area = `${line("a")} L ${x(series.length - 1).toFixed(1)} ${h - pad.bottom} L ${pad.left} ${h - pad.bottom} Z`;
  const tickEvery = Math.ceil(series.length / 6);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      style={{ height }}
      role="img"
      aria-label={`Trend over ${series.length} days`}
    >
      <defs>
        <linearGradient id="trendFillLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.2" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={pad.left}
          x2={w - pad.right}
          y1={pad.top + f * (h - pad.top - pad.bottom)}
          y2={pad.top + f * (h - pad.top - pad.bottom)}
          stroke="#f1f5f9"
          strokeWidth="1"
        />
      ))}

      <path d={area} fill="url(#trendFillLight)" />
      <path
        d={line("a")}
        fill="none"
        stroke={GOLD}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="chart-draw"
      />
      {series.some((p) => p.b !== undefined) && (
        <path
          d={line("b")}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
      )}

      {series.map((p, i) =>
        i % tickEvery === 0 ? (
          <text
            key={p.x}
            x={x(i)}
            y={h - 4}
            textAnchor="middle"
            fill="#64748b"
            fontSize="10"
            fontWeight="500"
          >
            {p.x}
          </text>
        ) : null
      )}
    </svg>
  );
}

/* ── Horizontal bars ───────────────────────────────────────────────── */

export function BarList({
  rows,
  valueSuffix = "",
}: {
  rows: { label: string; value: number; sub?: string }[];
  valueSuffix?: string;
}) {
  if (!rows.length) return <Empty height={120} label="Nothing recorded yet" />;
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.label} className="flex items-center gap-3">
          <span className="w-[150px] shrink-0 truncate text-[0.8125rem] font-medium text-slate-700">
            {r.label}
          </span>
          <span className="relative h-5 flex-1 overflow-hidden rounded bg-slate-100 border border-slate-200/60">
            <span
              className="chart-grow absolute inset-y-0 left-0 rounded"
              style={{
                width: `${(r.value / max) * 100}%`,
                background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                animationDelay: `${i * 60}ms`,
              }}
            />
          </span>
          <span className="w-[70px] shrink-0 text-right text-[0.8125rem] font-semibold text-slate-900 tabular-nums">
            {r.value.toLocaleString("en-IN")}
            {valueSuffix}
          </span>
          {r.sub && (
            <span className="w-[58px] shrink-0 text-right text-[0.6875rem] font-medium text-slate-500">
              {r.sub}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ── Funnel ────────────────────────────────────────────────────────── */

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  if (!steps.length || steps.every((s) => s.value === 0)) {
    return <Empty height={140} label="No leads in this period" />;
  }
  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <ol className="space-y-2">
      {steps.map((s, i) => {
        const pct = (s.value / max) * 100;
        const drop =
          i > 0 && steps[i - 1].value > 0
            ? Math.round((1 - s.value / steps[i - 1].value) * 100)
            : null;
        return (
          <li key={s.label} className="flex items-center gap-3">
            <span className="w-[168px] shrink-0 truncate text-[0.8125rem] font-medium text-slate-700">
              {s.label}
            </span>
            <span className="relative h-7 flex-1 overflow-hidden rounded-md bg-slate-100 border border-slate-200/60">
              <span
                className="chart-grow absolute inset-y-0 left-0 rounded-md"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})`,
                  opacity: 1 - i * 0.08,
                  animationDelay: `${i * 70}ms`,
                }}
              />
              <span className="absolute inset-y-0 left-2.5 flex items-center text-[0.75rem] font-bold tabular-nums text-slate-900">
                {s.value || ""}
              </span>
            </span>
            <span className="w-[54px] shrink-0 text-right text-[0.6875rem] font-semibold text-rose-500">
              {drop === null ? "" : `-${drop}%`}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Donut ─────────────────────────────────────────────────────────── */

export function Donut({
  slices,
  size = 132,
}: {
  slices: { label: string; value: number }[];
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (!total) return <Empty height={size} label="No data" />;

  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const shades = ["#b88d23", "#d4af37", "#6366f1", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="flex items-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Share by source"
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {slices.map((s, i) => {
            const frac = s.value / total;
            const dash = `${frac * c} ${c - frac * c}`;
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={shades[i % shades.length]}
                strokeWidth="14"
                strokeDasharray={dash}
                strokeDashoffset={-offset * c}
              />
            );
            offset += frac;
            return el;
          })}
        </g>
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {slices.slice(0, 6).map((s, i) => (
          <li key={s.label} className="flex items-center gap-2 text-[0.75rem]">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: shades[i % shades.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-slate-700 font-medium">{s.label}</span>
            <span className="tabular-nums font-semibold text-slate-900">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
