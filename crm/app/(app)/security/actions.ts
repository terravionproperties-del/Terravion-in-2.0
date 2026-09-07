"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { requestContext } from "@/lib/request-context";
import { unlockUser } from "@/lib/repos/security";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Lifts a lockout.
 *
 * The permission is checked here, not only where the button is drawn. Whether
 * a button appears on someone's screen is a layout decision; this is the
 * control. A server action is a POST endpoint like any other, and anyone who
 * has seen its id can call it without the page.
 */
export async function unlock(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");
  if (!can(session.user.role, "user:manage")) throw new Error("Not permitted");

  const userId = String(formData.get("userId") ?? "");
  if (!UUID.test(userId)) throw new Error("Invalid id");

  await unlockUser(userId, session.user.id, await requestContext("CRM"));

  revalidatePath("/security");
}
