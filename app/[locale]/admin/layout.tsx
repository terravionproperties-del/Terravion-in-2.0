/**
 * app/[locale]/admin/layout.tsx
 * Internal preview panel.
 *
 * This layout performs NO authentication, and it should not pretend to. An
 * earlier version read an `x-admin-authed` header that nothing ever set and
 * then ignored the result — auth-shaped code that authorised everyone.
 *
 * The real gate is in `middleware.ts`: in production the whole /admin tree is
 * rewritten to 404 unless ADMIN_ENABLED=true. Until staff authentication
 * exists (Supabase Auth / NextAuth, as the CRM app already uses), that flag is
 * the only thing that should ever open this surface.
 */

import type { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: "linear-gradient(135deg, #050508 0%, #0a0a14 100%)" }}
    >
      {/* Admin Sidebar */}
      <aside
        className="w-64 min-h-screen flex-shrink-0 flex flex-col border-r"
        style={{
          background: "rgba(8,8,16,0.95)",
          borderColor: "rgba(251,191,36,0.1)",
        }}
      >
        {/* Logo */}
        <div className="p-6 border-b" style={{ borderColor: "rgba(251,191,36,0.1)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-black"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)", color: "#000" }}
            >
              T
            </div>
            <div>
              <p className="text-white font-bold text-sm">Terravion Admin</p>
              <p className="text-white/30 text-xs">GIS Platform</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/admin", label: "Dashboard", icon: "📊" },
            { href: "/admin/projects", label: "Projects", icon: "🗺️" },
            { href: "/admin/plots", label: "Inventory", icon: "📋" },
            { href: "/admin/leads", label: "Leads / CRM", icon: "👥" },
            { href: "/admin/media", label: "Media", icon: "🖼️" },
            { href: "/admin/analytics", label: "Analytics", icon: "📈" },
          ].map(({ href, label, icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-white hover:bg-white/5 transition-all"
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <a
            href="/gis"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs text-white/30 hover:text-white/50 transition-all"
          >
            ← Back to Live Site
          </a>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
