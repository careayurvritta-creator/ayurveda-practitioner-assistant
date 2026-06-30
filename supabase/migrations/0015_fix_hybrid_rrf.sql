-- Migration 0015: Fix hybrid search with proper Reciprocal Rank Fusion (RRF)
-- Replaces weighted sum (vec*0.7 + fts*0.3) with rank-based fusion
-- Uses k=60 standard RRF constant, UNION of both result sets (not LEFT JOIN)

-- ============================================
-- match_knowledge_hybrid (fixed with RRF)
-- ============================================
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
  k constant int := 60;  -- RRF constant (standard value)
begin
  ts_query := plainto_tsquery('english', query_text);

  return query
  with vector_results as (
    select
      ke.id, ke.content, ke.source, ke.category,
      ke.title, ke.metadata,
      row_number() over (order by ke.embedding <=> query_embedding) as vec_rank
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
      row_number() over (order by ts_rank_cd(ke.content_tsv, ts_query, 32) desc) as fts_rank
    from public.knowledge_embeddings ke
    where ke.content_tsv @@ ts_query
      and (cardinality(category_filter) = 0 or ke.category = any(category_filter))
      and (cardinality(source_filter)   = 0 or ke.source   = any(source_filter))
    order by ts_rank_cd(ke.content_tsv, ts_query, 32) desc
    limit match_count * 2
  ),
  fused as (
    -- UNION both result sets (not LEFT JOIN) so FTS-only results are included
    select
      v.id, v.content, v.source, v.category, v.title, v.metadata,
      1.0 / (k + v.vec_rank) as rrf_score
    from vector_results v

    UNION

    select
      vr.id, vr.content, vr.source, vr.category, vr.title, vr.metadata,
      1.0 / (k + f.fts_rank) as rrf_score
    from fts_results f
    join vector_results vr on vr.id = f.id
  )
  select
    f.id, f.content, f.source, f.category,
    f.title, f.metadata, sum(f.rrf_score) as similarity
  from fused f
  group by f.id, f.content, f.source, f.category, f.title, f.metadata
  order by sum(f.rrf_score) desc
  limit match_count;
end;
$$;

-- ============================================
-- match_knowledge_hybrid_brief (fixed with RRF)
-- ============================================
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
  k constant int := 60;
begin
  ts_query := plainto_tsquery('english', query_text);

  return query
  with vector_results as (
    select
      ke.id, ke.content, ke.source, ke.category,
      ke.title,
      row_number() over (order by ke.embedding <=> query_embedding) as vec_rank
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
      row_number() over (order by ts_rank_cd(ke.content_tsv, ts_query, 32) desc) as fts_rank
    from public.knowledge_embeddings ke
    where ke.content_tsv @@ ts_query
      and (cardinality(category_filter) = 0 or ke.category = any(category_filter))
      and (cardinality(source_filter)   = 0 or ke.source   = any(source_filter))
    order by ts_rank_cd(ke.content_tsv, ts_query, 32) desc
    limit match_count * 2
  ),
  fused as (
    select
      v.id, v.content, v.source, v.category, v.title,
      1.0 / (k + v.vec_rank) as rrf_score
    from vector_results v

    UNION

    select
      vr.id, vr.content, vr.source, vr.category, vr.title,
      1.0 / (k + f.fts_rank) as rrf_score
    from fts_results f
    join vector_results vr on vr.id = f.id
  )
  select
    f.id, f.content, f.source, f.category,
    f.title, sum(f.rrf_score) as similarity
  from fused f
  group by f.id, f.content, f.source, f.category, f.title
  order by sum(f.rrf_score) desc
  limit match_count;
end;
$$;
