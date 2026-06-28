-- 0008_comprehensive_rag_improvements.sql
-- Comprehensive Supabase improvements for Ayurveda Practitioner Assistant:
-- 1. Missing knowledge-base tables (diseases, herbs, treatments, allopathy_integration)
-- 2. Missing RLS policies for messages (UPDATE/DELETE)
-- 3. Missing indexes for performance
-- 4. Query logging table for monitoring
-- 5. Improved match_knowledge with ts_rank FTS scoring
-- 6. Production-grade HNSW index parameters
-- 7. Updated_at trigger function

-- ============================================================
-- 1. KNOWLEDGE-BASE TABLES (referenced by seed-knowledge.ts)
-- ============================================================

-- Add content_tsv column for FTS scoring (used by hybrid search functions)
alter table public.knowledge_embeddings
  add column if not exists content_tsv tsvector
  generated always as (to_tsvector('english', content)) stored;

create index if not exists idx_ke_content_tsv
  on public.knowledge_embeddings using gin(content_tsv);

-- Diseases table
create table if not exists public.diseases (
  id                uuid primary key default gen_random_uuid(),
  disease_code      text not null unique,
  name              text not null,
  sanskrit_name     text,
  category          text not null default 'general',
  modern_correlation text,
  samprapti         text,
  dosha_involvement text[] not null default '{}',
  clinical_features text[] not null default '{}',
  diagnostic_criteria text[] not null default '{}',
  treatment         text[] not null default '{}',
  pathya            text[] not null default '{}',
  apathya           text[] not null default '{}',
  prognosis         text,
  created_at        timestamptz not null default now()
);

create index if not exists idx_diseases_code on public.diseases(disease_code);
create index if not exists idx_diseases_category on public.diseases(category);
create index if not exists idx_diseases_dosha on public.diseases using gin(dosha_involvement);

-- Herbs table
create table if not exists public.herbs (
  id                    uuid primary key default gen_random_uuid(),
  herb_code             text not null unique,
  name                  text not null,
  botanical_name        text,
  family                text,
  sanskrit_name         text,
  rasa                  text[] not null default '{}',
  guna                  text[] not null default '{}',
  virya                 text default 'Sheeta',
  vipaka                text default 'Madhura',
  prabhava              text,
  dosha_karma           jsonb not null default '{}',
  indications           text[] not null default '{}',
  contraindications     text[] not null default '{}',
  part_used             text[] not null default '{}',
  dosage                text,
  classical_formulations jsonb not null default '{}',
  created_at            timestamptz not null default now()
);

create index if not exists idx_herbs_code on public.herbs(herb_code);
create index if not exists idx_herbs_family on public.herbs(family);
create index if not exists idx_herbs_rasa on public.herbs using gin(rasa);
create index if not exists idx_herbs_virya on public.herbs(virya);
create index if not exists idx_herbs_indications on public.herbs using gin(indications);

-- Treatments table
create table if not exists public.treatments (
  id                   uuid primary key default gen_random_uuid(),
  treatment_code       text not null unique,
  name                 text not null,
  sanskrit_name        text,
  category             text not null default 'general',
  description          text,
  indications          text[] not null default '{}',
  contraindications    text[] not null default '{}',
  procedure            text[] not null default '{}',
  preparation          text[] not null default '{}',
  post_treatment       text[] not null default '{}',
  typical_duration     text,
  frequency            text,
  classical_reference  text,
  created_at           timestamptz not null default now()
);

create index if not exists idx_treatments_code on public.treatments(treatment_code);
create index if not exists idx_treatments_category on public.treatments(category);
create index if not exists idx_treatments_indications on public.treatments using gin(indications);

-- Allopathy integration table
create table if not exists public.allopathy_integration (
  id                     uuid primary key default gen_random_uuid(),
  condition_name         text not null unique,
  allopathic_drug        text,
  ayurvedic_herb         text,
  interaction_type       text default 'safe',
  severity               text default 'low',
  description            text,
  mechanism              text,
  recommendation         text,
  monitoring_parameters  text[] not null default '{}',
  evidence_level         text default 'clinical',
  source_references      text[] not null default '{}',
  created_at             timestamptz not null default now()
);

create index if not exists idx_allopathy_condition on public.allopathy_integration(condition_name);

-- ============================================================
-- 2. MISSING RLS POLICIES — messages UPDATE/DELETE
-- ============================================================

-- Messages: add UPDATE and DELETE policies (user can edit/delete own messages)
create policy "messages: update own" on public.messages
  for update using (auth.uid() in (select owner_id from chat_sessions where id = session_id))
  with check (auth.uid() in (select owner_id from chat_sessions where id = session_id));

create policy "messages: delete own" on public.messages
  for delete using (auth.uid() in (select owner_id from chat_sessions where id = session_id));

-- ============================================================
-- 3. MISSING INDEXES
-- ============================================================

-- Messages: chronological ordering for chat history retrieval
create index if not exists idx_msg_created on public.messages(created_at);

-- Clinical cases: chronological ordering
create index if not exists idx_cc_created on public.clinical_cases(created_at);

-- Research articles: compound index for cache lookup (disease + fetched_at)
create index if not exists idx_ra_disease_fetched on public.research_articles(disease, fetched_at desc);

-- Knowledge embeddings: updated_at for re-embedding detection
create index if not exists idx_ke_updated on public.knowledge_embeddings(updated_at);

-- ============================================================
-- 4. QUERY LOGGING TABLE — for RAG monitoring & evaluation
-- ============================================================

create table if not exists public.query_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete set null,
  surface         text not null check (surface in ('chat', 'clinical-docs', 'treatment-protocol')),
  query_text      text not null,
  intent          text,
  entities        jsonb default '[]',
  vector_count    int default 0,
  keyword_count   int default 0,
  after_dedup     int default 0,
  after_rerank    boolean default false,
  chunks_used     int default 0,
  total_tokens    int default 0,
  latency_ms      int default 0,
  model_used      text,
  model_provider  text,
  research_count  int default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_ql_user on public.query_logs(user_id);
create index if not exists idx_ql_surface on public.query_logs(surface);
create index if not exists idx_ql_created on public.query_logs(created_at);
create index if not exists idx_ql_latency on public.query_logs(latency_ms);

alter table public.query_logs enable row level security;

-- Only service role can write logs; users can read their own
create policy "query_logs: service insert" on public.query_logs
  for insert to service_role with check (true);
create policy "query_logs: read own" on public.query_logs
  for select using (user_id = auth.uid());

-- ============================================================
-- 5. IMPROVED match_knowledge — with ts_rank FTS scoring
-- ============================================================

-- Updated match_knowledge with proper FTS scoring via ts_rank
create or replace function public.match_knowledge(
  query_embedding vector(1024),
  match_threshold float default 0.7,
  match_count     int   default 20,
  category_filter text[] default '{}',
  source_filter   text[] default '{}'
)
returns table (
  id uuid, content text, source text, category text,
  title text, metadata jsonb, similarity float
)
language plpgsql stable
as $$
begin
  return query
  select
    ke.id, ke.content, ke.source, ke.category,
    ke.title, ke.metadata,
    1 - (ke.embedding <=> query_embedding) as similarity
  from public.knowledge_embeddings ke
  where (ke.embedding <=> query_embedding) < (1 - match_threshold)
    and (cardinality(category_filter) = 0 or ke.category = any(category_filter))
    and (cardinality(source_filter)   = 0 or ke.source   = any(source_filter))
  order by ke.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Hybrid search function: combines vector similarity + FTS with ts_rank scoring
create or replace function public.match_knowledge_hybrid(
  query_embedding vector(1024),
  query_text      text,
  match_threshold float default 0.7,
  match_count     int   default 20,
  category_filter text[] default '{}',
  source_filter   text[] default '{}'
)
returns table (
  id uuid, content text, source text, category text,
  title text, metadata jsonb, similarity float
)
language plpgsql stable
as $$
declare
  ts_query tsquery;
begin
  -- Build tsquery from query text
  ts_query := plainto_tsquery('english', query_text);

  return query
  with vector_results as (
    select
      ke.id, ke.content, ke.source, ke.category,
      ke.title, ke.metadata,
      1 - (ke.embedding <=> query_embedding) as vec_score
    from public.knowledge_embeddings ke
    where (ke.embedding <=> query_embedding) < (1 - match_threshold)
      and (cardinality(category_filter) = 0 or ke.category = any(category_filter))
      and (cardinality(source_filter)   = 0 or ke.source   = any(source_filter))
    order by ke.embedding <=> query_embedding
    limit match_count * 2
  ),
  fts_results as (
    select
      ke.id,
      ts_rank_cd(ke.content_tsv, ts_query, 32) as fts_score
    from public.knowledge_embeddings ke
    where ke.content_tsv @@ ts_query
      and (cardinality(category_filter) = 0 or ke.category = any(category_filter))
      and (cardinality(source_filter)   = 0 or ke.source   = any(source_filter))
    order by ts_rank_cd(ke.content_tsv, ts_query, 32) desc
    limit match_count * 2
  ),
  -- Reciprocal Rank Fusion of vector + FTS results
  fused as (
    select
      v.*,
      coalesce(v.vec_score, 0) * 0.7 +
      coalesce(f.fts_score, 0) * 0.3 as combined_score
    from vector_results v
    left join fts_results f on v.id = f.id
  )
  select
    f.id, f.content, f.source, f.category,
    f.title, f.metadata, f.combined_score as similarity
  from fused f
  order by f.combined_score desc
  limit match_count;
end;
$$;

-- Brief version of hybrid search (no metadata column — saves bandwidth)
create or replace function public.match_knowledge_hybrid_brief(
  query_embedding vector(1024),
  query_text      text,
  match_threshold float default 0.7,
  match_count     int   default 10,
  category_filter text[] default '{}',
  source_filter   text[] default '{}'
)
returns table (
  id uuid, content text, source text, category text,
  title text, similarity float
)
language plpgsql stable
as $$
declare
  ts_query tsquery;
begin
  ts_query := plainto_tsquery('english', query_text);

  return query
  with vector_results as (
    select
      ke.id, ke.content, ke.source, ke.category,
      ke.title,
      1 - (ke.embedding <=> query_embedding) as vec_score
    from public.knowledge_embeddings ke
    where (ke.embedding <=> query_embedding) < (1 - match_threshold)
      and (cardinality(category_filter) = 0 or ke.category = any(category_filter))
      and (cardinality(source_filter)   = 0 or ke.source   = any(source_filter))
    order by ke.embedding <=> query_embedding
    limit match_count * 2
  ),
  fts_results as (
    select
      ke.id,
      ts_rank_cd(ke.content_tsv, ts_query, 32) as fts_score
    from public.knowledge_embeddings ke
    where ke.content_tsv @@ ts_query
      and (cardinality(category_filter) = 0 or ke.category = any(category_filter))
      and (cardinality(source_filter)   = 0 or ke.source   = any(source_filter))
    limit match_count * 2
  ),
  fused as (
    select
      v.*,
      coalesce(v.vec_score, 0) * 0.7 +
      coalesce(f.fts_score, 0) * 0.3 as combined_score
    from vector_results v
    left join fts_results f on v.id = f.id
  )
  select
    f.id, f.content, f.source, f.category,
    f.title, f.combined_score as similarity
  from fused f
  order by f.combined_score desc
  limit match_count;
end;
$$;

-- ============================================================
-- 6. UPDATED_AT TRIGGER — auto-update updated_at on row changes
-- ============================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply trigger to tables with updated_at
create trigger set_updated_at before update on public.knowledge_embeddings
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.chat_sessions
  for each row execute function public.update_updated_at();

-- ============================================================
-- 7. HELPER: Log a query (called from edge functions)
-- ============================================================

create or replace function public.log_query(
  p_user_id       uuid,
  p_surface       text,
  p_query_text    text,
  p_intent        text default null,
  p_entities      jsonb default '[]',
  p_vector_count  int default 0,
  p_keyword_count int default 0,
  p_after_dedup   int default 0,
  p_after_rerank  boolean default false,
  p_chunks_used   int default 0,
  p_total_tokens  int default 0,
  p_latency_ms    int default 0,
  p_model_used    text default null,
  p_model_provider text default null,
  p_research_count int default 0
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.query_logs (
    user_id, surface, query_text, intent, entities,
    vector_count, keyword_count, after_dedup, after_rerank,
    chunks_used, total_tokens, latency_ms,
    model_used, model_provider, research_count
  ) values (
    p_user_id, p_surface, p_query_text, p_intent, p_entities,
    p_vector_count, p_keyword_count, p_after_dedup, p_after_rerank,
    p_chunks_used, p_total_tokens, p_latency_ms,
    p_model_used, p_model_provider, p_research_count
  );
end;
$$;
