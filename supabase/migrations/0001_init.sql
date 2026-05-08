-- 0001_init.sql — Hantavirus Tracker schema
-- Run in Supabase SQL editor (or via supabase db push) on a fresh project.

-- =============================================================
-- Extensions
-- =============================================================
create extension if not exists "pgcrypto";       -- gen_random_uuid
create extension if not exists "postgis";        -- geo (optional v1, useful later)

-- =============================================================
-- sources: raw ingested items, deduped by URL
-- =============================================================
create table if not exists sources (
  id            uuid primary key default gen_random_uuid(),
  url           text unique not null,
  url_hash      text generated always as (md5(url)) stored,
  source_type   text not null,                       -- 'who','gdelt','google_news','reddit','bluesky','promed','cdc','ecdc','paho'
  title         text,
  body          text,
  published_at  timestamptz,
  language      text,
  fetched_at    timestamptz not null default now(),
  raw           jsonb
);
create index if not exists sources_published_at_idx on sources (published_at desc);
create index if not exists sources_source_type_idx  on sources (source_type);

-- =============================================================
-- case_reports: extracted case/death events
-- =============================================================
create table if not exists case_reports (
  id                uuid primary key default gen_random_uuid(),
  source_id         uuid references sources(id) on delete cascade,
  country_iso2      char(2) not null,
  region            text,
  locality          text,
  lat               numeric,
  lon               numeric,
  cases_confirmed   int not null default 0,
  cases_suspected   int not null default 0,
  deaths            int not null default 0,
  report_date       date not null,
  virus_strain      text,                              -- 'sin_nombre' | 'andes' | 'seoul' | 'puumala' | null
  confidence        numeric,                           -- 0..1, LLM self-report
  extraction_method text not null default 'llm',      -- 'llm' | 'manual' | 'imported'
  notes             text,
  created_at        timestamptz not null default now()
);
create index if not exists case_reports_country_date_idx on case_reports (country_iso2, report_date desc);
create index if not exists case_reports_date_idx         on case_reports (report_date desc);
create unique index if not exists case_reports_dedupe_idx
  on case_reports (source_id, country_iso2, coalesce(region,''), report_date);

-- =============================================================
-- daily_country_totals: fast dashboard aggregate
-- =============================================================
create materialized view if not exists daily_country_totals as
select
  country_iso2,
  report_date,
  sum(cases_confirmed)::int as cases_confirmed,
  sum(deaths)::int          as deaths
from case_reports
group by country_iso2, report_date;

create unique index if not exists daily_country_totals_pk
  on daily_country_totals (country_iso2, report_date);

-- =============================================================
-- geocode_cache: stay polite with Nominatim
-- =============================================================
create table if not exists geocode_cache (
  query         text primary key,
  lat           numeric,
  lon           numeric,
  country_iso2  char(2),
  resolved_at   timestamptz not null default now()
);

-- =============================================================
-- extractions: LLM audit log (cost + debugging)
-- =============================================================
create table if not exists extractions (
  id              uuid primary key default gen_random_uuid(),
  source_id       uuid references sources(id) on delete cascade,
  model           text,
  input_tokens    int,
  output_tokens   int,
  cost_usd        numeric,
  result          jsonb,
  status          text,                                -- 'ok' | 'rejected' | 'error'
  created_at      timestamptz not null default now()
);
create index if not exists extractions_source_idx on extractions (source_id);

-- =============================================================
-- Row Level Security: public read on dashboard tables, no public writes
-- =============================================================
alter table sources       enable row level security;
alter table case_reports  enable row level security;
alter table geocode_cache enable row level security;
alter table extractions   enable row level security;

drop policy if exists "public read sources"       on sources;
drop policy if exists "public read case_reports"  on case_reports;

create policy "public read sources"      on sources       for select to anon, authenticated using (true);
create policy "public read case_reports" on case_reports  for select to anon, authenticated using (true);
-- geocode_cache and extractions are NOT publicly readable — service role only.
