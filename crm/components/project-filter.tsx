"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ProjectFilter({
  projects,
  currentProjectId,
}: {
  projects: { Id: string; Name: string }[];
  currentProjectId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="relative">
      <select
        id="project-selector"
        name="projectId"
        value={currentProjectId ?? ""}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value) {
            params.set("projectId", e.target.value);
          } else {
            params.delete("projectId");
          }
          router.push(`/?${params.toString()}`);
        }}
        className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-[0.8125rem] text-slate-800 font-medium shadow-2xs transition-colors hover:border-[#b88d23] focus:border-[#b88d23] focus:outline-none pr-8 cursor-pointer"
      >
        <option value="">All Projects (Sanctuary, Raghunath, Mansanpally)</option>
        {projects.map((p) => (
          <option key={p.Id} value={p.Id}>
            {p.Name}
          </option>
        ))}
      </select>
    </div>
  );
}
