"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePassword, type ChangeState } from "./actions";

/**
 * The only screen in the CRM that asks for a password twice. The requirements
 * are stated up front rather than revealed one rejection at a time — a policy
 * you discover by failing is a policy that produces `Password1!`.
 */
export default function ChangePasswordPage() {
  const [state, formAction] = useActionState<ChangeState, FormData>(changePassword, {});

  return (
    <div className="px-8 py-7">
      <header className="mb-6">
        <Link href="/security" className="text-[0.75rem] text-ivory/40 hover:text-ivory">
          ← Security
        </Link>
        <h1 className="mt-2 text-[1.4rem] font-medium tracking-tight">Change password</h1>
      </header>

      <div className="max-w-[520px] space-y-4">
        {state.done ? (
          <div className="panel border-good/30 bg-good/5 p-5">
            <p className="text-[0.9375rem]">Password changed.</p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ivory/45">
              Sessions signed in elsewhere are not signed out. This CRM issues
              stateless tokens, so one already in circulation stays valid until
              it expires — at most an hour idle, eight hours in all. If you are
              changing this because someone may have had the old password,
              check your login history as well.
            </p>
            <Link href="/security" className="btn mt-4 inline-block">
              Back to security
            </Link>
          </div>
        ) : (
          <form action={formAction} className="panel space-y-4 p-5">
            {state.error && (
              <p role="alert" className="rounded-lg bg-bad/10 p-3 text-[0.8125rem] text-bad">
                {state.error}
              </p>
            )}

            {state.problems && state.problems.length > 0 && (
              <div role="alert" className="rounded-lg bg-warn/10 p-3">
                <p className="text-[0.8125rem] text-warn">That password will not do:</p>
                <ul className="mt-1.5 space-y-0.5">
                  {state.problems.map((p) => (
                    <li key={p} className="text-[0.8125rem] text-ivory/60">
                      · {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <label htmlFor="current" className="label mb-1.5 block">
                Current password
              </label>
              <input
                id="current"
                name="current"
                type="password"
                required
                autoComplete="current-password"
                className="field"
              />
            </div>

            <div>
              <label htmlFor="next" className="label mb-1.5 block">
                New password
              </label>
              <input
                id="next"
                name="next"
                type="password"
                required
                autoComplete="new-password"
                className="field"
              />
              <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-ivory/35">
                At least 12 characters, mixing upper case, lower case, digits or
                symbols. Not your name, not your email address, and not one of
                the passwords everybody uses. A short phrase you would actually
                remember beats a short word with a symbol bolted on.
              </p>
            </div>

            <div>
              <label htmlFor="confirm" className="label mb-1.5 block">
                New password again
              </label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
                className="field"
              />
            </div>

            <Submit />
          </form>
        )}
      </div>
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-50">
      {pending ? "Changing…" : "Change password"}
    </button>
  );
}
