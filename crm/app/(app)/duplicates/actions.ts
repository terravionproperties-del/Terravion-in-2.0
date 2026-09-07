"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { requestContext } from "@/lib/request-context";
import { mergeLeads } from "@/lib/repos/duplicates";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Merge two leads.
 *
 * Only ADMIN and SALES_MANAGER hold `lead:merge`. An executive who can see
 * both records still cannot collapse them — a merge rewrites who owns a
 * relationship, and that is a decision with commission attached.
 */
export async function merge(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");
  if (!can(session.user.role, "lead:merge")) throw new Error("Not permitted");

  const survivorId = String(formData.get("survivorId") ?? "");
  const loserId = String(formData.get("loserId") ?? "");
  if (!UUID.test(survivorId) || !UUID.test(loserId)) throw new Error("Invalid ids");
  if (survivorId === loserId) throw new Error("Cannot merge a lead into itself");

  const matchedOn = String(formData.get("matchedOn") ?? "MANUAL");
  const confidence = Math.min(100, Math.max(0, Number(formData.get("confidence") ?? 0)));

  await mergeLeads(
    survivorId,
    loserId,
    matchedOn,
    confidence,
    session.user.id,
    await requestContext("CRM")
  );

  revalidatePath("/duplicates");
  revalidatePath(`/leads/${survivorId}`);
  revalidatePath("/leads");
}
