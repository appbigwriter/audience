-- Migration: 001_audience_builder_foundation.sql
-- Task: FBR-BLOGS-PLAN-20260921-002 (Agente A — backend track)
-- Stories: AB-S2-002, AB-S2-003, AB-S2-004, AB-S2-005, AB-S2-006
--
-- LOCAL/VERSIONADO SOMENTE: não aplicar em banco remoto sem Gate do Sergio.
-- Convenção segue 04-database/schema.sql (snake_case, uuid, timestamptz).
-- Aplicação exige executor transacional (cada arquivo é atômico).

-- =============================================================================
-- audience_persona_bindings (AB-S2-003) — vínculo imutável Persona↔Projeto
-- =============================================================================

-- Histórico de bindings: um por (project, persona_version). Imutável após gravação.
CREATE TABLE IF NOT EXISTS audience_persona_bindings (
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
  snapshot              jsonb NOT NULL,          -- snapshot aprovado (evidência, não estado operacional)
  UNIQUE (audience_project_id, persona_version_id),
  UNIQUE (audience_project_id, content_hash)
);

-- =============================================================================
-- audience_projects (AB-S2-001/S2-002)
-- =============================================================================

CREATE TABLE IF NOT EXISTS audience_projects (
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
  current_binding_id    uuid REFERENCES audience_persona_bindings(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, owner_id, slug)   -- duplicidade slug/owner controlada
);

CREATE INDEX IF NOT EXISTS idx_audience_projects_tenant ON audience_projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audience_projects_status ON audience_projects(status);
CREATE INDEX IF NOT EXISTS idx_audience_projects_binding ON audience_projects(current_binding_id);

-- binding só pode ser apontado por projeto do mesmo id referenciado no binding
-- (constraint aplicada na camada de domínio; FK garante existência).

-- =============================================================================
-- audience_project_transitions (AB-S1-005) — evidência de cada transição
-- =============================================================================

CREATE TABLE IF NOT EXISTS audience_project_transitions (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
  from_status           text NOT NULL,
  to_status             text NOT NULL,
  actor                 text NOT NULL,
  reason                text NOT NULL,
  occurred_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transitions_project ON audience_project_transitions(audience_project_id, occurred_at);

-- =============================================================================
-- audience_potential_niches (AB-S2-004) — hipóteses, nunca decisão
-- =============================================================================

CREATE TABLE IF NOT EXISTS audience_potential_niches (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
  niche_id              text NOT NULL,
  label                 text NOT NULL,
  origin                text NOT NULL,
  observed_at           timestamptz NOT NULL,
  confidence            numeric(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  evidence              jsonb NOT NULL DEFAULT '[]',
  limitations           jsonb NOT NULL,          -- obrigatório não-vazio (validado no domínio)
  signals               jsonb NOT NULL DEFAULT '[]',
  classification        text NOT NULL DEFAULT 'under_analysis'
                        CHECK (classification IN ('candidate','discarded','under_analysis')),
  kind                  text NOT NULL DEFAULT 'hypothesis' CHECK (kind = 'hypothesis'),
  classified_at         timestamptz NOT NULL DEFAULT now(),
  classified_by         text NOT NULL,
  UNIQUE (audience_project_id, niche_id)
);

-- =============================================================================
-- audience_project_manifestos (AB-S2-005) — versionado por projeto
-- =============================================================================

CREATE TABLE IF NOT EXISTS audience_project_manifestos (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
  version               integer NOT NULL CHECK (version >= 1),
  contract_version      integer NOT NULL DEFAULT 1,
  manifesto             jsonb NOT NULL,          -- conteúdo integral versionado
  content_hash          text NOT NULL CHECK (content_hash ~ '^sha256:[0-9a-f]{64}$'),
  created_at            timestamptz NOT NULL DEFAULT now(),
  created_by            text NOT NULL,
  UNIQUE (audience_project_id, version)
);

-- =============================================================================
-- audience_configuration_packages (AB-S2-006) — pacote consumível
-- =============================================================================

CREATE TABLE IF NOT EXISTS audience_configuration_packages (
  id                    uuid PRIMARY KEY,
  audience_project_id   uuid NOT NULL REFERENCES audience_projects(id) ON DELETE CASCADE,
  manifesto_id          uuid NOT NULL REFERENCES audience_project_manifestos(id),
  manifesto_version     integer NOT NULL,
  manifesto_hash        text NOT NULL,
  package               jsonb NOT NULL,          -- referências + derivados, SEM secrets
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audience_project_id, manifesto_version)
);

-- =============================================================================
-- RLS planejado (AB-S2-002 aceite): ativar por tenant quando em Postgres.
-- =============================================================================
-- ALTER TABLE audience_projects ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation ON audience_projects
--   USING (tenant_id = current_setting('app.tenant_id', true));
-- (idem para tabelas dependentes via join; política completa exige runtime
--  de auth do Flux e permanece pendente de Gate — documentado no MP-000-AB.)

-- FIM — 001_audience_builder_foundation.sql
