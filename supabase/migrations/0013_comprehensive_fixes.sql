-- 0013_comprehensive_fixes.sql
-- Comprehensive fixes for all identified issues:
-- 1. match_clinical_cases vector(1020) → vector(1024) fix
-- 2. research_articles unique constraint for upsert
-- 3. match_knowledge_fts — pure FTS function with ts_rank scoring
-- 4. Optimize query_logs RLS with (select auth.uid())
-- 5. Update updated_at trigger on clinical_cases and patients

-- ============================================================
-- 1. FIX match_clinical_cases — vector(1020) → vector(1024)
-- ============================================================

create or replace function public.match_clinical_cases(
  query_embedding vector(1024),
  match_threshold float default 0.6,
  match_count     int   default 5,
  p_user_id       uuid
)
returns table (
  id uuid, diagnosis text, patient_summary text,
  treatment_plan text, outcome text, similarity float
)
language plpgsql stable
security definer
set search_path = public
as $$
begin
  return query
  select
    cc.id, cc.diagnosis, cc.patient_summary,
    cc.treatment_plan, cc.outcome,
    1 - (cc.embedding <=> query_embedding) as similarity
  from public.clinical_cases cc
  where cc.user_id = p_user_id
    and (cc.embedding <=> query_embedding) < (1 - match_threshold)
  order by cc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================================
-- 2. UNIQUE CONSTRAINT on research_articles for upsert
-- ============================================================

-- Add unique constraint if not exists (for onConflict: 'title,disease' upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'research_articles_title_disease_key'
    AND conrelid = 'public.research_articles'::regclass
  ) THEN
    ALTER TABLE public.research_articles
      ADD CONSTRAINT research_articles_title_disease_key UNIQUE (title, disease);
  END IF;
END
$$;

-- ============================================================
-- 3. match_knowledge_fts — Pure FTS function with ts_rank scoring
-- ============================================================

create or replace function public.match_knowledge_fts(
  query_text text,
  match_count int default 10
)
returns table (
  id uuid, content text, source text, category text,
  title text, metadata jsonb, similarity float
)
language plpgsql stable
security definer
set search_path = public
as $$
declare
  ts_query tsquery;
begin
  -- Build tsquery from query text
  ts_query := plainto_tsquery('english', query_text);

  return query
  select
    ke.id, ke.content, ke.source, ke.category,
    ke.title, ke.metadata,
    ts_rank_cd(ke.content_tsv, ts_query, 32) as similarity
  from public.knowledge_embeddings ke
  where ke.content_tsv @@ ts_query
  order by ts_rank_cd(ke.content_tsv, ts_query, 32) desc
  limit match_count;
end;
$$;

-- ============================================================
-- 4. OPTIMIZE query_logs RLS — use (select auth.uid())
-- ============================================================

drop policy if exists "query_logs: read own" on public.query_logs;
create policy "query_logs: read own" on public.query_logs
  for select using ((select auth.uid()) = user_id);

-- ============================================================
-- 5. UPDATED_AT TRIGGER on clinical_cases + patients
-- ============================================================

create trigger set_updated_at before update on public.clinical_cases
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.patients
  for each row execute function public.update_updated_at();

-- ============================================================
-- 6. UPDATE log_query — add set search_path for safety
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
set search_path = public
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

-- ============================================================
-- 7. UPDATE all other functions — add set search_path for safety
-- ============================================================

-- match_knowledge
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
security definer
set search_path = public
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

-- match_knowledge_brief
create or replace function public.match_knowledge_brief(
  query_embedding vector(1024),
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
security definer
set search_path = public
as $$
begin
  return query
  select
    ke.id, ke.content, ke.source, ke.category,
    ke.title,
    1 - (ke.embedding <=> query_embedding) as similarity
  from public.knowledge_embeddings ke
  where (ke.embedding <=> query_embedding) < (1 - match_threshold)
    and (cardinality(category_filter) = 0 or ke.category = any(category_filter))
    and (cardinality(source_filter)   = 0 or ke.source   = any(source_filter))
  order by ke.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- match_knowledge_hybrid
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
security definer
set search_path = public
as $$
declare
  ts_query tsquery;
begin
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

-- match_knowledge_hybrid_brief
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
security definer
set search_path = public
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
