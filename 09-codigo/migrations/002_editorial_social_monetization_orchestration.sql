-- Migration: 002_editorial_social_monetization_orchestration.sql
-- Task: FBR-BLOGS-PLAN-20260921-002 (Agente A — backend track)
-- Stories: AB-S4-002..009 (parcial backend), AB-S5-006..009, AB-S6-001..006, AB-S7-001..003
--
-- LOCAL/VERSIONADO SOMENTE: aplicação remota exige Gate do Sergio.

-- =============================================================================
-- Editorial (S4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audience_editorial_profiles (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS audience_editorial_calendar (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS audience_research_briefs (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
  intent                text NOT NULL CHECK (intent IN ('informational','commercial','transactional','navigational')),
  primary_keyword       text NOT NULL,
  secondary_terms       jsonb NOT NULL DEFAULT '[]',
  audience_desc         text NOT NULL,
  key_points            jsonb NOT NULL,          -- >= 4 pontos (validado no domínio)
  limitations           jsonb NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audience_sources (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
  url                   text NOT NULL,
  title                 text NOT NULL,
  origin                text NOT NULL,
  accessed_at           timestamptz NOT NULL,
  type                  text NOT NULL CHECK (type IN ('primary','news','academic','official','statistics','other')),
  supports_claim        text NOT NULL,
  limitation            text
);

CREATE TABLE IF NOT EXISTS audience_article_drafts (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
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
  claims                jsonb NOT NULL DEFAULT '[]',   -- [{text,classification,sourceIds}]
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audience_project_id, slug, version)
);

CREATE TABLE IF NOT EXISTS audience_article_sources (
  draft_id              uuid NOT NULL REFERENCES audience_article_drafts(id) ON DELETE CASCADE,
  source_id             uuid NOT NULL REFERENCES audience_sources(id) ON DELETE CASCADE,
  PRIMARY KEY (draft_id, source_id)
);

-- =============================================================================
-- Channel discovery + social (S5)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audience_channel_capabilities (
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
  data_provenance       jsonb NOT NULL,          -- [{field,source,retrievedAt}]
  UNIQUE (channel)
);

CREATE TABLE IF NOT EXISTS audience_channel_hypotheses (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS audience_channel_plans (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
  hypothesis_id         uuid REFERENCES audience_channel_hypotheses(id),
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

CREATE TABLE IF NOT EXISTS audience_social_variants (
  id                    uuid PRIMARY KEY,
  origin_content_id     uuid NOT NULL,
  origin_content_kind   text NOT NULL CHECK (origin_content_kind IN ('article_draft','brief')),
  channel               text NOT NULL,
  version               integer NOT NULL DEFAULT 1,
  content               jsonb NOT NULL,          -- adaptado, não copiado
  disclosure            text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (origin_content_id, channel, version)
);

CREATE TABLE IF NOT EXISTS audience_social_approval_packages (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
  variant_ids           jsonb NOT NULL,
  channel               text NOT NULL,
  risk_notes            jsonb NOT NULL DEFAULT '[]',
  source_refs           jsonb NOT NULL DEFAULT '[]',
  cta                    text NOT NULL,
  status                text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','blocked')),
  created_at            timestamptz NOT NULL DEFAULT now()
  -- publicação bloqueada sem Gate aplicável (política no domínio)
);

CREATE TABLE IF NOT EXISTS audience_channel_feedback (
  id                    uuid PRIMARY KEY,
  hypothesis_id         uuid NOT NULL REFERENCES audience_channel_hypotheses(id) ON DELETE CASCADE,
  metric_type           text NOT NULL,
  metric_value          numeric(14,4) NOT NULL,
  origin                text NOT NULL CHECK (origin IN ('measured','estimated')),
  readback_ref          text,                    -- obrigatório quando measured
  observed_at           timestamptz NOT NULL,
  recorded_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- Monetização + analytics (S6)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audience_ad_inventory (
  id                    uuid PRIMARY KEY,
  item_id               text NOT NULL UNIQUE,
  advertiser            text NOT NULL,
  kind                  text NOT NULL CHECK (kind IN ('product_ad','affiliate')),
  destination_url       text NOT NULL,
  niche                 text NOT NULL,
  disclosure_required   boolean NOT NULL DEFAULT true CHECK (disclosure_required),
  valid_from            timestamptz NOT NULL,
  valid_until           timestamptz NOT NULL,
  allowed_formats       jsonb NOT NULL,          -- subset de 1250x150 / 350x350
  status                text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','expired')),
  fbr_ads_ref           text NOT NULL            -- referência ao FBR Ads central
);

CREATE TABLE IF NOT EXISTS audience_monetization_bindings (
  id                    uuid PRIMARY KEY,
  article_draft_id      uuid NOT NULL REFERENCES audience_article_drafts(id) ON DELETE CASCADE,
  affiliate_item_id     text REFERENCES audience_ad_inventory(item_id),
  product_ad_item_id    text REFERENCES audience_ad_inventory(item_id),
  status                text NOT NULL CHECK (status IN ('bound','blocked')),
  disclosure            text NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (affiliate_item_id IS NOT NULL OR product_ad_item_id IS NOT NULL OR status = 'blocked')
);

CREATE TABLE IF NOT EXISTS audience_metrics_events (
  id                    uuid PRIMARY KEY,
  event_id              text NOT NULL,
  event_version         integer NOT NULL DEFAULT 1,
  type                  text NOT NULL CHECK (type IN ('view','click','conversion','signup')),
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
  content_id            text,
  channel               text,
  origin                text NOT NULL CHECK (origin IN ('measured','estimated','imported')),
  occurred_at           timestamptz NOT NULL,
  value                 numeric(18,4) NOT NULL CHECK (value >= 0),
  readback_ref          text,                    -- obrigatório quando origin=measured
  UNIQUE (event_id, audience_project_id)
);

-- =============================================================================
-- Orquestração (S7)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audience_jobs (
  id                    uuid PRIMARY KEY,
  job_id                text NOT NULL,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
  kind                  text NOT NULL CHECK (kind IN ('intake','persona_binding','manifesto','template','editorial','social','provisioning')),
  status                text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','running','waiting_external','blocked','success','failed')),
  owner                 text NOT NULL,
  depends_on            jsonb NOT NULL DEFAULT '[]',
  heartbeat_at          timestamptz NOT NULL DEFAULT now(),
  next_action           text NOT NULL,
  next_check_at         timestamptz NOT NULL DEFAULT now(),
  attempts              integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id)
);

CREATE TABLE IF NOT EXISTS audience_handoffs (
  id                    uuid PRIMARY KEY,
  handoff_id            text NOT NULL,
  version               integer NOT NULL DEFAULT 1,
  from_actor            text NOT NULL,
  to_actor              text NOT NULL,
  objective             text NOT NULL,
  artifact_path         text NOT NULL,
  decisions             jsonb NOT NULL DEFAULT '[]',
  blockers              jsonb NOT NULL DEFAULT '[]',
  gate                  text,
  accepted_by           text,
  accepted_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (handoff_id, version),
  CHECK (accepted_by IS NULL OR accepted_at IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS audience_inbox_events (
  id                    uuid PRIMARY KEY,
  event_id              text NOT NULL,
  consumer              text NOT NULL,
  event_type            text NOT NULL,
  received_at           timestamptz NOT NULL DEFAULT now(),
  processed_at          timestamptz,
  status                text NOT NULL DEFAULT 'received'
                        CHECK (status IN ('received','processing','success','failed')),
  attempt_count         integer NOT NULL DEFAULT 0,
  last_error            text,
  next_retry_at         timestamptz,
  payload_hash          text NOT NULL,
  UNIQUE (event_id, consumer)                    -- dedup idempotente
);

-- FIM — 002_editorial_social_monetization_orchestration.sql
