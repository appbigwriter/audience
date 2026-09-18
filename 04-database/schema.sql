create schema if not exists custom_fbr_blogs;
set search_path = custom_fbr_blogs;
create table if not exists blog_config (id uuid primary key, name text not null, slug text unique not null, niche text not null, language text not null, voice text not null, domain text, cadence int not null default 3, created_at timestamptz not null default now());
create table if not exists blog_agents (id uuid primary key, blog_id uuid not null, role text not null, profile_id text not null, validation_status text not null check (validation_status in ('pending','validated','blocked')));
create table if not exists editorial_jobs (id uuid primary key, blog_id uuid not null, kind text not null check (kind in ('niche','affiliate_radar')), status text not null check (status in ('planned','research','outline','writing','seo_review','ads_review','draft','approved','published','blocked')), owner text not null, due_at timestamptz not null);
create table if not exists handoff_deliveries (id uuid primary key, blog_id uuid not null, document_name text not null, receipt text not null, status text not null, created_at timestamptz not null default now(), unique(blog_id, document_name));
create table if not exists workflow_events (id uuid primary key, blog_id uuid not null, agent text not null, action text not null, artifact text, created_at timestamptz not null default now());
create table if not exists ad_inventory (id uuid primary key, blog_id uuid not null, ad_type text not null check (ad_type in ('affiliate','product')), title text not null, destination_url text not null, disclosure_text text, width int, height int, status text not null);
create index if not exists editorial_jobs_blog_due on editorial_jobs(blog_id,due_at);

-- Local contract only: review and gate before any remote migration.
create table if not exists blog_persona_bindings (
  id uuid primary key, blog_id uuid not null, tenant_id text not null, flux_project_id text not null,
  persona_id uuid not null, persona_version_id uuid not null, persona_version int not null,
  snapshot_hash text not null, binding_status text not null check (binding_status in ('bound','invalidated')),
  source_event_id text not null, idempotency_key text not null unique, correlation_id text not null,
  causation_id text, bound_at timestamptz not null, created_at timestamptz not null default now()
);
create table if not exists editorial_profiles (
  blog_id uuid primary key, persona_id uuid not null, persona_version_id uuid not null,
  snapshot_hash text not null, blog_channel_plan jsonb not null, pillars jsonb not null,
  priority_topics jsonb not null, prohibited_topics jsonb not null, social_channel_plan jsonb not null,
  youtube_channel_plan jsonb not null, created_at timestamptz not null default now()
);
create table if not exists integration_inbox_events (
  event_id text primary key, consumer text not null, idempotency_key text not null unique,
  status text not null check (status in ('received','processed','rejected')), received_at timestamptz not null default now(),
  processed_at timestamptz, last_error text
);
