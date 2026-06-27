-- 0006_chat_tables.sql
-- chat_sessions and messages — RLS protected, per-user

create table if not exists public.chat_sessions (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  title      text not null default 'New Chat',
  model      text not null default 'nvidia/llama-3.1-nemotron-70b-instruct',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cs_owner on public.chat_sessions(owner_id);

alter table public.chat_sessions enable row level security;

create policy "chat_sessions: select own" on public.chat_sessions
  for select using (owner_id = auth.uid());
create policy "chat_sessions: insert own" on public.chat_sessions
  for insert with check (owner_id = auth.uid());
create policy "chat_sessions: update own" on public.chat_sessions
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "chat_sessions: delete own" on public.chat_sessions
  for delete using (owner_id = auth.uid());

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant', 'system')),
  content    text not null,
  model      text,
  citations  jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_msg_session on public.messages(session_id);

alter table public.messages enable row level security;

create policy "messages: select own" on public.messages
  for select using (auth.uid() in (select owner_id from chat_sessions where id = session_id));
create policy "messages: insert own" on public.messages
  for insert with check (auth.uid() in (select owner_id from chat_sessions where id = session_id));