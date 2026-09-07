"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { requestContext } from "@/lib/request-context";
import { createLead, LEAD_SOURCES, type LeadSource } from "@/lib/repos/leads";

const FACINGS = [
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
  "NORTH_EAST",
  "NORTH_WEST",
  "SOUTH_EAST",
  "SOUTH_WEST",
] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Blank strings arrive from every unfilled input; they are not values. */
const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const wholeNumber = z.preprocess(
  (v) => (blankToNull(v) === null ? null : Number(String(v).replace(/[,\s]/g, ""))),
  z.number().int().nonnegative().max(1_000_000_000).nullable()
);

const schema = z.object({
  name: z.string().trim().min(2, "A name is needed").max(200),
  phone: z.string().trim().min(8, "A phone number is needed").max(20),
  whatsapp: z.preprocess(blankToNull, z.string().max(20).nullable()),
  email: z.preprocess(blankToNull, z.string().email("That email is not valid").max(256).nullable()),
  source: z.enum(LEAD_SOURCES),
  projectId: z.preprocess(blankToNull, z.string().regex(UUID).nullable()),
  ownerId: z.preprocess(blankToNull, z.string().regex(UUID).nullable()),
  budgetMin: wholeNumber,
  budgetMax: wholeNumber,
  preferredFacing: z.preprocess(blankToNull, z.enum(FACINGS).nullable()),
  plotSizeMin: wholeNumber,
  plotSizeMax: wholeNumber,
  remarks: z.preprocess(blankToNull, z.string().max(4000).nullable()),
});

export type CreateState = { error?: string };

/**
 * Create a lead by hand.
 *
 * Most leads arrive through the webhook. This is the walk-in, the phone call,
 * the broker who texted a name — and it goes through the same `createLead`, so
 * it inherits the same deduplication. Somebody who enquired online last month
 * and walks in today lands on their existing record rather than a second one.
 */
export async function create(_prev: CreateState, formData: FormData): Promise<CreateState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in" };
  if (!can(session.user.role, "lead:create")) return { error: "Not permitted" };

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details and try again" };
  }
  const d = parsed.data;

  if (d.budgetMin !== null && d.budgetMax !== null && d.budgetMin > d.budgetMax) {
    return { error: "The minimum budget is above the maximum" };
  }

  // An executive cannot hand a lead to someone else on the way in — that is an
  // assignment, and assignment is a separate permission.
  const ownerId = can(session.user.role, "lead:assign") ? d.ownerId : session.user.id;

  let result;
  try {
    result = await createLead(
      { ...d, source: d.source as LeadSource, ownerId },
      session.user.id,
      await requestContext("CRM")
    );
  } catch {
    return { error: "Could not save this lead. Check the phone number and try again." };
  }

  revalidatePath("/leads");

  // A duplicate is not an error. The enquiry was recorded on the existing
  // lead's timeline, so sending the user there is the useful outcome.
  redirect(`/leads/${result.id}${result.duplicate ? "?duplicate=1" : ""}`);
}
