# AyurScribe v0 — Migration to GitHub + Vercel + Supabase

**Date:** 2026-06-19
**Status:** Draft (pending implementation plan)
**Owner:** user
**Repository root:** `E:/ayurveda-practitioner-assistant`

## 1. Problem

AyurScribe is a clinical decision-support web app for Ayurvedic practitioners. The current prototype runs locally with:

- A single-file React SPA (`src/App.tsx`, 179 KB).
- An Express server (`server.ts`, ~1126 lines) that handles chat, protocol generation, patient CRUD, feedback, and Hugging Face "academic RAG" via a Gemini (invalid model name) + NVIDIA NIM path.
- A static TypeScript knowledge base (`knowledge-base/`) — hand-curated diseases, herbs, treatments, etc.
- **Persistence on local filesystem** keyed by client-supplied email — does not survive Vercel serverless and is not multi-user safe.
- **Firebase for auth and "Firestore"** — but the app never talks to Firestore; `firestore.rules` is a written spec, not wired code.
- **Three hardcoded NVIDIA API keys** in the repo (`server.ts`, `.env`, `nvidia-proxy.cjs`); live Firebase web `apiKey` committed in `firebase-applet-config.json`.

Goal: move the project to GitHub, deploy the React frontend on Vercel, deploy the API on Supabase Edge Functions, replace Firebase auth with Supabase Auth, replace local-FS patient storage with a Postgres schema under RLS — without silently fixing the model's known correctness hazards (invalid Gemini model name, NVIDIA emulation, fabricated RAG citations).

## 2. Decisions locked in this design

- **Persistence:** Supabase Postgres with RLS. `patients` and `feedback_logs` tables, `owner_id = auth.uid()` policies.
- **API host:** Supabase Edge Functions (Deno). No Vercel serverless functions.
- **Frontend host:** Vercel, static SPA only. No Node API layer.
- **Auth:** Supabase Auth with **Google OAuth as the primary sign-in path** (Supabase OIDC-linked); email + magic link remains enabled as a fallback only. Drive sync is plumbed with `signInWithOAuth({ provider: 'google', options: { scopes: 'https://www.googleapis.com/auth/drive', access_type: 'offline', prompt: 'consent' } })`. The one-shot Google `refresh_token` is captured from `session.provider_refresh_token`, persisted in `localStorage`, and sent to the Edge Function broker on every Drive request — broker returns a short-lived `access_token` (≈1h) and discards it. `client_id`/`client_secret` live only as Supabase secrets.
- **Default LLM model:** `gemini-2.5-pro` (replaces the invalid `gemini-3.5-flash` used in the current code).
- **NVIDIA key:** kept and reused (per user instruction 2026-06-19; saved to project memory). Set as a Supabase Edge Function secret. When a user selects an NVIDIA model and `NVIDIA_API_KEY` is unset, the function returns HTTP 503 with a clear config-needed message; no silent fallback.
- **Firebase:** removed entirely. `src/firebase.ts`, `firebase-applet-config.json`, `firebase-blueprint.json`, `firestore.rules`, `security_spec.md` are deleted.
- **Hazard remediation:** the three named hazards in the existing code (`gemini-3.5-flash` non-existent model, NVIDIA "emulation" mode that fakes model identity via Gemini, fabricated Hugging Face / PubMed citations) are **removed** in this migration, not preserved.

## 3. Hazards removed in this migration

The following defects in the current code are explicitly **fixed** by this work, not preserved. Each fix is mapped to its concrete change.

1. **`gemini-3.5-flash` non-existent model.** Every call site (`server.ts` lines 604, 677, 951, 1064 and equivalents in new Edge Functions) is updated to `gemini-2.5-pro`. The model listing endpoint exposes only valid model IDs the user can actually pick from.
2. **NVIDIA "emulation" prompts.** Gemini is never instructed to "act like" an NVIDIA model. The function refuses with HTTP 503 if `NVIDIA_API_KEY` is not configured. UI shows the config-needed message inline.
3. **Fabricated Hugging Face / PubMed citations.** `generateLocalAcademicSynthesis` and the `/api/search-huggingface` route prompt that asks Gemini to invent PMIDs/journal names are deleted. The route is not ported. The new Edge Function `search` only proxies real Subabase queries (or fails clean).
4. **Bogus NVIDIA API key sentinel.** The hardcoded `nvapi-...` fallback in `server.ts` (the literal sentinel that "matched" an env-var string) is removed. The function reads only the configured secret.
5. **Hardcoded `nvidia-proxy.cjs` key.** Deleted during the history-scrub step (already in the plan). The proxy file itself is removed (Edge Functions call NVIDIA HTTP directly with `fetch`).
6. **`Firebase web APIKey` in `firebase-applet-config.json`.** Deleted with the Firebase cutover. Replaced by Supabase publishable + anon keys in Vercel env.

## 4. Architecture

```
┌──────────────────────────────────────┐         ┌──────────────────────────────────────┐
│ Browser (React SPA, Vite build)      │         │ Supabase                             │
│   • Supabase Auth (email + magic)    │◀─HTTPS─▶│   • Postgres (patients, feedback)    │
│   • Direct RLS-scoped CRUD           │  JWT    │     RLS: auth.uid() = owner_id       │
│   • Calls chat/protocol via          │  bearer │   • Edge Functions (Deno):           │
│     Edge Functions (server secrets)  │         │     /chat  /protocol                 │
│                                      │         │     /search-knowledge                │
└───────────────┬──────────────────────┘         │     /knowledge-modules               │
                ▲                                │   • Secrets: GEMINI_API_KEY,         │
                │ HTTPS                          │     NVIDIA_API_KEY                   │
┌───────────────┴──────────────────────┐         │   • Auth: email + magic link         │
│ Vercel (static hosting)              │────────▶│                                      │
│   • SPA from `dist/`                 │         │                                      │
│   • env: VITE_SUPABASE_URL,          │         │                                      │
│          VITE_SUPABASE_ANON_KEY      │         │                                      │
└──────────────────────────────────────┘         └──────────────────────────────────────┘
```

Vercel ships no server code; the only client-visible secrets are the Supabase URL and anon key (both safe for browsers). All other secrets live in Supabase's `supabase secrets` for Edge Functions.

## 5. Target repository layout

```
ayurScribe/
├── README.md
├── .env.example
├── .env.local                  (gitignored)
├── .gitignore                  (covers .env*, dist/, node_modules/, data/)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── App.tsx
│   ├── supabase.ts            (was: firebase.ts)
│   ├── components/Markdown.tsx
│   ├── index.css
│   └── main.tsx
├── knowledge-base/             (hand-curated static corpus, kept as-is)
└── supabase/
    ├── config.toml
    ├── migrations/
    │   ├── 0001_init.sql
    │   └── 0002_rls.sql
    └── functions/
        ├── _shared/
        │   ├── supabase.ts
        │   ├── google.ts
        │   ├── corpus.ts     (imports knowledge-base/* for the Deno runtime)
        │   └── llm.ts        (gemini-2.5-pro + NVIDIA NIM call wrappers)
        ├── chat/index.ts
        ├── protocol/index.ts
        ├── knowledge/index.ts
        ├── search/index.ts
        ├── google-token-exchange/index.ts
        └── _health/index.ts  (smoke endpoint)
```

The repo is not yet under git. Initial commit happens during implementation step 1.

## 6. Data model

```sql
-- 0001_init.sql
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
```

```sql
-- 0002_rls.sql
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
```

The Edge Function that builds few-shot grounding reads `feedback_logs` for the **calling user only** with `.eq('owner_id', user.id)`.

## 7. Edge Function contracts

Each function mirrors a current Express route. JSON-in, JSON-out shapes **match what `src/App.tsx` already expects** so that client-side rewrite is just `fetch('/api/...')` → `supabase.functions.invoke(...)`.

```
POST /functions/v1/chat
  body   : { message, model?, history?, context? }
  returns: { reply: string, mode: 'gemini' | 'nvidia' /* no `local` */ }
  notes  : If model = 'gemini-2.5-pro' (default) → real Gemini call. If model starts
           with an NVIDIA provider name and NVIDIA_API_KEY is unset → HTTP 503
           { error: 'NVIDIA NIM is not configured. Please set NVIDIA_API_KEY in
           Supabase Edge Function secrets.' }. No silent fallback to Gemini.

POST /functions/v1/protocol
  body   : { prompt, model?, context? }
  returns: { reply: string }
  notes  : Same routing and 503 semantics as `/chat`.

GET  /functions/v1/knowledge-modules
  returns: { modules: [...] }

GET  /functions/v1/search-knowledge?q=...
  returns: { matches: [...] }
  notes  : Substring-only search over the curated corpus. No LLM involvement, no
           fabricated citations.

POST /functions/v1/google-token-exchange
  body   : { refresh_token }
  returns: { access_token, expires_at }
  notes  : Calls Google's token endpoint with `client_id`/`client_secret` stored
           as Supabase secrets. Frontend caches the refresh_token in localStorage
           and calls this on every Drive request, persisting access tokens in-
           memory for the page lifetime. Requires Supabase OIDC + Google provider
           configured.

GET  /functions/v1/_health
  returns: { ok: true, version: '0.0.0' }
```

Auth model for Edge Functions: each function reads the caller's JWT from the `Authorization` header and uses a user-scoped Supabase client (`supabase.auth.getUser(jwt)`). Service-role key is reserved for migrations/seed only and is never called from inside a function handler at request time.

## 8. Secrets

### Vercel project env (browser-visible, safe)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase Edge Function secrets (via `supabase secrets set`)
- `GEMINI_API_KEY`
- `NVIDIA_API_KEY` — taken from `.env` per user instruction (memory: `project-nvidia-key-active.md`). If unset, `chat` / `protocol` functions return HTTP 503 for any model whose provider is not Google.
- `GOOGLE_OAUTH_CLIENT_ID` — from Google Cloud Console OAuth client.
- `GOOGLE_OAUTH_CLIENT_SECRET` — same.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — auto-provisioned by Supabase into the runtime.

### Supabase dashboard configuration
- Auth → Providers → Google: enabled; client ID + secret provided; redirect URI auto-defined.
- Auth → Providers → Email: enabled (magicl ink + password optional fallback).

### GitHub
- No secrets in the repo. `.env` is gitignored; `.gitignore` covers `.env*`, `dist/`, `node_modules/`, `data/`.

The committed `nvidia-proxy.cjs` hardcoded key is **deleted** during this migration. The committed `.env` key is removed in scrub step 1 (history rewrite).

## 9. Knowledge base portability

`knowledge-base/` is plain TypeScript with no Node-only dependencies. Edge Functions run on Deno, so:

- Pure data-only modules (`diseases.ts`, `herbs.ts`, `treatments.ts`, etc.) import directly with no changes.
- The `analyzeQuery` helper from `ayurrag/index.ts` imports `query-engine.ts` — port verbatim; Deno accepts the same TS syntax.
- `vector-rag.ts` is a stub (substring matching); no embedding provider to port.
- `seed-knowledge.ts` is run once as a local script (not in the function runtime). It uses the service-role key to populate caches/derived tables if needed during step 3.

## 10. Client rewrite (`src/App.tsx`)

- Replace Firebase imports with `import { createClient } from '@supabase/supabase-js'` and a typed client instantiated with `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- Replace `googleSignIn` with `supabase.auth.signInWithOAuth({ provider: 'google', options: { scopes: 'https://www.googleapis.com/auth/drive', access_type: 'offline', prompt: 'consent' } })`. Capture the **Google refresh token** from the resulting session (`session.provider_refresh_token`) and persist it in `localStorage`.
- Replace `onAuthStateChanged`-driven auth listener with `supabase.auth.onAuthStateChange((event, session) => ...)`.
- Replace `fetch('/api/patients', ...)` with `supabase.from('patients').select() / .insert() / etc.`. Same JSON shapes preserved.
- Replace `fetch('/api/feedback', ...)` with `supabase.from('feedback_logs').insert()`.
- Replace remaining `fetch('/api/...')` calls with `supabase.functions.invoke('chat', { body })` etc.
- Replace Firebase `cachedAccessToken` for Drive with: on every `loadGoogleDriveFiles()` call, POST `{ refresh_token }` to `/functions/v1/google-token-exchange` and use the returned short-lived access_token for the request. If the broker returns a `401`, drop the stored refresh_token and re-run `signInWithOAuth`.
- Hardcode the default model choice in the chat UI to `gemini-2.5-pro` and update the model-listing endpoint response to surface only valid (existing) models (`gemini-2.5-pro` for Google; the NVIDIA NIM catalog filtered to IDs that NVIDIA actually exposes).
- Surface the HTTP 503 "NVIDIA not configured" message inline in the chat UI when it arrives (no silent fallback).
- Drop any Firestore references and the Firebase `handleFirestoreError` helper.

## 11. Follow-up work (after the migration ships)

Real open work, not the same hazards in new code.

1. **Streaming under Edge Function timeout.** Default Supabase Edge Functions have a 10s ceiling. Long RAG-grounded chat responses may need streaming via `new ReadableStream` in the response body. Consider moving `/chat` and `/protocol` off Edge Functions to Vercel (Node) or a long-lived host if 10s proves tight.
2. **Citation hygiene.** Even with the fabrication route gone, real Gemini can still invent PMIDs / scriptural verses when prompted loosely. Add explicit system-prompt rules like "If uncertain, say 'unverified'; never invent citations."
3. **Drive UX polish.** Tokens issued via Google's OAuth library to web clients expire in 1h. The token broker handles this, but a refresh-on-401 with one retry is the minimum. Audit who can call `google-token-exchange` (today: any authenticated user — should be any).
4. **Observability.** No logs/metrics out of the box. Add structured `console.log` JSON in Edge Functions and a basic Vercel Analytics for the SPA. Plan a Sentry / Logflare add-on later.
5. **Backup of patients.** Postgres on Supabase has point-in-time recovery (Pro plan), but the project will start on the Free plan. Establish a `pg_dump` cadence before that matters.
6. **`medicalIdentities` — content moderation hooks for HIPAA-style caveats.** Clinical UIs have nuances; this version ships without them and should be reviewed before any real PHI is entered.
7. **Two-factor auth.** Supabase supports TOTP natively; not in v0.
8. **`/api/feedback/_health` is `/functions/v1/_health`** — the prototype Express server had no health endpoint. The new one does. Note it's a smoke endpoint, not readiness/liveness.

## 12. Verification

After deploy:

1. **No fabrication regression scan.** A test prompt that asks the chat function "summarize recent clinical trials on Amalaki" must NOT produce PMIDs or journal names that aren't in the curated corpus (the function has no PubMed integration; the corpus has none either). This is a contract assertion, not a content one.
2. **Real-model assertion.** Hit `/functions/v1/chat?dry_run` (or the model-listing endpoint) and confirm `gemini-2.5-pro` is the only Google model in the response. Hit the same with `model=gemini-3.5-flash` and confirm HTTP 400/422 with a "model not supported" message — do NOT silently substitute.
3. **NVIDIA 503 behavior.** With `NVIDIA_API_KEY` unset and `model=nvidia/llama-3.3-70b-instruct` sent, the function must return HTTP 503 with the documented config-needed message. The response body must not contain "Synthesized via Gemini" or any equivalent emulation footer.
4. **RLS:** Create two test users, attempt cross-user reads on `patients` and `feedback_logs`; both must reject.
5. **Smoke:** For each Edge Function hit with a synthetic JWT (one per test user), assert the documented JSON shape.
6. **End-to-end:** Sign-in with Google → grant Drive scope → create patient → chat → generate protocol → submit feedback → fetch Drive file using brokered access token. Confirm state survives.
7. **Cold-start latency:** Time each Edge Function first call from cold (≤ 1.5s is the rough target; > 5s is a flag).
8. **Function logs:** Zero unhandled exceptions in Supabase function logs for the smoke run.

## 13. Order of operations (each step is independently revertable)

1. **Secrets & repo hygiene.** `git init`, scrub `nvidia-proxy.cjs` and committed `.env` from history (using `git filter-repo`), add `.gitignore`, push to a fresh GitHub repo.
2. **Stand up Supabase.** Create the project under the existing org (`AYurvritta Ayurveda Hospital and Panchkarma Center`); apply migrations 0001 and 0002; enable Email + Magic Link.
3. **Bootstrap the four Edge Functions** against the current local client URLs first; verify them through `supabase functions invoke`.
4. **Port the React client.** Replace Firebase auth and the `/api/*` calls per §10. Test against `supabase start` locally.
5. **Provision Vercel.** Create the project in `careayurvritta-creator's projects` (team `team_I4I5gcx55XS3njLAtVkN0SDT`); wire `VITE_SUPABASE_URL` + anon key; deploy.
6. **End-to-end smoke** per §12.
7. **Hand-off note**: link this spec and the implementation plan in the project README; add follow-up tickets for §11.

## 14. Out of scope

- **Real embeddings / vector RAG** — the stub `vector-rag.ts` substring matching stays as the only retrieval mechanism in v0.
- **Streaming responses** under Edge Function timeouts — flagged in §11 #1 as follow-up.
- **Citation-hygiene prompt hardening** — flagged in §11 #2; Gemini's default behaviour in v0 may still invent sources.
- **Observability / Sentry / metrics** — flagged in §11 #4.
- **Multi-tenant rollout, billing, dashboards, production hardening beyond basic RLS.**
- **HIPAA / clinical compliance reviews.**
- **Real PubMed retrieval.** If the user's real clinical use case requires live PubMed, that's a separate iteration: real `eutils.ncbi.nlm.nih.gov` from a server-side function or memoized corpus; the fabrication route that exists today does not survive this migration.
- **OAuth scope expansion beyond `drive`.** If Sheets, Gmail, or Calendar are needed later, expand `scopes:` in §10 and re-prompt Google consent.
