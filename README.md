# AyurScribe

Clinical decision-support web app for Ayurvedic practitioners. Chat with a clinical assistant, generate treatment protocols, manage patient case histories, give practitioner feedback, and sync case notes to Google Drive.

This codebase is the v0 release after migrating off Firebase + a single Express server onto:

- **Vercel** — static SPA only. No Node API.
- **Supabase** — Postgres + Row Level Security for patient data/feedback, Edge Functions (Deno) for `/chat`, `/protocol`, `/knowledge-modules`, `/search-knowledge`, `/google-token-exchange`, and `/_health`. Supabase Auth with Google OAuth (OIDC) as the primary sign-in path; magic link as fallback.
- **Google Drive sync** — brokered via `google-token-exchange` Edge Function that holds `client_id`/`client_secret` as Supabase secrets. The browser never sees those.

## Local development

```bash
npm install
cp .env.example .env.local    # then fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
```

## Deploy

1. Push the repo to a fresh GitHub repo.
2. In Supabase: apply `supabase/migrations/0001_init.sql` + `0002_rls.sql`. Enable Auth → Providers → Google with the OAuth credentials from the Google Cloud Console. Set Edge Function secrets: `GEMINI_API_KEY`, optional `NVIDIA_API_KEY`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`.
3. In Vercel: import the GitHub repo. Add env vars `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. Build command: `npm run build`. Output: `dist`.
4. Deploy Edge Functions with `supabase functions deploy chat protocol knowledge search google-token-exchange _health`.

## Data model & RLS

See `supabase/migrations/0001_init.sql` + `0002_rls.sql`. Each user can only read/write their own patients and feedback logs; feedback rows are append-only from the client.

## Road map

After v0 ships, follow-up work: streaming under Edge timeouts, citation-hygiene prompt hardening, observability, `pg_dump` cadence, Magento-avoidance backups, and a clinical-compliance review.
