"use server";

import { revalidatePath } from "next/cache";
import { verify } from "@node-rs/argon2";
import { auth, hashPassword } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { validatePassword } from "@/lib/password-policy";
import { requestContext } from "@/lib/request-context";

export type ChangeState = { error?: string; problems?: string[]; done?: boolean };

/**
 * Change your own password.
 *
 * The current password is required even though the session already proves who
 * signed in — a session is proof of a login, not proof that the person at the
 * keyboard is still the same one. That is the whole value of asking.
 *
 * Nobody can change anyone else's here. An administrator resetting a forgotten
 * password is a different operation with different risks, and it does not
 * belong on the screen a user reaches from their own account.
 */
export async function changePassword(
  _prev: ChangeState,
  formData: FormData
): Promise<ChangeState> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in" };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next) return { error: "Both passwords are needed" };
  if (next !== confirm) return { error: "The two new passwords do not match" };
  if (next === current) return { error: "That is the password you already have" };

  const user = await queryOne<{
    Id: string;
    Name: string;
    Email: string;
    PasswordHash: string;
  }>`
    SELECT id AS Id, name AS Name, email AS Email, password_hash AS PasswordHash FROM users
    WHERE id = ${session.user.id} AND is_active = 1
  `;
  if (!user) return { error: "Not signed in" };

  const ok = await verify(user.PasswordHash, current).catch(() => false);
  if (!ok) return { error: "That is not your current password" };

  const policy = validatePassword(next, { name: user.Name, email: user.Email });
  if (!policy.ok) return { problems: policy.problems };

  const hash = await hashPassword(next);
  const ctx = await requestContext("CRM");

  await query`
    UPDATE users
    SET password_hash        = ${hash},
        password_changed_at   = datetime('now'),
        must_change_password  = 0,
        failed_attempts      = 0,
        locked_until         = NULL,
        updated_at           = datetime('now')
    WHERE id = ${user.Id}
  `;

  await query`
    INSERT INTO audit_log (user_id, action, entity, entity_id, before_json, after_json, ip, user_agent)
    VALUES (${user.Id}, 'user.password_change', 'User', ${user.Id},
            null,
            ${JSON.stringify({ ip: ctx.ip, browser: ctx.browser, os: ctx.os })},
            ${ctx.ip}, ${ctx.userAgent})
  `;

  revalidatePath("/security");
  return { done: true };
}
