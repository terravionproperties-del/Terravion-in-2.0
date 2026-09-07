import type { Locale } from "./config";
import { getTranslator } from "./dictionaries";

/**
 * Resolve the lead form's copy for a language.
 *
 * A helper rather than a prop on every page: the form appears on six routes and
 * the alternative is the same twelve lookups written six times.
 */
export async function leadFormStrings(locale: Locale) {
  const t = await getTranslator(locale, ["forms", "validation"]);
  return {
    ariaLabel: t("forms.lead.ariaLabel", { intent: "" }).trim(),
    nameLabel: t("forms.lead.name.label"),
    namePlaceholder: t("forms.lead.name.placeholder"),
    phoneLabel: t("forms.lead.phone.label"),
    phonePlaceholder: t("forms.lead.phone.placeholder"),
    projectLabel: t("forms.lead.project.label"),
    projectPlaceholder: t("forms.lead.project.placeholder"),
    dateLabel: t("forms.lead.date.label"),
    messageLabel: t("forms.lead.message.label"),
    messagePlaceholder: t("forms.lead.message.placeholder"),
    submit: t("forms.lead.submit"),
    submitting: t("forms.lead.submitting"),
    footnote: t("forms.lead.footnote"),
    consentLabel: t("forms.lead.consent.label"),
    consentLinkLabel: t("forms.lead.consent.linkLabel"),
    successTitle: t("forms.success.title"),
    successBody: t("forms.success.body"),
    errorName: t("validation.name.required"),
    errorPhone: t("validation.phone.invalid"),
    errorConsent: t("validation.consent.required"),
  };
}
