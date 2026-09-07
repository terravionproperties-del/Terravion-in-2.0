"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { create, type CreateState } from "./actions";

interface Option {
  value: string;
  label: string;
}

/**
 * A client component only because it needs the pending state and the error
 * back from the action. The submit itself is a plain form post, so it works
 * before hydration finishes — which matters on the phone a salesperson is
 * holding in a site office with one bar of signal.
 */
export default function NewLeadForm({
  projects,
  owners,
  sources,
  mayAssign,
}: {
  projects: { Id: string; Name: string }[];
  owners: { Id: string; Name: string }[];
  sources: Option[];
  mayAssign: boolean;
}) {
  const [state, formAction] = useActionState<CreateState, FormData>(create, {});

  return (
    <form action={formAction} className="max-w-[760px] space-y-4">
      {state.error && (
        <p role="alert" className="panel border-bad/30 bg-bad/5 p-3 text-[0.8125rem] text-bad">
          {state.error}
        </p>
      )}

      <section className="panel p-5">
        <p className="label mb-4">Who</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Name" required>
            <input id="name" name="name" required maxLength={200} className="field" autoFocus />
          </Field>
          <Field id="phone" label="Phone" required hint="Any format. Stored as +91…">
            <input
              id="phone"
              name="phone"
              required
              inputMode="tel"
              maxLength={20}
              className="field"
            />
          </Field>
          <Field id="whatsapp" label="WhatsApp" hint="Only if different from the phone">
            <input id="whatsapp" name="whatsapp" inputMode="tel" maxLength={20} className="field" />
          </Field>
          <Field id="email" label="Email">
            <input id="email" name="email" type="email" maxLength={256} className="field" />
          </Field>
        </div>
      </section>

      <section className="panel p-5">
        <p className="label mb-4">Where it came from</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="source" label="Source" required>
            <select id="source" name="source" defaultValue="MANUAL" className="field">
              {sources.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="projectId" label="Project">
            <select id="projectId" name="projectId" defaultValue="" className="field">
              <option value="">Not decided</option>
              {projects.map((p) => (
                <option key={p.Id} value={p.Id}>
                  {p.Name}
                </option>
              ))}
            </select>
          </Field>
          {mayAssign && (
            <Field id="ownerId" label="Assign to" hint="Leave blank to decide later">
              <select id="ownerId" name="ownerId" defaultValue="" className="field">
                <option value="">Unassigned</option>
                {owners.map((o) => (
                  <option key={o.Id} value={o.Id}>
                    {o.Name}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </section>

      <section className="panel p-5">
        <p className="label mb-4">What they are looking for</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="budgetMin" label="Budget from" hint="Rupees">
            <input id="budgetMin" name="budgetMin" inputMode="numeric" className="field" />
          </Field>
          <Field id="budgetMax" label="Budget to" hint="Rupees">
            <input id="budgetMax" name="budgetMax" inputMode="numeric" className="field" />
          </Field>
          <Field id="plotSizeMin" label="Plot size from" hint="Square yards">
            <input id="plotSizeMin" name="plotSizeMin" inputMode="numeric" className="field" />
          </Field>
          <Field id="plotSizeMax" label="Plot size to" hint="Square yards">
            <input id="plotSizeMax" name="plotSizeMax" inputMode="numeric" className="field" />
          </Field>
          <Field id="preferredFacing" label="Preferred facing">
            <select id="preferredFacing" name="preferredFacing" defaultValue="" className="field">
              <option value="">No preference</option>
              {[
                ["NORTH", "North"],
                ["SOUTH", "South"],
                ["EAST", "East"],
                ["WEST", "West"],
                ["NORTH_EAST", "North east"],
                ["NORTH_WEST", "North west"],
                ["SOUTH_EAST", "South east"],
                ["SOUTH_WEST", "South west"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Field id="remarks" label="Notes" hint="What they said, in their words if you can">
            <textarea id="remarks" name="remarks" rows={4} maxLength={4000} className="field" />
          </Field>
        </div>
      </section>

      <Submit />
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label mb-1.5 block">
        {label}
        {required && <span className="ml-1 text-gold-light">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[0.6875rem] text-ivory/30">{hint}</p>}
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center gap-3">
      <button type="submit" disabled={pending} className="btn btn-primary disabled:opacity-50">
        {pending ? "Saving…" : "Save lead"}
      </button>
      <span className="text-[0.6875rem] text-ivory/30">
        A repeat enquiry lands on the existing record.
      </span>
    </div>
  );
}
