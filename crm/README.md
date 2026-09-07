# Terravion CRM

Sales operations for `crm.terravionproperties.in`. Separate application, shared
design language with the marketing site (glass surfaces, champagne gold, the
same film stills where imagery is needed).

## Status

**Foundation laid, modules not yet built.** What exists today:

- `prisma/schema.prisma` — the complete data model: RBAC users, projects,
  phases, plots, leads with source attribution and deduplication, activities,
  tasks, site visits, bookings, payments, brokers, commissions, documents and
  an append-only audit log.
- `../docker-compose.yml` — Postgres 16, Redis (BullMQ-ready), MinIO, Meilisearch.

Nothing is wired to a UI yet. That is deliberate: screens built before the
schema settles get rewritten twice.

## Getting the stack up

```bash
docker compose up -d                 # from the repo root
cd crm
cp .env.example .env                 # then edit DATABASE_URL if needed
npm install
npx prisma migrate dev --name init   # creates the schema
npx prisma studio                    # inspect it
```

## Decisions worth knowing before extending this

**Money is `Decimal(14,2)`, never `Float`.** A booking ledger that rounds is a
booking ledger that loses money, and the error is unrecoverable once receipts
are issued.

**Leads deduplicate on `(phone, projectId)`.** Phone in E.164 is the only
identifier that repeats reliably across the website form, WhatsApp, Meta lead
ads and Google. A duplicate is never deleted — it points at the record it
merged into via `mergedIntoId`, so attribution and call history survive.

**A plot can be held by exactly one live booking**, enforced by `@unique` on
`Booking.plotId` rather than by application logic. Two salespeople selling the
same plot is the failure mode that ends relationships; the database refuses it.

**Soft holds expire.** `Plot.heldUntil` exists so inventory cannot be frozen
indefinitely by a stale block — a background job releases them.

**`AuditLog` is append-only.** Never updated, never deleted. Stage changes,
payments and plot holds all write to it with before/after snapshots.

**Documents are object keys, not URLs.** KYC and agreements live in a private
MinIO bucket; the app issues short-lived signed URLs per request. A public
document URL for a customer's PAN card is a data breach waiting to happen.

## Build order

The dependency chain, not a wish list:

1. Auth.js with the Prisma adapter + RBAC middleware
2. **Leads** — inbound webhook from the marketing site's form, list, detail,
   activity timeline, assignment
3. **Pipeline** — stage board, movement writing to `Activity` + `AuditLog`
4. **Site visits** — scheduling, Google Calendar sync
5. **Inventory** — plot grid and the availability map from `Plot.mapPolygon`
6. **Bookings & payments** — receipts, dues, the finance ledger
7. **Broker portal** — lead registration, commission statements
8. Integrations — WhatsApp Business, Meta lead ads, Google Ads offline
   conversions, call tracking

Steps 1–3 are the point at which the business can stop using spreadsheets.
Everything after that is leverage.
