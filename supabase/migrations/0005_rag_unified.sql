-- 0005_rag_unified.sql
-- Unified knowledge_embeddings table with HNSW vector index.
-- No RLS — global public knowledge, no PII.

create extension if not exists vector;

create table if not exists public.knowledge_embeddings (
  id           uuid primary key default gen_random_uuid(),
  content      text not null,
  embedding    vector(1024),
  source       text not null,
  category     text not null,
  title        text,
  metadata     jsonb not null default '{}',
  content_hash text not null unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_ke_embedding
  on public.knowledge_embeddings using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

create index if not exists idx_ke_content_fts
  on public.knowledge_embeddings using gin (to_tsvector('english', content));

create index if not exists idx_ke_source    on public.knowledge_embeddings(source);
create index if not exists idx_ke_category  on public.knowledge_embeddings(category);

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