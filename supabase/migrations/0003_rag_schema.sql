-- Enable pgvector extension for vector search
--
-- Run in Supabase SQL Editor or via CLI:
--   supabase link && supabase db push

create extension if not exists vector;

-- ──────────────────────────────────────────────
-- 1. documents — top-level provenance for every knowledge source
-- ──────────────────────────────────────────────
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  source      text not null,                       -- e.g. 'charak-samhita', 'who-terminology', 'pubmed'
  source_url  text,
  category    text not null check (char_length(category) > 0),
  metadata    jsonb not null default '{}'::jsonb, -- free-form: author, sthana, chapter, etc.
  created_at  timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 2. document_sections — structured sections within a document
-- ──────────────────────────────────────────────
create table if not exists public.document_sections (
  id            uuid primary key default gen_random_uuid(),
  doc_id        uuid not null references public.documents(id) on delete cascade,
  section_title text not null default 'Untitled',
  content       text not null,
  start_line    int,
  end_line      int,
  sort_order    int not null default 0,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- 3. chunks — semantic chunks with embeddings
-- ──────────────────────────────────────────────
create table if not exists public.chunks (
  id            uuid primary key default gen_random_uuid(),
  section_id    uuid not null references public.document_sections(id) on delete cascade,
  content       text not null,
  embedding     vector(1024),                      -- MiniMax M3 dimension
  token_count   int,
  provenance_line int,                            -- exact line number in source file
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);

-- HNSW index for fast approximate nearest-neighbour search
create index if not exists chunks_embedding_hnsw
  on public.chunks
  using hnsw (embedding vector_cosine_ops);

-- Full-text (GIN) fallback index
create index if not exists chunks_content_gin
  on public.chunks
  using gin (to_tsvector('english', content));

-- ──────────────────────────────────────────────
-- 4. scaffolding for structured entities (disease, herb, treatment)
    -- These mirror the existing seed data and can be upgraded
    -- to use chunks as the canonical source once embedded.
-- ──────────────────────────────────────────────
create table if not exists public.diseases (
  id               uuid primary key default gen_random_uuid(),
  disease_code     text not null unique,
  name             text not null,
  sanskrit_name    text,
  category         text not null,
  modern_correlation text,
  samprapti        text,
  dosha_involvement  text[] not null default '{}',
  clinical_features  text[] not null default '{}',
  diagnostic_criteria text[] not null default '{}',
  treatment        text[] not null default '{}',
  pathya           text[] not null default '{}',
  apathya          text[] not null default '{}',
  prognosis        text,
  embedding        vector(1024),
  created_at       timestamptz not null default now()
);

create index if not exists diseases_embedding_hnsw on public.diseases using hnsw (embedding vector_cosine_ops);

create table if not exists public.herbs (
  id                  uuid primary key default gen_random_uuid(),
  herb_code           text not null unique,
  name                text not null,
  botanical_name      text,
  family              text,
  sanskrit_name       text,
  rasa                text[] not null default '{}',
  guna                text[] not null default '{}',
  virya               text not null default 'Sheeta',
  vipaka              text not null default 'Madhura',
  prabhava            text,
  dosha_karma         jsonb not null default '{}'::jsonb,
  indications         text[] not null default '{}',
  contraindications   text[] not null default '{}',
  part_used           text[] not null default '{}',
  dosage              text,
  classical_formulations jsonb not null default '{}'::jsonb,
  embedding           vector(1024),
  created_at          timestamptz not null default now()
);

-- Embeddings + full-text for herbs
create index if not exists herbs_embedding_hnsw on public.herbs using hnsw (embedding vector_cosine_ops);
create index if not exists herbs_content_gin    on public.herbs using gin (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(botanical_name, '') || ' ' || coalesce(array_to_string(indications, ' '))));

create table if not exists public.treatments (
  id                uuid primary key default gen_random_uuid(),
  treatment_code    text not null unique,
  name              text not null,
  sanskrit_name     text,
  category          text not null,
  description       text,
  indications       text[] not null default '{}',
  contraindications text[] not null default '{}',
  procedure       text[] not null default '{}',
  preparation       text[] not null default '{}',
  post_treatment    text[] not null default '{}',
  typical_duration  text,
  frequency         text,
  classical_reference text,
  embedding         vector(1024),
  created_at        timestamptz not null default now()
);

create index if not exists treatments_embedding_hnsw on public.treatments using hnsw (embedding vector_cosine_ops);

-- ──────────────────────────────────────────────
-- 5. who_terms — WHO International Standard Terminologies (3545 terms)
-- ──────────────────────────────────────────────
create table if not exists public.who_terms (
  id          uuid primary key default gen_random_uuid(),
  ita_code    text not null unique,                -- e.g. ITA-2.1.1
  term_en     text not null,
  term_sa     text,
  definition  text not null,
  category    text not null,                       -- e.g. 'Core Concepts'
  embedding   vector(1024),
  created_at  timestamptz not null default now()
);

create index if not exists who_terms_embedding_hnsw on public.who_terms using hnsw (embedding vector_cosine_ops);

-- ──────────────────────────────────────────────
-- 6. research_articles — cached external research
-- ──────────────────────────────────────────────
create table if not exists public.research_articles (
  id           uuid primary key default gen_random_uuid(),
  doi          text unique,
  title        text not null,
  abstract     text,
  authors      text[],
  source       text not null,                      -- e.g. 'PubMed', 'dhara.ayush.gov.in', 'CCRAS'
  source_url   text,
  disease_tags text[] not null default '{}',       -- extracted disease terms for fast filtering
  herb_tags    text[] not null default '{}',
  fetched_at   timestamptz not null default now(),
  embedding    vector(1024),
  created_at   timestamptz not null default now()
);

create index if not exists research_articles_embedding_hnsw on public.research_articles using hnsw (embedding vector_cosine_ops);
create index if not exists research_articles_disease_tags_gin on public.research_articles using gin(disease_tags);

-- ──────────────────────────────────────────────
-- 7. treatment_plans — accepted protocols (learning a + c)
-- ──────────────────────────────────────────────
create table if not exists public.treatment_plans (
  id                    uuid primary key default gen_random_uuid(),
  patient_age           int,
  patient_gender        text,
  prakriti              text,
  vikriti               text,
  diagnosis             text not null,
  diagnosis_sanskrit    text,
  protocol_json         jsonb not null,           -- structured treatment data
  protocol_summary      text not null,           -- human-readable summary for embedding
  outcome_notes         text,
  doctor_id             uuid not null references auth.users(id) on delete cascade,
  accepted_by_patient   boolean not null default false,
  is_public             boolean not null default false, -- anonymized for sharing
  published_for_learning boolean not null default false, -- opt-in for community learning
  embedding             vector(1024),
  created_at            timestamptz not null default now()
);

create index if not exists treatment_plans_embedding_hnsw on public.treatment_plans using hnsw (embedding vector_cosine_ops);

-- ──────────────────────────────────────────────
-- 8. clinical_cases — stored case data for retrieval learning
-- ──────────────────────────────────────────────
create table if not exists public.clinical_cases (
  id            uuid primary key default gen_random_uuid(),
  case_data     jsonb not null,                    -- full case structure
  diagnosis     text not null,
  treatment_given text,
  outcome       text,
  doctor_id     uuid not null references auth.users(id) on delete cascade,
  is_public     boolean not null default false,
  embedding     vector(1024),
  created_at    timestamptz not null default now()
);

create index if not exists clinical_cases_embedding_hnsw on public.clinical_cases using hnsw (embedding vector_cosine_ops);
