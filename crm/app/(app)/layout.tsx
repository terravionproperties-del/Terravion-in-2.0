import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { navFor } from "@/lib/rbac";
import GlobalSearch from "@/components/GlobalSearch";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const mustChange = await queryOne<{ MustChangePassword: boolean }>`
    SELECT must_change_password AS MustChangePassword FROM users WHERE id = ${session.user.id}
  `.catch(() => null);
  if (mustChange?.MustChangePassword) {
    const here = (await headers()).get("x-pathname") ?? "";
    if (!here.startsWith("/security/password")) redirect("/security/password");
  }

  const nav = navFor(session.user.role);
  const initials = (session.user.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* ── White Luxury Sidebar ───────────────────────────────────── */}
      <aside className="flex w-[245px] shrink-0 flex-col border-r border-slate-200 bg-white shadow-xs">
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-28 overflow-hidden rounded-lg">
              <img
                src="/terravion-logo.jpeg"
                alt="Terravion Properties"
                className="h-full w-full object-contain"
              />
            </div>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-widest text-[#946c0b] border border-amber-200/80">
              CRM
            </span>
          </Link>
        </div>

        {/* Global Search */}
        <div className="px-3 py-3 border-b border-slate-100/60">
          <GlobalSearch />
        </div>

        {/* Navigation Sections */}
        <nav aria-label="Sections" className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          <div>
            <p className="px-3 pb-2 text-[0.625rem] font-bold uppercase tracking-[0.18em] text-slate-400">
              Operations & Master Plan
            </p>
            <ul className="space-y-0.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-[0.8125rem] font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 hover:translate-x-0.5"
                  >
                    <NavIcon name={item.icon || "dashboard"} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Bottom Actions & User Profile */}
        <div className="border-t border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
          {/* View Public Site link */}
          <a
            href={process.env.NEXT_PUBLIC_SITE_URL || "https://terravionproperties.in"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.75rem] font-medium text-slate-700 shadow-2xs transition-colors hover:border-amber-300 hover:text-[#946c0b]"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#b88d23]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>View Public Site</span>
            </span>
            <span className="text-[0.6875rem] text-slate-400">↗</span>
          </a>

          {/* User Profile Card */}
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-2xs">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[0.6875rem] font-bold text-[#946c0b] border border-amber-200"
            >
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] font-semibold text-slate-800">
                {session.user.name}
              </span>
              <span className="block truncate text-[0.625rem] font-medium text-slate-400 uppercase tracking-wider">
                {session.user.role.replace(/_/g, " ").toLowerCase()}
              </span>
            </span>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[0.75rem] font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area in Light Theme */}
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}

function NavIcon({ name }: { name: string }) {
  const props = { className: "w-4 h-4 shrink-0 text-slate-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" };

  switch (name) {
    case "projects":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case "leads":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case "gis":
      return (
        <svg {...props} className="w-4 h-4 shrink-0 text-emerald-600">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      );
    case "media":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...props} className="w-4 h-4 shrink-0 text-emerald-600">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 3V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case "duplicates":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      );
    case "reports":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "security":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case "system":
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
  }
}
