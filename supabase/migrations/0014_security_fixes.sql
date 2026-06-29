-- 0014_security_fixes.sql
-- Security fixes from comprehensive audit

-- ============================================================
-- 1. match_clinical_cases — enforce caller can only access own cases
-- ============================================================
-- The function already filters by p_user_id, but as security definer
-- a malicious caller could pass another user's ID. Add auth.uid() check.

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
  -- Enforce: caller must be requesting their own data
  if p_user_id <> auth.uid() then
    raise exception 'Access denied: cannot query other users clinical cases';
  end if;

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
-- 2. RLS on global read-only tables
-- ============================================================
-- knowledge_embeddings: 11K rows, read-only, no PII
-- research_articles: read-only, no PII
-- Add public read policies for authenticated users

-- knowledge_embeddings: enable RLS (currently has no policies for global read)
alter table public.knowledge_embeddings enable row level security;

drop policy if exists "knowledge_embeddings: read all" on public.knowledge_embeddings;
create policy "knowledge_embeddings: read all" on public.knowledge_embeddings
  for select using (true);

-- research_articles: enable RLS
alter table public.research_articles enable row level security;

drop policy if exists "research_articles: read all" on public.research_articles;
create policy "research_articles: read all" on public.research_articles
  for select using (true);
