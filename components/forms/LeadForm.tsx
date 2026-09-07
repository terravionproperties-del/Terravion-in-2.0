"use client";

import { useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { GlassField, GlassSelect, GlassTextarea } from "@/components/ui/GlassField";
import LuxuryButton from "@/components/ui/LuxuryButton";
import { submitLead } from "@/app/actions/submit-lead";
import { site } from "@/lib/site";
import { projects } from "@/lib/data/projects";

/**
 * Attribution, read at submit time rather than on mount, so a visitor who
 * arrives on an ad landing page and then wanders the site still carries the
 * click ids that brought them.
 */
function attribution() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const val = (k: string) => p.get(k) || undefined;
  return {
    utm: {
      source: val("utm_source"),
      medium: val("utm_medium"),
      campaign: val("utm_campaign"),
      term: val("utm_term"),
      content: val("utm_content"),
    },
    gclid: val("gclid"),
    fbclid: val("fbclid"),
    landingPage: window.location.href.slice(0, 400),
    referrer: document.referrer ? document.referrer.slice(0, 400) : undefined,
  };
}

export interface LeadFormStrings {
  ariaLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  projectLabel: string;
  projectPlaceholder: string;
  dateLabel: string;
  messageLabel: string;
  messagePlaceholder: string;
  submit: string;
  submitting: string;
  footnote: string;
  consentLabel: string;
  consentLinkLabel: string;
  successTitle: string;
  successBody: string;
  errorName: string;
  errorPhone: string;
  errorConsent: string;
}

type Props = {
  defaultProject?: string;
  /** context carried into the enquiry, e.g. "Site visit" | "Callback" */
  intent?: string;
  /**
   * Every visible string, resolved by the Server Component that renders this.
   * Optional so the seven existing call sites keep compiling; when omitted the
   * English defaults below apply, which is the behaviour that shipped before.
   */
  strings?: Partial<LeadFormStrings>;
};

/** English defaults — the copy this component carried before it was localised. */
const DEFAULTS: LeadFormStrings = {
  ariaLabel: "form",
  nameLabel: "Name",
  namePlaceholder: "Your full name",
  phoneLabel: "Phone",
  phonePlaceholder: "+91 …",
  projectLabel: "Project",
  projectPlaceholder: "Which community interests you?",
  dateLabel: "Preferred date",
  messageLabel: "Anything we should know?",
  messagePlaceholder: "Plot size, budget, timeline…",
  submit: "Request a visit",
  submitting: "Sending…",
  footnote: "We call once, and only about this enquiry. No lists, no forwarding.",
  consentLabel:
    "I agree that Terravion Properties may use these details to contact me about this enquiry, as described in the",
  consentLinkLabel: "Privacy Policy",
  successTitle: "We have your enquiry",
  successBody:
    "Someone from the team will call you within one working day. If you would rather not wait, message us on WhatsApp.",
  errorName: "Please tell us your name.",
  errorPhone: "Please enter a valid phone number.",
  errorConsent: "Please tick the consent box so we can contact you.",
};

/**
 * The enquiry itself — no panel, no card, no border of its own. It drops into
 * whatever surface hosts it, so the surrounding architecture stays the design.
 * Details hand off to WhatsApp prefilled; swap `handoff` for a POST when a CRM
 * endpoint exists.
 */
export default function LeadForm({
  defaultProject = "",
  intent = "Site visit",
  strings,
}: Props) {
  const s: LeadFormStrings = { ...DEFAULTS, ...strings };
  const pathname = usePathname();
  const localePrefix = /^\/(te|hi)(\/|$)/.exec(pathname ?? "")?.[1];
  const privacyHref = localePrefix
    ? `/${localePrefix}/privacy-policy`
    : "/privacy-policy";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [project, setProject] = useState(defaultProject);
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [consented, setConsented] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handoff = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError(s.errorName);
      return;
    }
    if (!/^[+\d][\d\s-]{8,14}$/.test(phone.trim())) {
      setError(s.errorPhone);
      return;
    }
    if (!consented) {
      setError(s.errorConsent);
      return;
    }

    // Record it in the CRM first. If that fails the visitor still gets the
    // WhatsApp hand-off below, so a CRM outage never costs an enquiry.
    void submitLead({
      name: name.trim(),
      phone: phone.trim(),
      projectSlug: project || undefined,
      remarks: message.trim() || undefined,
      preferredDate: date || undefined,
      ...attribution(),
    });

    const projectName =
      projects.find((p) => p.slug === project)?.name ?? "any Terravion project";
    const lines = [
      `Hello Terravion — ${intent} enquiry.`,
      `Name: ${name.trim()}`,
      `Phone: ${phone.trim()}`,
      `Project: ${projectName}`,
      date ? `Preferred date: ${date}` : "",
      message.trim() ? `Note: ${message.trim()}` : "",
    ].filter(Boolean);
    window.open(
      `${site.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
    setSent(true);
  };

  const heading = "text-charcoal";
  const muted = "text-stone-grey";
  const faint = "text-mist";

  if (sent) {
    return (
      <div className="py-6 text-center">
        <p className={`display text-3xl ${heading}`}>
          Thank you, {name.split(" ")[0]}.
        </p>
        <p className={`mx-auto mt-4 max-w-sm text-sm leading-relaxed ${muted}`}>
          Your enquiry has opened in WhatsApp — press send there and our team
          will reply within working hours.
        </p>
        <LuxuryButton href={site.phoneHref} variant="gold" className="mt-8">
          Call {site.phone}
        </LuxuryButton>
      </div>
    );
  }

  return (
    <form
      onSubmit={handoff}
      noValidate
      aria-label={`${intent} ${s.ariaLabel}`}
      className="space-y-4 form-light"
    >
      <GlassField
        label={s.nameLabel}
        name="name"
        type="text"
        autoComplete="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <GlassField
        label={s.phoneLabel}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={s.phonePlaceholder}
        required
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassSelect
          label={s.projectLabel}
          name="project"
          value={project}
          onChange={(e) => setProject(e.target.value)}
        >
          <option value="">Help me choose</option>
          {projects.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </GlassSelect>
        <GlassField
          label={s.dateLabel}
          name="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <GlassTextarea
        label={s.messageLabel}
        name="message"
        rows={3}
        placeholder={s.messagePlaceholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <label
        className={`flex cursor-pointer items-start gap-3 text-sm leading-relaxed ${muted}`}
      >
        <input
          type="checkbox"
          name="consent"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          required
          className="mt-1 h-4 w-4 shrink-0 accent-[#B88A44]"
        />
        <span>
          {s.consentLabel}{" "}
          <a
            href={privacyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[#8A6736]"
          >
            {s.consentLinkLabel}
          </a>
          .
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-gold-ink">
          {error}
        </p>
      )}

      <div className="flex flex-col items-center pt-4">
        <button
          type="submit"
          className="h-16 w-full rounded-full text-[15px] font-bold uppercase tracking-[0.18em] text-[#1D1D1D]
                     transition-[background-color,transform,box-shadow] duration-300 ease-out
                     hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2
                     focus-visible:outline-offset-4 focus-visible:outline-[#B88A44]"
          style={{ background: "#B88A44" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#9D7339";
            e.currentTarget.style.boxShadow = "0 16px 40px rgba(184,138,68,.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#B88A44";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Request the visit
        </button>
        <a
          href={site.phoneHref}
          className="mt-8 mb-4 text-[20px] font-semibold text-[#444444] transition-colors hover:text-[#8A6736]"
        >
          or call {site.phone}
        </a>
      </div>
      <p className="text-center text-[15px] leading-[1.7] text-[#777777]">
        {s.footnote}
      </p>
    </form>
  );
}
