alter table public.patients      enable row level security;
alter table public.feedback_logs enable row level security;

-- patients: scoped CRUD
create policy "patients: select own" on public.patients      for select using (owner_id = auth.uid());
create policy "patients: insert own" on public.patients      for insert with check (owner_id = auth.uid());
create policy "patients: update own" on public.patients      for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "patients: delete own" on public.patients      for delete using (owner_id = auth.uid());

-- feedback_logs: insert + select only (no delete from client; admin path only)
create policy "feedback: select own" on public.feedback_logs for select using (owner_id = auth.uid());
create policy "feedback: insert own" on public.feedback_logs for insert with check (owner_id = auth.uid());
