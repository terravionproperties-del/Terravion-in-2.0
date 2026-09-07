/**
 * lib/engines/InventoryEngine.ts
 * Supabase realtime subscription engine.
 * Admin changes a plot status in the DB → every browser connected updates instantly.
 * Falls back gracefully when Supabase is not configured.
 */

import type { Plot } from "@/lib/types/gis";

type PlotUpdateCallback = (updatedPlot: Plot) => void;

let supabaseClient: unknown = null;

async function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    supabaseClient = createClient(url, key);
    return supabaseClient;
  } catch {
    return null;
  }
}

/**
 * Subscribe to realtime plot updates for a given project.
 * Returns an unsubscribe function to call on component unmount.
 */
export async function subscribeToPlotUpdates(
  projectId: string,
  onUpdate: PlotUpdateCallback
): Promise<() => void> {
  const supabase = await getSupabase();
  if (!supabase) {
    // Fallback: poll every 30 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/gis/projects/${projectId}/plots`);
        if (res.ok) {
          const { data } = await res.json();
          if (Array.isArray(data)) data.forEach(onUpdate);
        }
      } catch { /* ignore */ }
    }, 30_000);
    return () => clearInterval(interval);
  }

  // Use any cast for the dynamically imported Supabase client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel = (supabase as any)
    .channel(`plots:${projectId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "plots", filter: `project_id=eq.${projectId}` },
      (payload: { new: Plot }) => onUpdate(payload.new)
    )
    .subscribe();

  return () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).removeChannel(channel);
  };
}

/**
 * Update a single plot's status via the API (admin-only).
 * The API route triggers a Supabase realtime broadcast.
 */
export async function updatePlotStatus(
  plotId: string,
  status: string,
  adminToken: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/gis/plots/${plotId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
