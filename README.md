# Terravion Properties — terravionproperties.in

A cinematic, SEO-first website for Terravion Properties: premium HMDA & DTCP
approved villa plot communities in Shankarpally, West Hyderabad.

Built with **Next.js (App Router) + TypeScript + Tailwind CSS 4 + GSAP
ScrollTrigger + Lenis + Three.js**. Fully statically generated — 120+ unique
indexable pages.

## Run it

```bash
npm install
npm run dev    # development
npm run build  # regenerates content indexes, then builds ~120 static pages
npm start      # serve the production build
```

## Architecture

| Layer | Where | Notes |
|---|---|---|
| Cinematic homepage | `components/home/*` | Ten scroll-driven chapters; WebGL golden-hour scene (`HeroCanvas`), pinned journey map, horizontal project showcase |
| Design system | `app/globals.css` | Warm architectural tokens (ivory/umber/brass), Fraunces + Instrument Sans, grain, glass, reduced-motion fallbacks |
| Business data | `lib/site.ts`, `lib/data/projects.ts` | Single source of truth. Search for `[PLACEHOLDER` to find values awaiting verified business input |
| Content CMS | `content/blog` (70+ essays), `content/guides` (12), `content/locations` (13) | File-based CMS: each entry is a typed TS module (`lib/types.ts`). `npm run content` regenerates the index files (also runs automatically before every build) |
| SEO | `lib/schema.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/rss.xml`, `public/llms.txt` | JSON-LD (Organization/RealEstateAgent/Residence/OfferCatalog/FAQ/Article/Breadcrumb/Speakable), OG image generation, AI-crawler optimization |
| Lead gen | `components/forms/LeadForm.tsx`, `components/layout/StickyCta.tsx`, `app/tools/*` | WhatsApp-handoff forms (no server needed), sticky CTA cluster, EMI & ROI calculators |

## Adding content

1. Copy any file in `content/blog/` as a template; keep the exported name
   (`post` / `guide` / `location`) and the interface shape from `lib/types.ts`.
2. Run `npm run content` (or just `npm run build`).
3. The page, sitemap entry, RSS item and internal-link surfaces all pick it
   up automatically.

## Before launch — replace marked placeholders

Search the repo for `[PLACEHOLDER` and `awaiting`:

- Verified office address, email, founding year, founder name/bio/portrait
- Raghunath County plot count, sizes and project-specific pricing
- Mansanpally extent, approvals, masterplan (page ships in "pre-launch" mode)
- Social media handles in `lib/site.ts`
- Real site photography/drone footage for `/gallery` and project pages
- Verified buyer testimonials (the page publishes only consented, real stories)

## Honesty constraints (by design)

No fabricated statistics, testimonials, awards or certifications anywhere.
The ROI calculator defaults its growth assumption to **0%** — visitors choose
their own scenario. Every unverified business fact is explicitly marked.
