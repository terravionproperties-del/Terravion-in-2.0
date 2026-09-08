/**
 * Single source of truth for Terravion Properties business data.
 *
 * Values marked [PLACEHOLDER — replace with verified business data] must be
 * confirmed by the business before launch. Everything else is sourced from
 * Terravion's public listings and project marketing material.
 */
export const site = {
  name: "Terravion Properties",
  legalName: "Terravion Properties",
  domain: process.env.NEXT_PUBLIC_SITE_URL || "https://terravionproperties.in",
  tagline: "Premium villa plots in Shankarpally, Hyderabad",
  description:
    "Terravion Properties curates HMDA & DTCP approved premium villa plots in Shankarpally, West Hyderabad — gated communities with clubhouse living, minutes from ORR, the Financial District and IIT Hyderabad.",
  phone: "+91 93472 59638",
  phoneHref: "tel:+919347259638",
  whatsapp: "https://wa.me/919347259638",
  email: "info@terravionproperties.in",
  address: {
    street: "Shankarpally", // [PLACEHOLDER — replace with verified office street address]
    locality: "Shankarpally",
    region: "Telangana",
    postalCode: "501203",
    country: "IN",
  },
  geo: { lat: 17.4548, lng: 78.1305 }, // Shankarpally town centre
  founded: "2020", // [PLACEHOLDER — replace with verified founding year]
  founderName: "[Founder name — replace with verified data]",
  social: {
    instagram: "https://instagram.com/terravionproperties", // [PLACEHOLDER — verify handle]
    youtube: "https://youtube.com/@terravionproperties", // [PLACEHOLDER — verify handle]
    linkedin: "https://linkedin.com/company/terravion-properties", // [PLACEHOLDER — verify handle]
  },
  hours: "Mo-Su 09:00-19:00",
  priceRange: "₹₹₹",
} as const;

export const nav = [
  { label: "Projects", href: "/projects" },
  { label: "GIS Masterplan", href: "/gis" },
  { label: "Locations", href: "/locations" },
  { label: "Investment", href: "/investment" },
  { label: "Guides", href: "/guides" },
  { label: "Journal", href: "/blog" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export function absoluteUrl(path: string): string {
  return `${site.domain}${path.startsWith("/") ? path : `/${path}`}`;
}
