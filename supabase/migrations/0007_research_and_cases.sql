-- 0007_research_and_cases.sql
-- research_articles: 24h web-research cache (public read, no RLS)
-- clinical_cases:    RLS-protected, per-user with vector similarity

create table if not exists public.research_articles (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  abstract   text,
  source     text not null check (source in ('pubmed', 'openalex', 'scholar')),
  url        text,
  disease    text not null,
  herbs      text[] not null default '{}',
  year       int,
  fetched_at timestamptz not null default now()
);

create index if not exists idx_ra_disease on public.research_articles(disease);
create index if not exists idx_ra_fetched on public.research_articles(fetched_at);
create index if not exists idx_ra_source  on public.research_articles(source);

-- No RLS on research_articles — public cache, no PII

create table if not exists public.clinical_cases (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  diagnosis       text not null,
  patient_summary text,
  treatment_plan  text,
  outcome         text,
  embedding       vector(1024),
  created_at      timestamptz not null default now()
);

create index if not exists idx_cc_embedding
  on public.clinical_cases using hnsw (embedding vector_cosine_ops);
create index if not exists idx_cc_user on public.clinical_cases(user_id);

alter table public.clinical_cases enable row level security;

create policy "clinical_cases: select own" on public.clinical_cases
  for select using (user_id = auth.uid());
create policy "clinical_cases: insert own" on public.clinical_cases
  for insert with check (user_id = auth.uid());
create policy "clinical_cases: update own" on public.clinical_cases
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "clinical_cases: delete own" on public.clinical_cases
  for delete using (user_id = auth.uid());

-- RPC for similarity search on clinical_cases (RLS-aware — filters by user_id)
create or replace function public.match_clinical_cases(
  query_embedding vector(1020),
  match_threshold float default 0.6,
  match_count     int   default 5,
  p_user_id       uuid
)
returns table (
  id uuid, diagnosis text, patient_summary text,
  treatment_plan text, outcome text, similarity float
)
language plpgsql stable
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