/**
 * app/[locale]/gis/[projectSlug]/page.tsx
 * Per-project 3D Digital Twin — full-screen, no site chrome.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TERRAVION_SHANKARPALLY } from "@/lib/data/terravion-shankarpally";
import { SANCTUARY_SHANKARPALLY } from "@/lib/data/sanctuary-shankarpally";
import { RAGHUNATH_COUNTY } from "@/lib/data/raghunath-county";
import { GISDigitalTwin } from "@/components/gis/GISDigitalTwin";
import type { Project } from "@/lib/types/gis";
import { site } from "@/lib/site";

const PROJECT_MAP: Record<string, Project> = {
  sanctuary: SANCTUARY_SHANKARPALLY,
  "raghunath-county": RAGHUNATH_COUNTY,
  raghunath: RAGHUNATH_COUNTY,
  shankarpally: TERRAVION_SHANKARPALLY as unknown as Project,
};

interface Props {
  params: Promise<{ locale: string; projectSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectSlug } = await params;
  const project = PROJECT_MAP[projectSlug];
  if (!project) return { title: "Not Found" };
  return {
    metadataBase: new URL(site.domain),
    title: `${project.name} — 3D Plot Explorer | Terravion`,
    description: `Explore ${project.totalPlots} plots across ${project.totalArea} acres in an interactive 3D digital twin — an indicative visualisation of the sanctioned layout. Filter by facing, size and budget; confirm availability with our team.`,
    openGraph: {
      title: `${project.name} — 3D Digital Twin`,
      description: project.description,
      images: project.masterLayoutUrl ? [project.masterLayoutUrl] : [],
    },
  };
}

export function generateStaticParams() {
  return [];
}

export const dynamic = "force-dynamic";

export default async function GISProjectPage({ params }: Props) {
  const { projectSlug } = await params;
  const project = PROJECT_MAP[projectSlug];
  if (!project) notFound();
  return <GISDigitalTwin project={project} />;
}

