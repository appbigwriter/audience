-- Migration: 000_custom_audience_full.sql
-- Escopo: Criação integral do schema custom_audience, governança Control Tower e tabelas de domínio do Audience Builder
-- Project ID: 153d40a6-5823-4029-add3-b52604cd3b71

CREATE SCHEMA IF NOT EXISTS custom_audience;
SET search_path = custom_audience, public;

-- 1. TABELAS DE GOVERNANÇA CONTROL TOWER
CREATE TABLE IF NOT EXISTS custom_audience.entities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL,
  entity_type   text NOT NULL,
  name          text NOT NULL,
  slug          text,
  data          jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_audience.entity_relations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL,
  from_entity_id  uuid NOT NULL REFERENCES custom_audience.entities(id) ON DELETE CASCADE,
  to_entity_id    uuid NOT NULL REFERENCES custom_audience.entities(id) ON DELETE CASCADE,
  relation_type   text NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_audience.records (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL,
  collection    text NOT NULL,
  data          jsonb NOT NULL DEFAULT '{}',
  version       integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_audience.files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL,
  filename      text NOT NULL,
  path          text NOT NULL,
  mime_type     text NOT NULL,
  size_bytes    bigint NOT NULL DEFAULT 0,
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_audience.settings (
  key           text PRIMARY KEY,
  project_id    uuid NOT NULL,
  value         jsonb NOT NULL DEFAULT '{}',
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_audience.audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL,
  actor         text NOT NULL,
  action        text NOT NULL,
  target_type   text NOT NULL,
  target_id     text NOT NULL,
  metadata      jsonb NOT NULL DEFAULT '{}',
  occurred_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_audience.events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL,
  event_type      text NOT NULL,
  payload         jsonb NOT NULL DEFAULT '{}',
  idempotency_key text UNIQUE NOT NULL,
  status          text NOT NULL DEFAULT 'received' CHECK (status IN ('received','processing','processed','failed')),
  occurred_at     timestamptz NOT NULL DEFAULT now()
);

-- 2. TABELAS DE DOMÍNIO AUDIENCE BUILDER
CREATE TABLE IF NOT EXISTS custom_audience.audience_persona_bindings (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL,
  persona_id            text NOT NULL,
  persona_version_id    text NOT NULL,
  persona_version       integer NOT NULL CHECK (persona_version >= 1),
  content_hash          text NOT NULL CHECK (content_hash ~ '^sha256:[0-9a-f]{64}$'),
  persona_status        text NOT NULL DEFAULT 'approved' CHECK (persona_status = 'approved'),
  approval_id           text NOT NULL,
  approved_by           text NOT NULL,
  approved_at           timestamptz NOT NULL,
  approval_scope        text NOT NULL,
  bound_at              timestamptz NOT NULL DEFAULT now(),
  bound_by              text NOT NULL,
  snapshot              jsonb NOT NULL,
  UNIQUE (audience_project_id, persona_version_id),
  UNIQUE (audience_project_id, content_hash)
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_projects (
  id                    uuid PRIMARY KEY,
  tenant_id             text NOT NULL,
  owner_id              text NOT NULL,
  name                  text NOT NULL,
  slug                  text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 3 AND 64),
  niche                 text NOT NULL,
  audience_definition   text NOT NULL,
  business_objective    text NOT NULL,
  language              text NOT NULL,
  region                text NOT NULL,
  status                text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','intake','persona_bound','planning','provisioning','active','paused','blocked','archived')),
  version               integer NOT NULL DEFAULT 1,
  current_binding_id    uuid REFERENCES custom_audience.audience_persona_bindings(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, owner_id, slug)
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_project_transitions (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  from_status           text NOT NULL,
  to_status             text NOT NULL,
  actor                 text NOT NULL,
  reason                text NOT NULL,
  occurred_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_potential_niches (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  niche_id              text NOT NULL,
  label                 text NOT NULL,
  origin                text NOT NULL,
  observed_at           timestamptz NOT NULL,
  confidence            numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence              jsonb NOT NULL DEFAULT '[]',
  limitations           jsonb NOT NULL,
  signals               jsonb NOT NULL DEFAULT '[]',
  classification        text NOT NULL DEFAULT 'under_analysis'
                        CHECK (classification IN ('candidate','discarded','under_analysis')),
  kind                  text NOT NULL DEFAULT 'hypothesis' CHECK (kind = 'hypothesis'),
  classified_at         timestamptz NOT NULL DEFAULT now(),
  classified_by         text NOT NULL,
  UNIQUE (audience_project_id, niche_id)
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_manifests (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  version               integer NOT NULL CHECK (version >= 1),
  content_hash          text NOT NULL CHECK (content_hash ~ '^sha256:[0-9a-f]{64}$'),
  manifest_yaml         text NOT NULL,
  manifest_json         jsonb NOT NULL,
  validation_status     text NOT NULL CHECK (validation_status IN ('valid','invalid')),
  validation_errors     jsonb NOT NULL DEFAULT '[]',
  created_at            timestamptz NOT NULL DEFAULT now(),
  created_by            text NOT NULL,
  UNIQUE (audience_project_id, version),
  UNIQUE (audience_project_id, content_hash)
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_theme_manifests (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  theme_id              text NOT NULL,
  version               text NOT NULL,
  tokens                jsonb NOT NULL,
  accessibility_status  text NOT NULL CHECK (accessibility_status IN ('compliant_aa','compliant_aaa','non_compliant')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audience_project_id, theme_id, version)
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_editorial_profiles (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  persona_version_id    text NOT NULL,
  voice                 text NOT NULL,
  vocabulary            jsonb NOT NULL DEFAULT '[]',
  pillars               jsonb NOT NULL,
  formats               jsonb NOT NULL DEFAULT '[]',
  cadence               text NOT NULL,
  guardrails            jsonb NOT NULL,
  prohibited_topics     jsonb NOT NULL,
  language              text NOT NULL,
  disclosure_template   text NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audience_project_id, persona_version_id)
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_editorial_calendar (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  topic                 text NOT NULL,
  owner                 text NOT NULL,
  due_at                timestamptz NOT NULL,
  channel               text NOT NULL,
  status                text NOT NULL DEFAULT 'planned'
                        CHECK (status IN ('planned','briefed','drafting','review','blocked','done')),
  priority              integer NOT NULL DEFAULT 0,
  blocked_reason        text,
  UNIQUE (audience_project_id, topic, due_at)
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_research_briefs (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  intent                text NOT NULL CHECK (intent IN ('informational','commercial','transactional','navigational')),
  primary_keyword       text NOT NULL,
  secondary_terms       jsonb NOT NULL DEFAULT '[]',
  audience_desc         text NOT NULL,
  key_points            jsonb NOT NULL,
  limitations           jsonb NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_sources (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  url                   text NOT NULL,
  title                 text NOT NULL,
  origin                text NOT NULL,
  accessed_at           timestamptz NOT NULL,
  type                  text NOT NULL CHECK (type IN ('primary','news','academic','official','statistics','other')),
  supports_claim        text NOT NULL,
  limitation            text
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_article_drafts (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  version               integer NOT NULL CHECK (version >= 1),
  status                text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','in_review','fact_checked','seo_reviewed','blocked','approved_draft')),
  title                 text NOT NULL,
  slug                  text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  meta_description      text NOT NULL,
  outline               jsonb NOT NULL,
  body                  text NOT NULL,
  word_count            integer NOT NULL DEFAULT 0,
  author_persona_version_id text NOT NULL,
  claims                jsonb NOT NULL DEFAULT '[]',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audience_project_id, slug, version)
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_article_sources (
  draft_id              uuid NOT NULL REFERENCES custom_audience.audience_article_drafts(id) ON DELETE CASCADE,
  source_id             uuid NOT NULL REFERENCES custom_audience.audience_sources(id) ON DELETE CASCADE,
  PRIMARY KEY (draft_id, source_id)
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_channel_capabilities (
  id                    uuid PRIMARY KEY,
  channel               text NOT NULL,
  formats               jsonb NOT NULL,
  limits                jsonb NOT NULL,
  cadence               text NOT NULL,
  dependencies          jsonb NOT NULL,
  metrics               jsonb NOT NULL,
  risks                 jsonb NOT NULL,
  integration           text NOT NULL CHECK (integration IN ('available','planned','unavailable')),
  operational_cost      text NOT NULL CHECK (operational_cost IN ('low','medium','high')),
  data_provenance       jsonb NOT NULL,
  UNIQUE (channel)
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_channel_hypotheses (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  channel               text NOT NULL,
  score                 numeric(5,4) NOT NULL,
  rank                  integer NOT NULL,
  rationale             jsonb NOT NULL,
  uncertainties         jsonb NOT NULL DEFAULT '[]',
  missing_data          jsonb NOT NULL DEFAULT '[]',
  status                text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','rejected')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audience_project_id, channel)
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_channel_plans (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  hypothesis_id         uuid REFERENCES custom_audience.audience_channel_hypotheses(id),
  channel               text NOT NULL,
  objective             text NOT NULL,
  formats               jsonb NOT NULL,
  cadence               text NOT NULL,
  cta                   text NOT NULL,
  tone                  text NOT NULL,
  assets                jsonb NOT NULL DEFAULT '[]',
  approval_status       text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')),
  metrics               jsonb NOT NULL DEFAULT '[]',
  version               integer NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_social_variants (
  id                    uuid PRIMARY KEY,
  origin_content_id     uuid NOT NULL,
  origin_content_kind   text NOT NULL CHECK (origin_content_kind IN ('article_draft','brief')),
  channel               text NOT NULL,
  version               integer NOT NULL DEFAULT 1,
  content               jsonb NOT NULL,
  disclosure            text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (origin_content_id, channel, version)
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_social_approval_packages (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  variant_id            uuid NOT NULL REFERENCES custom_audience.audience_social_variants(id) ON DELETE CASCADE,
  channel               text NOT NULL,
  gate_status           text NOT NULL DEFAULT 'pending' CHECK (gate_status IN ('pending','approved','rejected','blocked')),
  reviewer              text,
  decision_reason       text,
  evidence              jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_ad_inventory (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  ad_type               text NOT NULL CHECK (ad_type IN ('affiliate','product')),
  title                 text NOT NULL,
  destination_url       text NOT NULL,
  disclosure_text       text NOT NULL,
  width                 integer NOT NULL CHECK (width IN (1250, 350)),
  height                integer NOT NULL CHECK (height IN (150, 350)),
  status                text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_analytics_events (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  event_name            text NOT NULL,
  channel               text NOT NULL,
  content_id            uuid,
  payload               jsonb NOT NULL DEFAULT '{}',
  is_verified_readback  boolean NOT NULL DEFAULT false,
  occurred_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_inbox_events (
  event_id              text PRIMARY KEY,
  consumer              text NOT NULL,
  idempotency_key       text UNIQUE NOT NULL,
  payload               jsonb NOT NULL DEFAULT '{}',
  status                text NOT NULL CHECK (status IN ('received','processed','rejected')),
  received_at           timestamptz NOT NULL DEFAULT now(),
  processed_at          timestamptz,
  last_error            text
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_outbox_events (
  event_id              text PRIMARY KEY,
  destination           text NOT NULL,
  event_type            text NOT NULL,
  payload               jsonb NOT NULL DEFAULT '{}',
  status                text NOT NULL CHECK (status IN ('pending','dispatched','failed')),
  attempts              integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  dispatched_at         timestamptz
);

CREATE TABLE IF NOT EXISTS custom_audience.audience_flux_jobs (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES custom_audience.audience_projects(id) ON DELETE CASCADE,
  job_type              text NOT NULL,
  status                text NOT NULL CHECK (status IN ('planned','running','waiting_gate','done','failed','blocked')),
  owner                 text NOT NULL,
  heartbeat_at          timestamptz,
  next_action           text,
  next_check_at         timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant ON custom_audience.audience_projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON custom_audience.audience_projects(status);
CREATE INDEX IF NOT EXISTS idx_calendar_due ON custom_audience.audience_editorial_calendar(audience_project_id, due_at);
CREATE INDEX IF NOT EXISTS idx_drafts_project ON custom_audience.audience_article_drafts(audience_project_id, status);
CREATE INDEX IF NOT EXISTS idx_analytics_project ON custom_audience.audience_analytics_events(audience_project_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_flux_jobs_status ON custom_audience.audience_flux_jobs(status, next_check_at);
