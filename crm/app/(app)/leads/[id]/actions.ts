"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { can, scopeFor, type Permission } from "@/lib/rbac";
import { requestContext } from "@/lib/request-context";
import { scheduleFollowUp } from "@/lib/notifications";
import {
  addActivity,
  assignLead,
  changeStage,
  getLead,
  LEAD_STAGES,
  type LeadStage,
} from "@/lib/repos/leads";

/**
 * Every action re-checks permission and scope on the server.
 *
 * The UI hides what a user may not do, but a hidden button is a courtesy, not
 * a control — a form can be replayed from a console. These checks are the
 * actual boundary.
 */
async function actor(permission: Permission, leadId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");
  if (!can(session.user.role, permission)) throw new Error("Not permitted");

  // scope check: an executive cannot act on a lead that is not theirs
  const lead = await getLead(leadId, scopeFor(session.user.role, "lead"), session.user.id);
  if (!lead) throw new Error("Not found");

  return { userId: session.user.id, lead };
}

const noteSchema = z.object({
  type: z.enum(["NOTE", "CALL", "WHATSAPP", "EMAIL", "MEETING", "SITE_VISIT"]),
  body: z.string().min(1).max(4000),
  followUp: z.string().optional(),
});

export async function logActivity(leadId: string, formData: FormData) {
  const { userId } = await actor("activity:create", leadId);

  const parsed = noteSchema.safeParse({
    type: formData.get("type"),
    body: formData.get("body"),
    followUp: formData.get("followUp") || undefined,
  });
  if (!parsed.success) throw new Error("Invalid activity");

  const followUp = parsed.data.followUp ? new Date(parsed.data.followUp) : null;

  await addActivity(
    leadId,
    parsed.data.type,
    parsed.data.body.trim(),
    userId,
    await requestContext("CRM"),
    followUp
  );

  // The reminder is queued, not sent. If the outbox worker is not running the
  // note is still saved — a reminder is an assist, and it should never be able
  // to fail the thing it is assisting.
  if (followUp && followUp.getTime() > Date.now()) {
    await scheduleFollowUp(leadId, followUp);
  }

  revalidatePath(`/leads/${leadId}`);
}

export async function moveStage(leadId: string, formData: FormData) {
  const { userId } = await actor("lead:update", leadId);

  const stage = String(formData.get("stage") ?? "");
  if (!LEAD_STAGES.includes(stage as LeadStage)) throw new Error("Unknown stage");

  const note = String(formData.get("note") ?? "").trim() || undefined;
  await changeStage(leadId, stage as LeadStage, userId, await requestContext("CRM"), note);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

export async function reassign(leadId: string, formData: FormData) {
  const { userId } = await actor("lead:assign", leadId);

  const ownerId = String(formData.get("ownerId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(ownerId)) throw new Error("Invalid user");

  await assignLead(leadId, ownerId, userId, await requestContext("CRM"));
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}
