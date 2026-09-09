import { InventoryClient } from "./InventoryClient";

export const metadata = { title: "Plot Inventory Management — Terravion OS" };
export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;
  const q = params?.project;
  const initialProject =
    q === "raghunath-county" ? "raghunath-county" : "sanctuary";

  return <InventoryClient initialProject={initialProject} />;
}
