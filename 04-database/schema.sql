create schema if not exists custom_fbr_blogs;
set search_path = custom_fbr_blogs;
create table if not exists blog_config (id uuid primary key, name text not null, slug text unique not null, niche text not null, language text not null, voice text not null, cadence int not null default 3, created_at timestamptz not null default now());
create table if not exists blog_agents (id uuid primary key, blog_id uuid not null, role text not null, profile_id text not null, validation_status text not null check (validation_status in ('pending','validated','blocked')));
create table if not exists editorial_jobs (id uuid primary key, blog_id uuid not null, kind text not null check (kind in ('niche','affiliate_radar')), status text not null check (status in ('planned','research','outline','writing','seo_review','ads_review','draft','approved','published','blocked')), owner text not null, due_at timestamptz not null);
create table if not exists ad_inventory (id uuid primary key, blog_id uuid not null, ad_type text not null check (ad_type in ('affiliate','product')), title text not null, destination_url text not null, disclosure_text text, width int, height int, status text not null);
create index if not exists editorial_jobs_blog_due on editorial_jobs(blog_id,due_at);
