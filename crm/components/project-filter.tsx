"use client";

import { useSearchParams } from "next/navigation";

export function ProjectFilter({
  projects,
  currentProjectId,
}: {
  projects: { Id: string; Name: string }[];
  currentProjectId?: string;
}) {
  const searchParams = useSearchParams();

  const handleChange = (newId: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (newId) {
      params.set("projectId", newId);
    } else {
      params.delete("projectId");
    }
    const query = params.toString();
    const dest = query ? `/?${query}` : "/";
    window.location.href = dest;
  };

  return (
    <div className="relative">
      <select
        id="project-selector"
        name="projectId"
        value={currentProjectId ?? ""}
        onChange={(e) => handleChange(e.target.value)}
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
