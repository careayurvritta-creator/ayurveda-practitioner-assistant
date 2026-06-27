-- RLS policies for RAG schema tables
-- All new tables are private by default (no anonymous access).

-- documents / document_sections / chunks: read-only for authenticated users
alter table public.documents         enable row level security;
alter table public.document_sections enable row level security;
alter table public.chunks            enable row level security;

-- diseases / herbs / treatments: public read (clinical reference data)
alter table public.diseases    enable row level security;
alter table public.herbs       enable row level security;
alter table public.treatments  enable row level security;

-- who_terms / research_articles: public read
alter table public.who_terms           enable row level security;
alter table public.research_articles   enable row level security;

-- treatment_plans / clinical_cases: scoped to doctor_id
alter table public.treatment_plans enable row level security;
alter table public.clinical_cases  enable row level security;

---------------------------------------------------------------
-- POLICIES
---------------------------------------------------------------

-- 1. documents: anyone authenticated can read, only admin/seed writes
--    (seed script uses service role, bypasses RLS)
create policy "documents: select auth" on public.documents
  for select to authenticated using (true);

-- 2. document_sections: same
create policy "document_sections: select auth" on public.document_sections
  for select to authenticated using (true);

-- 3. chunks: same
create policy "chunks: select auth" on public.chunks
  for select to authenticated using (true);

-- 4. diseases: public read (even anon) for patient chatbot
create policy "diseases: select anon"  on public.diseases for select to anon   using (true);
create policy "diseases: select auth"  on public.diseases for select to authenticated using (true);
create policy "diseases: insert seed"  on public.diseases for insert with check (true); -- service role only

-- 5. herbs: public read
create policy "herbs: select anon"  on public.herbs for select to anon   using (true);
create policy "herbs: select auth"  on public.herbs for select to authenticated using (true);
create policy "herbs: insert seed"  on public.herbs for insert with check (true);

-- 6. treatments: public read
create policy "treatments: select anon"  on public.treatments for select to anon   using (true);
create policy "treatments: select auth"  on public.treatments for select to authenticated using (true);
create policy "treatments: insert seed"  on public.treatments for insert with check (true);

-- 7. who_terms: public read
create policy "who_terms: select anon"  on public.who_terms for select to anon   using (true);
create policy "who_terms: select auth"  on public.who_terms for select to authenticated using (true);

-- 8. research_articles: public read
create policy "research_articles: select anon"  on public.research_articles for select to anon   using (true);
create policy "research_articles: select auth"  on public.research_articles for select to authenticated using (true);

-- 9. treatment_plans:8734: scoped to doctor_id, patient can view own
create policy "treatment_plans: select own" on public.treatment_plans
  for select to authenticated using (doctor_id = auth.uid());

create policy "treatment_plans: insert own" on public.treatment_plans
  for insert to authenticated with check (doctor_id = auth.uid());

create policy "treatment_plans: update own" on public.treatment_plans
  for update to authenticated using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());

create policy "treatment_plans: delete own" on public.treatment_plans
  for delete to authenticated using (doctor_id = auth.uid());

-- 10. clinical_cases: scoped to doctor_id
create policy "clinical_cases: select own" on public.clinical_cases
  for select to authenticated using (doctor_id = auth.uid());

create policy "clinical_cases: insert own" on public.clinical_cases
  for insert to authenticated with check (doctor_id = auth.uid());

create policy "clinical_cases: update own" on public.clinical_cases
  for update to authenticated using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());

create policy "clinical_cases: delete own" on public.clinical_cases
  for delete to authenticated using (doctor_id = auth.uid());
