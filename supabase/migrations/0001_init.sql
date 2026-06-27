create extension if not exists pgcrypto;

create table if not exists public.patients (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 128),
  age          int,
  gender       text,
  email        text,
  phone        text,
  prakriti     text not null check (char_length(prakriti) between 1 and 128),
  vikriti      text check (char_length(vikriti) <= 256),
  agni        text not null check (char_length(agni) between 1 and 128),
  koshta       text not null check (char_length(koshta) between 1 and 128),
  lifestyle    text,
  season       text,
  notes        text,
  chats        jsonb not null default '[]'::jsonb,
  protocols    jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.feedback_logs (
  id                       uuid primary key default gen_random_uuid(),
  owner_id                 uuid not null references auth.users(id) on delete cascade,
  patient_name             text not null check (char_length(patient_name) between 1 and 128),
  original_guidance        text not null check (char_length(original_guidance) between 1 and 4096),
  practitioner_correction  text not null check (char_length(practitioner_correction) between 1 and 4096),
  created_at               timestamptz not null default now()
);

create index if not exists patients_owner_id_idx       on public.patients(owner_id);
create index if not exists feedback_logs_owner_id_idx  on public.feedback_logs(owner_id);
