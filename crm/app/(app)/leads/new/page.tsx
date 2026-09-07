import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { query } from "@/lib/db";
import { LEAD_SOURCES, humanise } from "@/lib/repos/leads";
import NewLeadForm from "./form";

export const metadata = { title: "New lead — Terravion OS" };
export const dynamic = "force-dynamic";

/**
 * Manual lead entry.
 *
 * Short on purpose. A walk-in is standing at the desk while this is filled in,
 * and a form with twenty required fields gets abandoned or filled with junk —
 * either way the record is worse than the one a name and a number would have
 * produced. Everything except those two is optional and can be added later
 * from the lead's own page.
 */
export default async function NewLeadPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session.user.role, "lead:create")) redirect("/leads");

  const mayAssign = can(session.user.role, "lead:assign");

  const [projects, owners] = await Promise.all([
    query<{ Id: string; Name: string }>`
      SELECT id AS Id, name AS Name FROM projects ORDER BY name
    `,
    mayAssign
      ? query<{ Id: string; Name: string }>`
          SELECT id AS Id, name AS Name FROM users
          WHERE is_active = 1
            AND role IN ('SALES_EXECUTIVE','SALES_MANAGER','TELECALLER','ADMIN')
          ORDER BY name
        `
      : Promise.resolve([]),
  ]);

  return (
    <div className="px-8 py-7">
      <header className="mb-6">
        <Link href="/leads" className="text-[0.75rem] text-ivory/40 hover:text-ivory">
          ← Leads
        </Link>
        <h1 className="mt-2 text-[1.4rem] font-medium tracking-tight">New lead</h1>
        <p className="mt-1 max-w-[62ch] text-[0.8125rem] leading-relaxed text-ivory/45">
          A name and a phone number are enough. If this person has enquired
          before on the same project, their existing record is updated instead
          of a second one being created.
        </p>
      </header>

      <NewLeadForm
        projects={projects}
        owners={owners}
        sources={LEAD_SOURCES.map((s) => ({ value: s, label: humanise(s) }))}
        mayAssign={mayAssign}
      />
    </div>
  );
}
