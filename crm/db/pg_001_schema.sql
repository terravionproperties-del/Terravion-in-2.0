-- ═══════════════════════════════════════════════════════════════════════
-- Terravion OS — PostgreSQL schema
-- Run: psql -U <user> -d terravion_crm -f db/pg_001_schema.sql
-- Idempotent: safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- trigram search

-- ──────────────────────────────────────────── Users ────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email         VARCHAR(256) NOT NULL,
  name          VARCHAR(200) NOT NULL,
  phone         VARCHAR(20)  NULL,
  password_hash VARCHAR(512) NULL,
  role          VARCHAR(24)  NOT NULL DEFAULT 'SALES_EXECUTIVE',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  failed_attempts INT        NOT NULL DEFAULT 0,
  locked_until  TIMESTAMPTZ  NULL,
  allowed_ips   TEXT         NULL,
  last_login_at TIMESTAMPTZ  NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT ck_users_role CHECK (role IN
    ('ADMIN','SALES_MANAGER','SALES_EXECUTIVE','TELECALLER','MARKETING',
     'FINANCE','BROKER','SUPPORT','CUSTOMER'))
);

-- ──────────────────────────────────────────── Projects ────
CREATE TABLE IF NOT EXISTS projects (
  id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        VARCHAR(80)  NOT NULL,
  name        VARCHAR(160) NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'SELLING',
  approval    VARCHAR(80)  NULL,
  rera_number VARCHAR(80)  NULL,
  location    TEXT         NULL,
  total_acres DECIMAL(8,2) NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_projects_slug UNIQUE (slug),
  CONSTRAINT ck_projects_status CHECK (status IN ('PRE_LAUNCH','SELLING','SOLD_OUT','COMPLETED'))
);

-- ──────────────────────────────────────────── Leads ────
CREATE SEQUENCE IF NOT EXISTS lead_seq START 1;

CREATE TABLE IF NOT EXISTS leads (
  id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seq              INT          NOT NULL DEFAULT nextval('lead_seq'),
  reference        VARCHAR(12)  GENERATED ALWAYS AS ('TVN-' || LPAD(seq::TEXT, 6, '0')) STORED,

  name             VARCHAR(200) NOT NULL,
  phone            VARCHAR(20)  NOT NULL,
  whatsapp         VARCHAR(20)  NULL,
  email            VARCHAR(256) NULL,

  budget_min       DECIMAL(14,2) NULL,
  budget_max       DECIMAL(14,2) NULL,
  preferred_facing VARCHAR(12)   NULL,
  plot_size_min    DECIMAL(10,2) NULL,
  plot_size_max    DECIMAL(10,2) NULL,

  project_id       UUID          NULL REFERENCES projects(id),
  source           VARCHAR(20)   NOT NULL DEFAULT 'WEBSITE',
  stage            VARCHAR(28)   NOT NULL DEFAULT 'NEW',
  quality          VARCHAR(8)    NOT NULL DEFAULT 'WARM',
  score            SMALLINT      NOT NULL DEFAULT 0,

  campaign         VARCHAR(200)  NULL,
  utm_source       VARCHAR(120)  NULL,
  utm_medium       VARCHAR(120)  NULL,
  utm_campaign     VARCHAR(200)  NULL,
  utm_term         VARCHAR(200)  NULL,
  utm_content      VARCHAR(200)  NULL,
  gclid            VARCHAR(200)  NULL,
  fbclid           VARCHAR(200)  NULL,
  landing_page     VARCHAR(400)  NULL,
  referrer         VARCHAR(400)  NULL,

  owner_id         UUID          NULL REFERENCES users(id),
  remarks          TEXT          NULL,
  lost_reason      VARCHAR(300)  NULL,

  next_follow_up_at   TIMESTAMPTZ NULL,
  first_contacted_at  TIMESTAMPTZ NULL,
  last_activity_at    TIMESTAMPTZ NULL,
  merged_into_id      UUID        NULL REFERENCES leads(id),

  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_leads_source CHECK (source IN
    ('WEBSITE','WHATSAPP','GOOGLE_ADS','META_ADS','ORGANIC','PHONE',
     'WALK_IN','BROKER','REFERRAL','MANUAL','PORTAL','OTHER')),
  CONSTRAINT ck_leads_stage CHECK (stage IN
    ('NEW','CONTACTED','INTERESTED','SITE_VISIT_SCHEDULED','SITE_VISIT_COMPLETED',
     'NEGOTIATION','BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED',
     'LOST','CANCELLED')),
  CONSTRAINT ck_leads_quality CHECK (quality IN ('HOT','WARM','COLD')),
  CONSTRAINT ck_leads_facing CHECK (preferred_facing IS NULL OR preferred_facing IN
    ('NORTH','SOUTH','EAST','WEST','NORTH_EAST','NORTH_WEST','SOUTH_EAST','SOUTH_WEST'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_leads_phone_project
  ON leads (phone, project_id)
  WHERE merged_into_id IS NULL;

CREATE INDEX IF NOT EXISTS ix_leads_phone       ON leads (phone);
CREATE INDEX IF NOT EXISTS ix_leads_name        ON leads (name);
CREATE INDEX IF NOT EXISTS ix_leads_stage       ON leads (stage, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_leads_owner       ON leads (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_leads_source      ON leads (source, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_leads_followup    ON leads (next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_leads_created     ON leads (created_at DESC);

-- ──────────────────────────────────────────── Lead Activities ────
CREATE TABLE IF NOT EXISTS lead_activities (
  id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id     UUID         NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id     UUID         NULL REFERENCES users(id),
  type        VARCHAR(24)  NOT NULL,
  body        TEXT         NULL,
  meta_json   JSONB        NULL,
  occurred_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_act_type CHECK (type IN
    ('NOTE','CALL','WHATSAPP','EMAIL','MEETING','SITE_VISIT','DOCUMENT',
     'BOOKING','PAYMENT','ASSIGNMENT','STAGE_CHANGE','CREATED','MERGE'))
);

CREATE INDEX IF NOT EXISTS ix_act_lead ON lead_activities (lead_id, occurred_at DESC);

-- Append-only rule (replaces the INSTEAD OF trigger)
CREATE OR REPLACE RULE no_update_lead_activities AS
  ON UPDATE TO lead_activities DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_lead_activities AS
  ON DELETE TO lead_activities DO INSTEAD NOTHING;

-- ──────────────────────────────────────────── Audit Log ────
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL    NOT NULL PRIMARY KEY,
  user_id     UUID         NULL REFERENCES users(id),
  action      VARCHAR(64)  NOT NULL,
  entity      VARCHAR(48)  NOT NULL,
  entity_id   VARCHAR(64)  NOT NULL,
  before_json JSONB        NULL,
  after_json  JSONB        NULL,
  ip          VARCHAR(64)  NULL,
  user_agent  TEXT         NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_audit_entity ON audit_log (entity, entity_id, created_at DESC);

-- Append-only
CREATE OR REPLACE RULE no_update_audit AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_delete_audit AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- ──────────────────────────────────────────── Webhook Deliveries ────
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  delivery_key VARCHAR(128) NOT NULL PRIMARY KEY,
  source       VARCHAR(20)  NOT NULL,
  lead_id      UUID         NULL REFERENCES leads(id),
  received_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────── Login History ────
CREATE TABLE IF NOT EXISTS login_history (
  id          BIGSERIAL    NOT NULL PRIMARY KEY,
  user_id     UUID         NULL REFERENCES users(id),
  email       VARCHAR(256) NOT NULL,
  success     BOOLEAN      NOT NULL,
  reason      VARCHAR(20)  NULL,
  ip          VARCHAR(64)  NULL,
  user_agent  TEXT         NULL,
  browser     VARCHAR(120) NULL,
  os          VARCHAR(80)  NULL,
  device_type VARCHAR(20)  NULL,
  city        VARCHAR(80)  NULL,
  country     VARCHAR(60)  NULL,
  occurred_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_login_email ON login_history (email, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_login_user  ON login_history (user_id, occurred_at DESC);

-- ──────────────────────────────────────────── Notifications ────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id     UUID         NULL REFERENCES leads(id),
  user_id     UUID         NULL REFERENCES users(id),
  channel     VARCHAR(16)  NOT NULL DEFAULT 'WHATSAPP',
  template    VARCHAR(80)  NOT NULL,
  payload     JSONB        NOT NULL DEFAULT '{}',
  status      VARCHAR(12)  NOT NULL DEFAULT 'PENDING',
  error       TEXT         NULL,
  attempts    INT          NOT NULL DEFAULT 0,
  sent_at     TIMESTAMPTZ  NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_notif_channel CHECK (channel IN ('WHATSAPP','EMAIL','SMS')),
  CONSTRAINT ck_notif_status  CHECK (status  IN ('PENDING','SENT','FAILED','SKIPPED'))
);

CREATE INDEX IF NOT EXISTS ix_notif_pending ON notifications (status, created_at) WHERE status = 'PENDING';

-- ──────────────────────────────────────────── Plots (inventory) ────
CREATE TABLE IF NOT EXISTS plots (
  id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID         NOT NULL REFERENCES projects(id),
  plot_number VARCHAR(20)  NOT NULL,
  status      VARCHAR(16)  NOT NULL DEFAULT 'AVAILABLE',
  facing      VARCHAR(12)  NULL,
  area_sq_yards DECIMAL(10,2) NULL,
  breadth_ft  DECIMAL(8,2) NULL,
  length_ft   DECIMAL(8,2) NULL,
  road_width  DECIMAL(6,2) NULL,
  price_per_sq_yard DECIMAL(12,2) NULL,
  total_price DECIMAL(14,2) NULL,
  is_corner   BOOLEAN      NOT NULL DEFAULT FALSE,
  is_premium  BOOLEAN      NOT NULL DEFAULT FALSE,
  remarks     TEXT         NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_plot_number UNIQUE (project_id, plot_number),
  CONSTRAINT ck_plot_status CHECK (status IN
    ('AVAILABLE','BOOKED','SOLD','RESERVED','PREMIUM','COMMERCIAL'))
);

CREATE INDEX IF NOT EXISTS ix_plots_project ON plots (project_id, status);

-- ──────────────────────────────────────────── Bookings ────
CREATE TABLE IF NOT EXISTS bookings (
  id            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id       UUID         NOT NULL REFERENCES leads(id),
  plot_id       UUID         NOT NULL REFERENCES plots(id),
  project_id    UUID         NOT NULL REFERENCES projects(id),
  amount_paid   DECIMAL(14,2) NULL,
  total_value   DECIMAL(14,2) NULL,
  booked_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  registered_at TIMESTAMPTZ  NULL,
  cancelled_at  TIMESTAMPTZ  NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_booking_plot ON bookings (plot_id) WHERE cancelled_at IS NULL;
