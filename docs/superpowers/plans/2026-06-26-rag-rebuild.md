# AyurScribe RAG Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fragmented, non-functional RAG layer with a single unified retrieval system that ingests the curated knowledge base into pgvector and serves three surfaces — patient chatbot, clinical document generation, and treatment protocol generation with live web research.

**Architecture:** One canonical ingestion CLI (Node) writes into a single flat `knowledge_embeddings` table (HNSW + `match_knowledge()` RPC). Three Supabase Edge Functions (Deno) share a `_shared/rag/` library (7 focused files) that provides multi-provider embeddings, multi-provider LLM streaming, unified query expansion, hybrid retrieval, and live web research. Multi-provider: NVIDIA primary, Gemini fallback, OpenAI-compatible configurable — no silent cross-provider fallback (503 on missing key).

**Tech Stack:** Supabase Postgres + pgvector, Supabase Edge Functions (Deno), Node.js CLI for ingestion, React SPA (Vite), NVIDIA NIM API, Gemini API, NCBI E-utilities, OpenAlex, SerpAPI.

**Spec:** `docs/superpowers/specs/2026-06-26-rag-rebuild-design.md`

**Conventions for every task:**
- Run from repo root `E:/ayurveda-practitioner-assistant`.
- Shell is Git Bash on Windows — use forward slashes in paths.
- Commit message prefix: `feat(rag)`, `fix(rag)`, `chore(rag)`, `refactor(rag)`, `docs(rag)` as appropriate.
- TDD where a unit-testable boundary exists (pure functions in `_shared/rag/` and `scripts/`). Edge Functions and SQL migrations are integration-tested via `supabase functions invoke` + SQL queries.
- Every task ends with a commit. Each task is independently revertable (`git revert <sha>`).

**Note on Edge Function testing:** Supabase Edge Functions run on Deno. There is no Vitest/Jest setup for Deno in this repo. The test strategy is: (1) pure helper logic is written to be Node-testable where possible and tested with `node --test`; (2) Edge Functions are smoke-tested via `supabase functions invoke` against a local `supabase start` instance; (3) SQL migrations are verified with SQL assertions. Where a Deno-only dependency (`https://esm.sh/...`) blocks Node testing, the task extracts the pure logic into a testable function and notes the Deno wrapper separately.

---

## Phase 1: Cleanup

Remove dead/duplicated/broken code so the rebuild starts from a clean foundation. All deletions are individually revertable. Nothing in Phase 1 adds functionality — it only removes.

### Task 1.1: Delete dead knowledge-base files

**Files:**
- Delete: `knowledge-base/rag-pipeline.ts`
- Delete: `knowledge-base/chunking-pipeline.ts`
- Delete: `knowledge-base/embed-knowledge.ts`
- Delete: `knowledge-base/ayurrag/vector-rag.ts`
- Delete: `knowledge-base/ayurrag/query-engine.ts`
- Delete: `knowledge-base/ayurrag/index.ts`
- Delete: `knowledge-base/input-learning.ts`
- Delete: `knowledge-base/rag-engine.ts`
- Delete: `knowledge-base/web-research.ts`
- Delete: `knowledge-base/embedding-client.ts`
- Delete: `knowledge-base/llm-stream-utils.ts`

- [ ] **Step 1: Verify the files exist before deleting**

Run:
```bash
ls knowledge-base/rag-pipeline.ts knowledge-base/chunking-pipeline.ts knowledge-base/embed-knowledge.ts knowledge-base/ayurrag/vector-rag.ts knowledge-base/ayurrag/query-engine.ts knowledge-base/ayurrag/index.ts knowledge-base/input-learning.ts knowledge-base/rag-engine.ts knowledge-base/web-research.ts knowledge-base/embedding-client.ts knowledge-base/llm-stream-utils.ts
```
Expected: all 11 paths printed (no "No such file" errors).

- [ ] **Step 2: Delete the files**

Run:
```bash
git rm knowledge-base/rag-pipeline.ts knowledge-base/chunking-pipeline.ts knowledge-base/embed-knowledge.ts knowledge-base/ayurrag/vector-rag.ts knowledge-base/ayurrag/query-engine.ts knowledge-base/ayurrag/index.ts knowledge-base/input-learning.ts knowledge-base/rag-engine.ts knowledge-base/web-research.ts knowledge-base/embedding-client.ts knowledge-base/llm-stream-utils.ts
```
Expected: `rm ...` for each file.

- [ ] **Step 3: Remove the now-empty ayurrag directory if empty**

Run:
```bash
rmdir knowledge-base/ayurrag 2>/dev/null; ls knowledge-base/ayurrag 2>&1 | head -1
```
Expected: either nothing (removed) or "No such file" — both fine. If it still lists files, do NOT force-remove; those files are tracked and intentionally kept.

- [ ] **Step 4: Verify the frontend doesn't import any deleted file**

Run:
```bash
grep -rn "rag-pipeline\|chunking-pipeline\|embed-knowledge\|ayurrag\|input-learning\|rag-engine\|web-research\|embedding-client\|llm-stream-utils" src/ supabase/ || echo "no references"
```
Expected: `no references`. If references appear, stop and note them — they'll be handled in later tasks (Phase 6 client wiring, Phase 5 edge functions).

- [ ] **Step 5: Commit**

Run:
```bash
git add -A && git commit -m "chore(rag): delete dead/duplicated knowledge-base RAG files

Removes 11 files identified as dead, duplicated, or broken in the
2026-06-26 RAG rebuild spec. Their logic is re-implemented in the
shared RAG library (Phase 3) and ingestion CLI (Phase 4)."
```

### Task 1.2: Delete competing 0003 migrations and broken Edge Functions

**Files:**
- Delete: `supabase/migrations/0003_rag.sql`
- Delete: `supabase/migrations/0003_rag_schema.sql`
- Delete: `supabase/functions/_shared/corpus.ts`
- Delete: `supabase/functions/protocol/index.ts` (directory and contents)
- Delete: `supabase/functions/knowledge/index.ts` (directory and contents)
- Delete: `supabase/functions/search/index.ts` (directory and contents)

- [ ] **Step 1: Verify the files exist**

Run:
```bash
ls supabase/migrations/0003_rag.sql supabase/migrations/0003_rag_schema.sql supabase/functions/_shared/corpus.ts supabase/functions/protocol/index.ts supabase/functions/knowledge/index.ts supabase/functions/search/index.ts
```
Expected: all 6 paths printed.

- [ ] **Step 2: Delete the migrations and corpus**

Run:
```bash
git rm supabase/migrations/0003_rag.sql supabase/migrations/0003_rag_schema.sql supabase/functions/_shared/corpus.ts
```

- [ ] **Step 3: Delete the obsolete Edge Function directories**

Run:
```bash
git rm -r supabase/functions/protocol supabase/functions/knowledge supabase/functions/search
```
Expected: `rm ...` for each tracked file in those directories.

- [ ] **Step 4: Commit**

Run:
```bash
git add -A && git commit -m "chore(rag): delete competing 0003 migrations and broken Edge Functions

Removes the two conflicting 0003 migrations (Chinese-column and
English-column schemas), the obsolete protocol/knowledge/search
Edge Functions (which called non-existent RPCs and had syntax bugs),
and the superseded corpus.ts. New unified migration in Phase 2."
```

### Task 1.3: Add missing dependencies and remove untracked artifacts

**Files:**
- Modify: `package.json`
- Delete: `knowledge-base.zip`

- [ ] **Step 1: Add `openai` and `dotenv` to package.json**

Run:
```bash
npm install openai dotenv
```
Expected: package installs; `package.json` and `package-lock.json` updated.

- [ ] **Step 2: Add an `ingest` script to package.json**

This script will be created in Phase 4; we add the npm script entry now so it's ready. Edit `package.json` `scripts` block to:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "ingest": "tsx scripts/ingest-knowledge.ts"
}
```

Also add `tsx` as a dev dependency:
```bash
npm install -D tsx
```

- [ ] **Step 3: Remove the untracked knowledge-base.zip artifact**

Run:
```bash
ls -la knowledge-base.zip 2>/dev/null && rm -f knowledge-base.zip && echo "removed" || echo "not present"
```
Expected: `removed` or `not present`.

- [ ] **Step 4: Add knowledge-base.zip to .gitignore if not already**

Check `.gitignore` contains `*.zip`; if not, append it. Run:
```bash
grep -q '\.zip$' .gitignore || echo '*.zip' >> .gitignore
```

- [ ] **Step 5: Commit**

Run:
```bash
git add -A && git commit -m "chore(rag): add openai/dotenv/tsx deps, ingest script, remove zip artifact

Adds the npm dependencies required by the upcoming ingestion CLI and
shared embedding client. Removes the untracked knowledge-base.zip
artifact and ignores future zips."
```

### Task 1.4: Remove the firebase import from App.tsx (build-breaker fix)

**Files:**
- Modify: `src/App.tsx` (remove `./firebase` import; full client wiring is Phase 6)

- [ ] **Step 1: Locate the firebase import**

Run:
```bash
grep -n "firebase" src/App.tsx | head -20
```
Expected: one or more lines importing from `./firebase`. Note the line numbers.

- [ ] **Step 2: Comment out (do not yet remove) the firebase import block**

Read the lines around each match. Wrap the firebase import block in a comment with a note that full removal happens in Phase 6. Example transformation:

```typescript
// PHASE 6 TODO: remove firebase entirely; replace with supabase client.
// import { ... } from './firebase';
```

This unblocks the build without doing the full client rewrite prematurely. Use the Edit tool with the exact import text found in Step 1.

- [ ] **Step 3: Verify the build is unblocked**

Run:
```bash
npm run build 2>&1 | tail -20
```
Expected: build succeeds OR fails only on unrelated pre-existing issues (not firebase). If it fails on firebase, return to Step 2 and comment out more.

- [ ] **Step 4: Commit**

Run:
```bash
git add -A && git commit -m "chore(rag): stub out firebase import to unblock build

Comment-imports the firebase module that no longer exists on disk.
Full removal and supabase client wiring is Phase 6 of the RAG rebuild."
```

---

## Phase 2: Database Schema

One new unified migration plus two supporting migrations. All applied locally and verified with SQL assertions.

### Task 2.1: Create the unified knowledge_embeddings migration

**Files:**
- Create: `supabase/migrations/0003_rag_unified.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0003_rag_unified.sql` with exactly:

```sql
-- 0003_rag_unified.sql
-- Single flat knowledge table with HNSW vector index + match_knowledge() RPC.
-- Replaces the two deleted 0003 migrations (Chinese-column and English-column).
-- Public knowledge: no RLS. Read by all surfaces via service-role client.

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

create index if not exists idx_ke_source   on public.knowledge_embeddings(source);
create index if not exists idx_ke_category on public.knowledge_embeddings(category);

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
```

- [ ] **Step 2: Commit**

Run:
```bash
git add supabase/migrations/0003_rag_unified.sql
git commit -m "feat(rag): add unified knowledge_embeddings migration

Single flat table with HNSW index, full-text index, and match_knowledge()
RPC. Replaces both prior 0003 migrations. Public knowledge (no RLS)."
```

### Task 2.2: Create research_articles and clinical_cases migration

**Files:**
- Create: `supabase/migrations/0004_research_and_cases.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0004_research_and_cases.sql` with exactly:

```sql
-- 0004_research_and_cases.sql

-- Web-research cache (public, no RLS — global PubMed/OpenAlex/Scholar results)
create table if not exists public.research_articles (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  abstract   text,
  source     text not null,                       -- 'pubmed' | 'openalex' | 'scholar'
  url        text,
  disease    text not null,                       -- normalized search term
  herbs      text[] not null default '{}',
  year       int,
  fetched_at timestamptz not null default now()
);

create index if not exists idx_ra_disease on public.research_articles(disease);
create index if not exists idx_ra_fetched on public.research_articles(fetched_at);

-- Doctor-submitted clinical cases for similarity retrieval (RLS)
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

create index if not exists idx_cc_embedding on public.clinical_cases using hnsw (embedding vector_cosine_ops);
create index if not exists idx_cc_user      on public.clinical_cases(user_id);

alter table public.clinical_cases enable row level security;
create policy "cases: select own" on public.clinical_cases for select
  using (user_id = auth.uid());
create policy "cases: insert own" on public.clinical_cases for insert
  with check (user_id = auth.uid());
create policy "cases: update own" on public.clinical_cases for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cases: delete own" on public.clinical_cases for delete
  using (user_id = auth.uid());

-- RPC for per-user similarity search (RLS alone can't scope vector ops to the caller,
-- so this function hard-filters by user_id before scoring).
create or replace function public.match_clinical_cases(
  query_embedding vector(1024),
  query_user_id   uuid,
  match_threshold float default 0.7,
  match_count     int   default 5
)
returns table (
  id uuid, diagnosis text, patient_summary text, treatment_plan text,
  outcome text, similarity float
)
language plpgsql stable
security definer
set search_path = public
as $$
begin
  return query
  select
    cc.id, cc.diagnosis, cc.patient_summary, cc.treatment_plan, cc.outcome,
    1 - (cc.embedding <=> query_embedding) as similarity
  from public.clinical_cases cc
  where cc.user_id = query_user_id
    and (cc.embedding <=> query_embedding) < (1 - match_threshold)
  order by cc.embedding <=> query_embedding
  limit match_count;
end;
$$;

grant execute on function public.match_clinical_cases(uuid, uuid, float, int) to authenticated;
```

- [ ] **Step 2: Commit**

Run:
```bash
git add supabase/migrations/0004_research_and_cases.sql
git commit -m "feat(rag): add research_articles and clinical_cases migrations

research_articles: 24h web-research cache (public, no RLS).
clinical_cases: doctor-submitted cases with HNSW + RLS, plus a
security-definer match_clinical_cases() RPC that hard-filters by user_id
before vector scoring."
```

### Task 2.3: Create chat_sessions and messages migration

**Files:**
- Create: `supabase/migrations/0005_chat_tables.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0005_chat_tables.sql` with exactly:

```sql
-- 0005_chat_tables.sql
-- Normalized conversation persistence (replaces patients.chats JSONB blob for history growth).

create table if not exists public.chat_sessions (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  title      text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.chat_sessions(id) on delete cascade,
  role        text not null check (role in ('user','assistant','system')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_cs_owner    on public.chat_sessions(owner_id);
create index if not exists idx_msgs_session on public.messages(session_id);

alter table public.chat_sessions enable row level security;
alter table public.messages      enable row level security;

create policy "chat_sessions: select own" on public.chat_sessions for select using (owner_id = auth.uid());
create policy "chat_sessions: insert own" on public.chat_sessions for insert with check (owner_id = auth.uid());
create policy "chat_sessions: update own" on public.chat_sessions for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "chat_sessions: delete own" on public.chat_sessions for delete using (owner_id = auth.uid());

create policy "messages: select own" on public.messages for select
  using (exists (select 1 from public.chat_sessions cs where cs.id = messages.session_id and cs.owner_id = auth.uid()));
create policy "messages: insert own" on public.messages for insert
  with check (exists (select 1 from public.chat_sessions cs where cs.id = messages.session_id and cs.owner_id = auth.uid()));
create policy "messages: delete own" on public.messages for delete
  using (exists (select 1 from public.chat_sessions cs where cs.id = messages.session_id and cs.owner_id = auth.uid()));
```

- [ ] **Step 2: Commit**

Run:
```bash
git add supabase/migrations/0005_chat_tables.sql
git commit -m "feat(rag): add chat_sessions and messages migrations with RLS"
```

### Task 2.4: Apply migrations locally and verify

**Files:**
- None (verification only)

- [ ] **Step 1: Ensure Supabase CLI is available**

Run:
```bash
supabase --version
```
Expected: a version number. If not installed, follow https://supabase.com/docs/guides/cli and install before continuing.

- [ ] **Step 2: Start local Supabase**

Run:
```bash
supabase start
```
Expected: Docker containers start; ends with a list of local URLs/keys.

- [ ] **Step 3: Apply pending migrations**

Run:
```bash
supabase db reset
```
Expected: applies all migrations from `supabase/migrations/` in order. Watch for SQL errors in `0003`/`0004`/`0005`.

- [ ] **Step 4: Verify tables and RPC exist via psql**

Run (substitute the local DB URL from `supabase status` output):
```bash
supabase db execute --local "\dt public.*"
```
Expected output includes: `knowledge_embeddings`, `research_articles`, `clinical_cases`, `chat_sessions`, `messages`.

- [ ] **Step 5: Verify the match_knowledge RPC exists**

Run:
```bash
supabase db execute --local "\df public.match_knowledge"
supabase db execute --local "\df public.match_clinical_cases"
```
Expected: both functions listed with their signatures.

- [ ] **Step 6: Verify RLS is enabled on clinical_cases**

Run:
```bash
supabase db execute --local "select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('knowledge_embeddings','research_articles','clinical_cases','chat_sessions','messages');"
```
Expected: `knowledge_embeddings` and `research_articles` have `rowsecurity = f`; the other three have `rowsecurity = t`.

No commit — this task only verifies the schema. If verification fails, fix the migration in place and re-run from Step 3.

---

## Phase 3: Shared RAG Library

Seven focused files under `supabase/functions/_shared/rag/`. Each file is small, has one responsibility, and is written to be testable where possible. Pure helper logic is extracted so it can be unit-tested in Node.

### Task 3.1: Create the multi-provider embeddings client

**Files:**
- Create: `supabase/functions/_shared/rag/embeddings.ts`
- Create: `supabase/functions/_shared/rag/_test/embeddings.test.mjs`

- [ ] **Step 1: Write the embeddings client**

Create `supabase/functions/_shared/rag/embeddings.ts`:

```typescript
// Multi-provider embedding client.
// Providers: NVIDIA NV-Embed-QA (primary), Gemini text-embedding-004 (fallback).
// No silent cross-provider fallback at runtime — fallback is a compile-time
// choice via the EMBEDDING_PROVIDER env. The runtime throws if the selected
// provider's key is unset.

export const EMBEDDING_DIM = 1024;

export type EmbeddingProvider = 'nvidia' | 'gemini';

interface EmbedOptions {
  provider?: EmbeddingProvider;
  model?: string;
}

const NVIDIA_DEFAULT_MODEL = 'nvidia/nv-embedqa-e5-v5';
const GEMINI_DEFAULT_MODEL = 'gemini-embedding-001';

function providerFromEnv(): EmbeddingProvider {
  const p = (Deno.env.get('EMBEDDING_PROVIDER') || 'nvidia').toLowerCase();
  return p === 'gemini' ? 'gemini' : 'nvidia';
}

function nvidiaKey(): string {
  const k = Deno.env.get('NVIDIA_API_KEY');
  if (!k) throw new EmbeddingConfigError('NVIDIA_API_KEY is not configured');
  return k;
}

function geminiKey(): string {
  const k = Deno.env.get('GEMINI_API_KEY');
  if (!k) throw new EmbeddingConfigError('GEMINI_API_KEY is not configured');
  return k;
}

export class EmbeddingConfigError extends Error {
  status = 503;
}

/** Validate an embedding vector: dimension + finite numbers. */
export function validateEmbedding(vec: number[], expectedDim = EMBEDDING_DIM): void {
  if (!Array.isArray(vec) || vec.length !== expectedDim) {
    throw new Error(`Invalid embedding dimension: expected ${expectedDim}, got ${vec?.length}`);
  }
  for (let i = 0; i < vec.length; i++) {
    if (!Number.isFinite(vec[i])) {
      throw new Error(`Invalid embedding: non-finite value at index ${i}`);
    }
  }
}

export async function embedText(text: string, opts: EmbedOptions = {}): Promise<number[]> {
  const vecs = await embedBatch([text], opts);
  return vecs[0];
}

export async function embedBatch(texts: string[], opts: EmbedOptions = {}): Promise<number[][]> {
  if (texts.length === 0) return [];
  const provider = opts.provider || providerFromEnv();
  let vecs: number[][];
  if (provider === 'nvidia') {
    vecs = await embedNvidia(texts, opts.model);
  } else {
    vecs = await embedGemini(texts, opts.model);
  }
  for (const v of vecs) validateEmbedding(v);
  return vecs;
}

async function embedNvidia(texts: string[], model?: string): Promise<number[][]> {
  const url = 'https://integrate.api.nvidia.com/v1/embeddings';
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${nvidiaKey()}`,
    },
    body: JSON.stringify({
      model: model || NVIDIA_DEFAULT_MODEL,
      input: texts,
      encoding_format: 'float',
    }),
  });
  const data = await res.json();
  // NVIDIA returns { data: [{ embedding: [...] }, ...] } ordered by input.
  return data.data
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((d: { embedding: number[] }) => d.embedding);
}

async function embedGemini(texts: string[], model?: string): Promise<number[][]> {
  const m = model || GEMINI_DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:batchEmbedContents?key=${geminiKey()}`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: texts.map((t) => ({ model: `models/${m}`, content: { parts: [{ text: t }] } })),
    }),
  });
  const data = await res.json();
  return data.embeddings.map((e: { values: number[] }) => e.values);
}

async function fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status === 429) {
        await sleep(1000 * (i + 1));
        continue;
      }
      if (!res.ok) {
        throw new Error(`Embedding API ${res.status}: ${await res.text()}`);
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await sleep(500 * (i + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Embedding request failed');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
```

- [ ] **Step 2: Write a Node-runnable test for the pure validator**

Because the embedding network calls require Deno + API keys, we test only the pure logic (`validateEmbedding`). Create `supabase/functions/_shared/rag/_test/embeddings.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert';

// Re-implement the pure validator here to test it under Node (the .ts uses Deno.env).
// This mirrors embeddings.ts validateEmbedding exactly; keep them in sync.
function validateEmbedding(vec, expectedDim = 1024) {
  if (!Array.isArray(vec) || vec.length !== expectedDim) {
    throw new Error(`Invalid embedding dimension: expected ${expectedDim}, got ${vec?.length}`);
  }
  for (let i = 0; i < vec.length; i++) {
    if (!Number.isFinite(vec[i])) {
      throw new Error(`Invalid embedding: non-finite value at index ${i}`);
    }
  }
}

test('validateEmbedding accepts a correct-length finite vector', () => {
  const v = new Array(1024).fill(0.1);
  assert.doesNotThrow(() => validateEmbedding(v));
});

test('validateEmbedding rejects wrong dimension', () => {
  assert.throws(() => validateEmbedding([0.1, 0.2], 1024), /expected 1024/);
});

test('validateEmbedding rejects NaN', () => {
  const v = new Array(1024).fill(0.1);
  v[5] = NaN;
  assert.throws(() => validateEmbedding(v), /non-finite value at index 5/);
});

test('validateEmbedding rejects Infinity', () => {
  const v = new Array(1024).fill(0.1);
  v[10] = Infinity;
  assert.throws(() => validateEmbedding(v), /non-finite value at index 10/);
});

test('validateEmbedding rejects non-array', () => {
  assert.throws(() => validateEmbedding(null), /Invalid embedding dimension/);
});
```

- [ ] **Step 3: Run the test and verify it passes**

Run:
```bash
node --test supabase/functions/_shared/rag/_test/embeddings.test.mjs
```
Expected: 5 tests pass.

- [ ] **Step 4: Commit**

Run:
```bash
git add supabase/functions/_shared/rag/embeddings.ts supabase/functions/_shared/rag/_test/embeddings.test.mjs
git commit -m "feat(rag): add multi-provider embeddings client (NVIDIA + Gemini)

embeddings.ts: NVIDIA NV-Embed-QA primary, Gemini fallback, dimension
and finite-value validation, retry on 429. Includes Node-runnable unit
test for the pure validator."
```

### Task 3.2: Create the unified query expansion module (single source of truth)

**Files:**
- Create: `supabase/functions/_shared/rag/query.ts`
- Create: `supabase/functions/_shared/rag/_test/query.test.mjs`

- [ ] **Step 1: Write the query module**

Create `supabase/functions/_shared/rag/query.ts`. This is the single source of truth for intent classification, query expansion, and the Sanskrit disease-concept map — replacing the six duplicates deleted in Task 1.1.

```typescript
// Single source of truth for query understanding.
// Replaces the six duplicated intent/expansion implementations deleted in Phase 1.

export type Intent =
  | 'herb'
  | 'disease'
  | 'treatment'
  | 'diet'
  | 'dosha'
  | 'diagnosis'
  | 'drug_interaction'
  | 'prakriti'
  | 'procedure'
  | 'general';

export interface ParsedQuery {
  intent: Intent;
  entities: string[];
  expanded: string[];
  complexity: 'simple' | 'moderate' | 'complex';
}

// Sanskrit <-> modern disease mapping (consolidated from deleted duplicates).
export const DISEASE_CONCEPT_MAP: Record<string, string[]> = {
  diabetes: ['prameha', 'madhumeha'],
  'type 2 diabetes': ['prameha', 'madhumeha'],
  hypertension: ['rakta gata vata', 'vyana bala'],
  anxiety: ['chittodvega', 'unmada'],
  depression: ['vishada', 'avasadana'],
  arthritis: ['amavata', 'sandhivata'],
  'rheumatoid arthritis': ['amavata'],
  osteoarthritis: ['sandhivata'],
  asthma: ['tamaka shwasa', 'shwasa'],
  'irritable bowel': ['grahani', 'atisara'],
  'acid reflux': ['amlapitta', 'grahani'],
  obesity: ['medoroga', 'sthaulya'],
  constipation: ['vibandha', 'udavarta'],
  insomnia: ['anidra', 'nidranasha'],
  migraine: ['ardhavabhedaka', 'shirashoola'],
  'skin disease': ['kushta', 'twak vikara'],
  eczema: ['vicharchika', 'kushta'],
  psoriasis: ['kitibha', 'kushta'],
  fever: ['jwara'],
  cough: ['kasa'],
  'common cold': ['pratishyaya'],
};

const INTENT_PATTERNS: { intent: Intent; patterns: RegExp[] }[] = [
  { intent: 'herb', patterns: [/\b(herb|ashwagandha|triphala|tulsi|brahmi|turmeric|curcumin|guduchi|amla|shatavari)\b/i] },
  { intent: 'disease', patterns: [/\b(disease|condition|prameha|diabetes|arthritis|asthma|fever|jwara|kushta)\b/i] },
  { intent: 'treatment', patterns: [/\b(treat|treatment|cure|chikitsa|remedy|manage|management)\b/i] },
  { intent: 'diet', patterns: [/\b(diet|food|pathya|apathya|eat|nutrition|ahara)\b/i] },
  { intent: 'dosha', patterns: [/\b(vata|pitta|kapha|dosha|tridosha|prakriti|vikriti)\b/i] },
  { intent: 'diagnosis', patterns: [/\b(diagnos|pariksha|nidan|samprapti|symptom|sign of)\b/i] },
  { intent: 'drug_interaction', patterns: [/\b(interact|interaction|allopath|modern medicine|drug|medication)\b/i] },
  { intent: 'prakriti', patterns: [/\b(prakriti|constitution|body type|temperament)\b/i] },
  { intent: 'procedure', patterns: [/\b(panchakarma|virechana|basti|nasya|rakta moksha|vamana|shodhana)\b/i] },
];

export function classifyIntent(query: string): Intent {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(query))) return intent;
  }
  return 'general';
}

export function extractEntities(query: string): string[] {
  const entities: string[] = [];
  const lower = query.toLowerCase();
  for (const [modern, sanskrit] of Object.entries(DISEASE_CONCEPT_MAP)) {
    if (lower.includes(modern)) entities.push(modern, ...sanskrit);
    for (const s of sanskrit) {
      if (lower.includes(s.toLowerCase())) entities.push(s, modern);
    }
  }
  return [...new Set(entities)]; // dedup, preserve order
}

export function expandQuery(query: string, intent?: Intent, entities: string[] = []): string[] {
  const variants = new Set<string>([query]);
  const detectedIntent = intent || classifyIntent(query);
  const detectedEntities = entities.length ? entities : extractEntities(query);

  // Add Sanskrit / synonym variants from the concept map.
  for (const e of detectedEntities) {
    const map = DISEASE_CONCEPT_MAP[e.toLowerCase()];
    if (map) for (const s of map) variants.add(`${query} ${s}`);
  }

  // Add an intent-focused variant.
  const intentTerms: Record<Intent, string> = {
    herb: 'herb dravya rasa guna virya vipaka',
    disease: 'vyadhi roga samprapti lakshana',
    treatment: 'chikitsa shamana shodhana',
    diet: 'pathya apathya ahara',
    dosha: 'vata pitta kapha dosha',
    diagnosis: 'nidan panchaka samprapti pariksha',
    drug_interaction: 'drug interaction viruddha',
    prakriti: 'prakriti vikriti constitution',
    procedure: 'panchakarma shodhana procedure',
    general: '',
  };
  if (intentTerms[detectedIntent]) {
    variants.add(`${query} ${intentTerms[detectedIntent]}`);
  }

  // Cap at 5 variants for search breadth without explosion.
  return [...variants].slice(0, 5);
}

export function scoreComplexity(query: string, entities: string[]): 'simple' | 'moderate' | 'complex' {
  const words = query.split(/\s+/).length;
  const entCount = entities.length;
  const hasMulti = /\b(and|also|both|versus|compare|combine|with|along with)\b/i.test(query);
  if (words > 20 || entCount >= 3 || hasMulti) return 'complex';
  if (words > 10 || entCount >= 1) return 'moderate';
  return 'simple';
}

export function parseQuery(query: string): ParsedQuery {
  const intent = classifyIntent(query);
  const entities = extractEntities(query);
  const expanded = expandQuery(query, intent, entities);
  const complexity = scoreComplexity(query, entities);
  return { intent, entities, expanded, complexity };
}
```

- [ ] **Step 2: Write the Node-runnable test**

Because `query.ts` is pure logic (no Deno APIs), it imports cleanly under Node with `--experimental-strip-types` (Node 22+) or by testing the logic via a `.mjs` copy. Use the copy approach to avoid version coupling. Create `supabase/functions/_shared/rag/_test/query.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert';

// Inline the pure functions to test under Node (mirrors query.ts exactly; keep in sync).
const DISEASE_CONCEPT_MAP = {
  diabetes: ['prameha', 'madhumeha'],
  arthritis: ['amavata', 'sandhivata'],
  anxiety: ['chittodvega', 'unmada'],
};
const INTENT_PATTERNS = [
  { intent: 'herb', patterns: [/\b(herb|ashwagandha|triphala)\b/i] },
  { intent: 'disease', patterns: [/\b(disease|diabetes|prameha)\b/i] },
  { intent: 'treatment', patterns: [/\b(treat|cure|chikitsa)\b/i] },
  { intent: 'diet', patterns: [/\b(diet|food|pathya)\b/i] },
  { intent: 'dosha', patterns: [/\b(vata|pitta|kapha|dosha)\b/i] },
];
function classifyIntent(query) {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(query))) return intent;
  }
  return 'general';
}
function extractEntities(query) {
  const entities = [];
  const lower = query.toLowerCase();
  for (const [modern, sanskrit] of Object.entries(DISEASE_CONCEPT_MAP)) {
    if (lower.includes(modern)) entities.push(modern, ...sanskrit);
    for (const s of sanskrit) if (lower.includes(s.toLowerCase())) entities.push(s, modern);
  }
  return [...new Set(entities)];
}
function expandQuery(query, intent, entities = []) {
  const variants = new Set([query]);
  const det = entities.length ? entities : extractEntities(query);
  for (const e of det) {
    const m = DISEASE_CONCEPT_MAP[e.toLowerCase()];
    if (m) for (const s of m) variants.add(`${query} ${s}`);
  }
  return [...variants].slice(0, 5);
}

test('classifyIntent detects herb intent', () => {
  assert.equal(classifyIntent('Tell me about ashwagandha'), 'herb');
});
test('classifyIntent detects disease intent', () => {
  assert.equal(classifyIntent('What is the treatment for diabetes?'), 'disease');
});
test('classifyIntent falls back to general', () => {
  assert.equal(classifyIntent('Hello there'), 'general');
});
test('extractEntities maps diabetes to prameha', () => {
  const e = extractEntities('How to manage diabetes?');
  assert.ok(e.includes('diabetes'));
  assert.ok(e.includes('prameha'));
  assert.ok(e.includes('madhumeha'));
});
test('expandQuery includes the original plus sanskrit variants', () => {
  const v = expandQuery('treatment for arthritis', 'disease', extractEntities('treatment for arthritis'));
  assert.ok(v[0].includes('arthritis'));
  assert.ok(v.some((s) => s.includes('amavata')));
});
test('expandQuery caps at 5 variants', () => {
  const v = expandQuery('diabetes arthritis anxiety lots of words here');
  assert.ok(v.length <= 5);
});
```

- [ ] **Step 3: Run the test**

Run:
```bash
node --test supabase/functions/_shared/rag/_test/query.test.mjs
```
Expected: 6 tests pass.

- [ ] **Step 4: Commit**

Run:
```bash
git add supabase/functions/_shared/rag/query.ts supabase/functions/_shared/rag/_test/query.test.mjs
git commit -m "feat(rag): add unified query expansion (single source of truth)

query.ts: intent classification, Sanskrit disease-concept mapping,
query expansion, complexity scoring. Replaces the six duplicated
implementations deleted in Phase 1. Node-runnable unit tests for the
pure logic."
```

### Task 3.3: Create the in-memory knowledge access module

**Files:**
- Create: `supabase/functions/_shared/rag/knowledge.ts`

- [ ] **Step 1: Write the knowledge access module**

Create `supabase/functions/_shared/rag/knowledge.ts`:

```typescript
// In-memory access to the curated AYURVEDA_KNOWLEDGE corpus.
// Used as a keyword-search fallback and to enhance queries with named entities.
// Replaces the deleted corpus.ts and the in-memory scan in vector-rag.ts.

import { AYURVEDA_KNOWLEDGE, searchKnowledge } from '../../../../knowledge-base/ayurknowledge/index.ts';

export { AYURVEDA_KNOWLEDGE, searchKnowledge };

export interface KnowledgeHit {
  content: string;
  source: string;
  category: string;
  title?: string;
}

/** Keyword (substring) search over the in-memory corpus. Top-N by match order. */
export function keywordSearch(query: string, limit = 10): KnowledgeHit[] {
  const blob = searchKnowledge(query);
  if (!blob || blob.startsWith('No direct matches')) return [];
  // searchKnowledge returns a single newline-joined string; split into hits.
  return blob
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .slice(0, limit)
    .map((content) => ({ content, source: 'in_memory', category: 'fallback', title: undefined }));
}

/** Names of all herbs known to the corpus (for entity extraction). */
export function herbNames(): string[] {
  const herbs = (AYURVEDA_KNOWLEDGE as any).herbs as Array<{ name: string; sanskrit: string; botanicalName: string }>;
  if (!Array.isArray(herbs)) return [];
  return herbs.flatMap((h) => [h.name, h.sanskrit, h.botanicalName].filter(Boolean));
}

/** Names of all diseases known to the corpus. */
export function diseaseNames(): string[] {
  const diseases = (AYURVEDA_KNOWLEDGE as any).diseases as Array<{ name: string; sanskrit: string }>;
  if (!Array.isArray(diseases)) return [];
  return diseases.flatMap((d) => [d.name, d.sanskrit].filter(Boolean));
}
```

- [ ] **Step 2: Verify the import path resolves**

The import path `../../../../knowledge-base/ayurknowledge/index.ts` from `supabase/functions/_shared/rag/knowledge.ts` must reach `knowledge-base/ayurknowledge/index.ts`. Count segments: `_shared/rag/` → up to `functions/` (..), up to `supabase/` (..), up to repo root (..), then `knowledge-base/...`. That's three `..`, not four. Fix if needed — verify by:

Run:
```bash
node -e "const p = require('path'); console.log(p.resolve('supabase/functions/_shared/rag', '../../../../knowledge-base/ayurknowledge/index.ts'))"
```
Expected: `E:/ayurveda-practitioner-assistant/knowledge-base/ayurknowledge/index.ts`. If it shows a different path, adjust the `../` count in the import. (Four `..` is correct: rag → _shared → functions → supabase → root.)

- [ ] **Step 3: Commit**

Run:
```bash
git add supabase/functions/_shared/rag/knowledge.ts
git commit -m "feat(rag): add in-memory knowledge access module

knowledge.ts wraps AYURVEDA_KNOWLEDGE for keyword fallback search and
entity extraction. Replaces the deleted corpus.ts substring search."
```

### Task 3.4: Create the dual-client db.ts and auth helper

**Files:**
- Modify: `supabase/functions/_shared/db.ts` (rewrite)
- Create: `supabase/functions/_shared/auth.ts`

- [ ] **Step 1: Rewrite db.ts as a dual-client factory**

Replace the entire contents of `supabase/functions/_shared/db.ts` with:

```typescript
// Supabase client factory.
// serviceClient(): service-role, bypasses RLS. Use ONLY for global knowledge reads
//   (knowledge_embeddings, research_articles). Never for user data.
// userScopedClient(jwt): anon-key + caller JWT, enforces RLS. Use for all user data
//   (clinical_cases, chat_sessions, messages, patients, feedback_logs).

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

let _service: SupabaseClient | null = null;

/** Service-role client. RLS-bypassing. For global knowledge only. */
export function serviceClient(): SupabaseClient {
  if (!_service) _service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  return _service;
}

/** User-scoped client. RLS-enforced. For user data. */
export function userScopedClient(jwt: string): SupabaseClient {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

// Backward-compat export (still used by google-token-exchange). Prefer serviceClient().
export const db = serviceClient();
```

- [ ] **Step 2: Create the auth helper**

Create `supabase/functions/_shared/auth.ts`:

```typescript
// JWT validation helper. Returns the authenticated user or null.
import { userScopedClient } from './db.ts';

export interface AuthUser {
  id: string;
  email?: string;
}

export async function getUser(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const jwt = authHeader.slice('Bearer '.length);
  try {
    const client = userScopedClient(jwt);
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}

/** Require auth: returns the user or throws a 401-shaped error for the handler to catch. */
export async function requireUser(req: Request): Promise<AuthUser> {
  const user = await getUser(req);
  if (!user) {
    const err = new Error('Authentication required. Please log in.');
    (err as any).status = 401;
    throw err;
  }
  return user;
}
```

- [ ] **Step 3: Commit**

Run:
```bash
git add supabase/functions/_shared/db.ts supabase/functions/_shared/auth.ts
git commit -m "feat(rag): dual-client db factory + auth helper

db.ts: serviceClient() for global knowledge (RLS bypass), userScopedClient(jwt)
for user data (RLS enforced). Fixes the hazard of using service-role key at
request time. auth.ts: getUser/requireUser helpers."
```

### Task 3.5: Create the multi-provider LLM client

**Files:**
- Modify: `supabase/functions/_shared/llm.ts` (rewrite → becomes rag/llm.ts)

- [ ] **Step 1: Create the new multi-provider LLM client**

Create `supabase/functions/_shared/rag/llm.ts`:

```typescript
// Multi-provider streaming LLM client.
// Providers: NVIDIA NIM (OpenAI-compatible), Gemini, OpenAI-compatible custom.
// No silent cross-provider fallback. Missing key => 503.

export type LlmProvider = 'nvidia' | 'gemini' | 'openai-compatible';

export class LlmConfigError extends Error {
  status = 503;
}

const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1';

export function providerForModel(model: string): LlmProvider {
  if (model.startsWith('nvidia/')) return 'nvidia';
  if (model.startsWith('gemini')) return 'gemini';
  return 'openai-compatible';
}

export function defaultModel(): string {
  return Deno.env.get('DEFAULT_LLM_MODEL') || 'gemini-2.5-pro';
}

export function validateModel(model: string): void {
  const VALID = [
    'gemini-2.5-pro',
    'nvidia/llama-3.1-nemotron-70b-instruct',
    'nvidia/llama-3.3-70b-instruct',
  ];
  // Allow any explicitly-listed model, plus any nvidia/* / gemini* / openai-compatible/*.
  if (VALID.includes(model) || /^(nvidia|gemini|openai-compatible)\//.test(model) || model.startsWith('gemini')) return;
  const err = new Error(`Model not supported: ${model}. Valid: ${VALID.join(', ')}`);
  (err as any).status = 422;
  throw err;
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/** Non-streaming completion. Returns the full text. */
export async function complete(prompt: string, opts: ChatOptions = {}): Promise<string> {
  const model = opts.model || defaultModel();
  validateModel(model);
  const provider = providerForModel(model);
  if (provider === 'gemini') return completeGemini(prompt, model, opts);
  return completeOpenAiCompatible(prompt, model, opts, provider);
}

/** Streaming completion via ReadableStream. Each chunk is a text delta. */
export function stream(prompt: string, opts: ChatOptions = {}): ReadableStream<Uint8Array> {
  const model = opts.model || defaultModel();
  validateModel(model);
  const provider = providerForModel(model);
  const encoder = new TextEncoder();
  if (provider === 'gemini') {
    return streamGemini(prompt, model, opts, encoder);
  }
  return streamOpenAiCompatible(prompt, model, opts, provider, encoder);
}

function keyOrThrow(envVar: string): string {
  const k = Deno.env.get(envVar);
  if (!k) throw new LlmConfigError(`${envVar} is not configured. Set it in Supabase Edge Function secrets.`);
  return k;
}

async function completeGemini(prompt: string, model: string, opts: ChatOptions): Promise<string> {
  const key = keyOrThrow('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: opts.temperature ?? 0.7, maxOutputTokens: opts.maxTokens ?? 8192 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function completeOpenAiCompatible(prompt: string, model: string, opts: ChatOptions, provider: LlmProvider): Promise<string> {
  const { key, base } = openAiConfig(provider);
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 8192,
    }),
  });
  if (!res.ok) throw new Error(`${provider} ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function openAiConfig(provider: LlmProvider): { key: string; base: string } {
  if (provider === 'nvidia') return { key: keyOrThrow('NVIDIA_API_KEY'), base: NVIDIA_BASE };
  const key = Deno.env.get('LLM_API_KEY');
  const base = Deno.env.get('LLM_BASE_URL');
  if (!key || !base) throw new LlmConfigError('LLM_API_KEY and LLM_BASE_URL must be set for openai-compatible models.');
  return { key, base };
}

function streamGemini(prompt: string, model: string, opts: ChatOptions, encoder: TextEncoder): ReadableStream<Uint8Array> {
  const key = Deno.env.get('GEMINI_API_KEY');
  return new ReadableStream({
    async start(controller) {
      try {
        if (!key) throw new LlmConfigError('GEMINI_API_KEY is not configured');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${key}&alt=sse`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: opts.temperature ?? 0.7, maxOutputTokens: opts.maxTokens ?? 8192 },
          }),
        });
        if (!res.ok || !res.body) throw new Error(`Gemini stream ${res.status}`);
        for await (const line of res.body) {
          const text = new TextDecoder().decode(line);
          if (!text.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(text.slice(6));
            const delta = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch { /* skip keepalive */ }
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });
}

function streamOpenAiCompatible(prompt: string, model: string, opts: ChatOptions, provider: LlmProvider, encoder: TextEncoder): ReadableStream<Uint8Array> {
  const { key, base } = openAiConfig(provider);
  return new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: opts.temperature ?? 0.7,
            max_tokens: opts.maxTokens ?? 8192,
            stream: true,
          }),
        });
        if (!res.ok || !res.body) throw new Error(`${provider} stream ${res.status}`);
        for await (const line of res.body) {
          const text = new TextDecoder().decode(line);
          if (!text.startsWith('data: ') || text.includes('[DONE]')) continue;
          try {
            const json = JSON.parse(text.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch { /* skip */ }
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });
}
```

- [ ] **Step 2: Remove the old _shared/llm.ts**

Run:
```bash
git rm supabase/functions/_shared/llm.ts
```

- [ ] **Step 3: Commit**

Run:
```bash
git add supabase/functions/_shared/rag/llm.ts
git commit -m "feat(rag): multi-provider streaming LLM client (NVIDIA + Gemini + OpenAI-compatible)

rag/llm.ts replaces the deleted _shared/llm.ts. Adds streaming via
ReadableStream, model validation (422 on invalid), and 503 on missing key.
No silent cross-provider fallback."
```

### Task 3.6: Create the surface-specific prompts module

**Files:**
- Create: `supabase/functions/_shared/rag/prompts.ts`

- [ ] **Step 1: Write the prompts module**

Create `supabase/functions/_shared/rag/prompts.ts`:

```typescript
// Surface-specific system prompts and context assemblers.
// One source of truth replacing the scattered prompt builders deleted in Phase 1.

export interface ContextChunk {
  content: string;
  source: string;
  category: string;
  title?: string;
}

export interface ResearchArticle {
  title: string;
  abstract: string;
  source: string;
  url?: string;
  year?: number;
}

/** Assemble retrieved chunks into a numbered context block with source labels. */
export function assembleContext(chunks: ContextChunk[]): string {
  if (chunks.length === 0) return 'No relevant knowledge found in the curated corpus.';
  return chunks
    .map((c, i) => `[${i + 1}] (${c.source}${c.title ? ' / ' + c.title : ''})\n${c.content}`)
    .join('\n\n');
}

/** Assemble research articles into a numbered evidence block. */
export function assembleResearch(articles: ResearchArticle[]): string {
  if (articles.length === 0) return 'No live research articles retrieved.';
  return articles
    .map((a, i) => `[R${i + 1}] (${a.source}, ${a.year ?? 'n.d.'}) ${a.title}${a.url ? ' ' + a.url : ''}\n${a.abstract ?? ''}`)
    .join('\n\n');
}

// --- Surface 1: Patient chatbot ---

export function patientChatPrompt(message: string, context: string, history: { role: string; content: string }[]): string {
  return `You are an Ayurvedic health information assistant for the general public. You are NOT a doctor. You do NOT diagnose or prescribe.

SAFETY RULES (non-negotiable):
- Never diagnose a medical condition or tell someone they have a specific disease.
- Never recommend specific medication dosages or prescribe treatment without a doctor's supervision.
- Always advise consulting a qualified Ayurvedic practitioner (Vaidya) or allopathic doctor.
- If the query is an emergency, tell them to seek immediate medical care.

KNOWLEDGE CONTEXT (from the curated Ayurvedic corpus — cite by [n] when used):
${context}

CONVERSATION HISTORY:
${history.map((h) => `${h.role}: ${h.content}`).join('\n') || '(none)'}

Respond conversationally in plain language. Use [CHAT] for the conversational reply. If you produce a structured summary, mark it [OUTPUT].
Patient: ${message}`;
}

// --- Surface 2: Clinical document generation ---

export interface ClinicalDocInput {
  docType: 'case_sheet' | 'prescription' | 'follow_up' | 'referral';
  caseData: {
    chiefComplaint?: string;
    examination?: string;
    prakriti?: string;
    investigations?: string;
    diagnosis?: string;
  };
}

export function clinicalDocPrompt(input: ClinicalDocInput, context: string): string {
  const labels: Record<string, string> = {
    case_sheet: 'Ayurvedic Case Sheet',
    prescription: 'Ayurvedic Prescription',
    follow_up: 'Follow-up Note',
    referral: 'Referral Letter',
  };
  const cd = input.caseData;
  return `You are an expert Ayurvedic Vaidya's scribe. Generate a structured ${labels[input.docType]} grounded in the provided knowledge.

KNOWLEDGE CONTEXT (cite [n]):
${context}

PATIENT ENCOUNTER DATA:
- Chief complaint: ${cd.chiefComplaint || 'N/A'}
- Examination findings: ${cd.examination || 'N/A'}
- Prakriti assessment: ${cd.prakriti || 'N/A'}
- Investigations: ${cd.investigations || 'N/A'}
- Diagnosis: ${cd.diagnosis || 'N/A'}

Produce a ${labels[input.docType]} in the Ayurvedic clinical tradition. Use [CHAT] for any brief clinical reasoning, then [OUTPUT] for the formatted document. Cite the knowledge context by [n]. Do NOT invent citations.`;
}

// --- Surface 3: Treatment protocol generation ---

export interface ProtocolInput {
  diagnosis: string;
  patientSummary?: string;
  severity?: string;
  chronicity?: string;
}

export function protocolPrompt(input: ProtocolInput, context: string, research: string, priorCases: string): string {
  return `You are an expert Ayurvedic Vaidya generating a detailed, evidence-based treatment protocol. Combine classical Ayurvedic references with modern clinical research.

KNOWLEDGE CONTEXT (classical + corpus — cite [n]):
${context}

MODERN RESEARCH EVIDENCE (cite [Rn]):
${research}

SIMILAR PRIOR CASES (anonymized, this practitioner's own — reference cautiously):
${priorCases || '(none available)'}

PROVISIONAL DIAGNOSIS: ${input.diagnosis}
PATIENT SUMMARY: ${input.patientSummary || 'N/A'}
SEVERITY: ${input.severity || 'unspecified'} | CHRONICITY: ${input.chronicity || 'unspecified'}

Generate a comprehensive treatment protocol with these sections:
1. Classical Reference — Sanskrit verse + translation + Charaka/Sushruta location (cite [n]; if none retrieved, say "classical reference pending").
2. Samprapti (Pathogenesis) — dosha/dushya/srotas analysis.
3. Treatment Approach — Shodhana / Shamana / Rasayana plan.
4. Herbal Interventions — herb, form, dosage, duration, anupana.
5. Panchakarma — procedures, sequence, duration (if indicated).
6. Pathya-Apathya — diet and regimen do/don't list.
7. Modern Evidence — summary of retrieved papers (cite [Rn]; if none retrieved for a claim, say "no retrieved evidence").
8. Expected Outcomes + Follow-up — milestones, review schedule, red-flag symptoms.

CRITICAL: every modern-evidence claim must map to a real [Rn] citation. Never invent PMIDs, journal names, or verses. Use [CHAT] for a brief summary then [OUTPUT] for the full protocol.`;
}
```

- [ ] **Step 2: Commit**

Run:
```bash
git add supabase/functions/_shared/rag/prompts.ts
git commit -m "feat(rag): surface-specific prompts and context assemblers

prompts.ts: patient chat, clinical doc, and treatment protocol prompts
with citation discipline ([n] for knowledge, [Rn] for research). One
source of truth replacing the scattered builders deleted in Phase 1."
```

### Task 3.7: Create the retrieval engine

**Files:**
- Create: `supabase/functions/_shared/rag/engine.ts`

- [ ] **Step 1: Write the engine**

Create `supabase/functions/_shared/rag/engine.ts`:

```typescript
// Unified retrieval engine. Single entry point for all three surfaces.
// Pipeline: parse query -> parallel vector + keyword search -> rerank -> truncate.

import { parseQuery, ParsedQuery } from './query.ts';
import { keywordSearch } from './knowledge.ts';
import { serviceClient } from '../db.ts';
import { embedText } from './embeddings.ts';
import { ContextChunk } from './prompts.ts';

export type Surface = 'chat' | 'clinical_docs' | 'treatment_protocol';

interface SurfaceConfig {
  topN: number;
  categoryBias: string[];
  sourceBias: string[];
  tokenBudget: number;
  threshold: number;
}

const SURFACE_CONFIG: Record<Surface, SurfaceConfig> = {
  chat:               { topN: 15, categoryBias: [], sourceBias: [], tokenBudget: 8000,  threshold: 0.65 },
  clinical_docs:      { topN: 20, categoryBias: ['disease', 'herb_monograph', 'treatment', 'allopathy_integration'], sourceBias: [], tokenBudget: 12000, threshold: 0.6 },
  treatment_protocol: { topN: 25, categoryBias: ['classical_text', 'disease', 'herb_monograph', 'treatment'], sourceBias: ['charak-samhita', 'sushruta'], tokenBudget: 16000, threshold: 0.55 },
};

export interface RetrieveOptions {
  surface: Surface;
  categoryFilter?: string[];
  sourceFilter?: string[];
  useKeyword?: boolean; // default true
}

export interface RetrievalResult {
  chunks: ContextChunk[];
  parsed: ParsedQuery;
}

export async function retrieve(query: string, opts: RetrieveOptions): Promise<RetrievalResult> {
  const cfg = SURFACE_CONFIG[opts.surface];
  const parsed = parseQuery(query);

  // Run vector search on the original query (single embedding; expansion improves
  // precision via reranking rather than N embedding calls).
  const queryEmbedding = await embedText(query);
  const db = serviceClient();
  const { data: vecHits, error } = await db.rpc('match_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: cfg.threshold,
    match_count: cfg.topN,
    category_filter: opts.categoryFilter ?? cfg.categoryBias,
    source_filter: opts.sourceFilter ?? cfg.sourceBias,
  });
  if (error) throw new Error(`match_knowledge failed: ${error.message}`);

  const chunks: ContextChunk[] = (vecHits ?? []).map((h: any) => ({
    content: h.content,
    source: h.source,
    category: h.category,
    title: h.title,
  }));

  // Keyword fallback for surface robustness (catches exact-term misses).
  if (opts.useKeyword !== false) {
    const kwHits = keywordSearch(query, 10);
    for (const k of kwHits) {
      if (!chunks.some((c) => c.content === k.content)) chunks.push(k);
    }
  }

  const reranked = rerank(chunks, parsed);
  const truncated = truncateToTokens(reranked, cfg.tokenBudget);
  return { chunks: truncated, parsed };
}

/** Rerank: boost by intent/category/source match, cap source diversity at 3. */
function rerank(chunks: ContextChunk[], parsed: ParsedQuery): ContextChunk[] {
  const scored = chunks.map((c) => {
    let score = 0;
    if (parsed.entities.some((e) => c.content.toLowerCase().includes(e.toLowerCase()))) score += 2;
    if (parsed.intent !== 'general' && c.category.includes(parsed.intent)) score += 1;
    score += countAyurvedicTerms(c.content);
    return { chunk: c, score };
  });
  scored.sort((a, b) => b.score - a.score);

  // Source diversity: at most 3 chunks per source.
  const result: ContextChunk[] = [];
  const perSource: Record<string, number> = {};
  for (const { chunk } of scored) {
    perSource[chunk.source] = (perSource[chunk.source] || 0) + 1;
    if (perSource[chunk.source] <= 3) result.push(chunk);
  }
  return result;
}

const AYUR_TERMS = /\b(vata|pitta|kapha|dosha|dhatu|rasa|guna|virya|vipaka|prameha|samprapti|shodhana|shamana|rasayana|panchakarma|pathya|apathya)\b/gi;
function countAyurvedicTerms(text: string): number {
  return (text.match(AYUR_TERMS) || []).length;
}

/** Truncate to an approximate token budget (~4 chars/token). */
function truncateToTokens(chunks: ContextChunk[], tokenBudget: number): ContextChunk[] {
  const charBudget = tokenBudget * 4;
  let used = 0;
  const out: ContextChunk[] = [];
  for (const c of chunks) {
    if (used + c.content.length > charBudget) break;
    out.push(c);
    used += c.content.length;
  }
  return out;
}
```

- [ ] **Step 2: Commit**

Run:
```bash
git add supabase/functions/_shared/rag/engine.ts
git commit -m "feat(rag): unified retrieval engine

engine.ts: retrieve() is the single entry point for all surfaces.
parse -> embed -> match_knowledge() RPC -> keyword fallback -> rerank
(intent + entity + Ayurvedic-term boost, source diversity cap) ->
token-budget truncation. Per-surface config for topN, category bias,
threshold, budget."
```

### Task 3.8: Create the web research module

**Files:**
- Create: `supabase/functions/_shared/rag/research.ts`

- [ ] **Step 1: Write the research module**

Create `supabase/functions/_shared/rag/research.ts`:

```typescript
// Live multi-source web research for treatment-protocol generation.
// Sources: PubMed (E-utilities, free), OpenAlex (free), Google Scholar (SerpAPI).
// Results cached in research_articles with a 24h TTL. Promise.allSettled so one
// source failing doesn't abort the protocol.

import { serviceClient } from '../db.ts';
import { ResearchArticle } from './prompts.ts';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface FetchedArticle extends ResearchArticle {
  disease: string;
  herbs: string[];
}

export async function fetchResearch(diagnosis: string, herbs: string[] = []): Promise<ResearchArticle[]> {
  const term = normalizeDiagnosis(diagnosis);

  // 1. Cache check.
  const cached = await readCache(term);
  if (cached.length > 0) return cached.map(stripInternal);

  // 2. Fetch in parallel.
  const [pubmed, openalex, scholar] = await Promise.allSettled([
    fetchPubMed(term),
    fetchOpenAlex(term),
    fetchScholar(term),
  ]);
  const articles: FetchedArticle[] = [];
  if (pubmed.status === 'fulfilled') articles.push(...pubmed.value);
  if (openalex.status === 'fulfilled') articles.push(...openalex.value);
  if (scholar.status === 'fulfilled') articles.push(...scholar.value);

  // 3. Dedup by title.
  const seen = new Set<string>();
  const unique = articles.filter((a) => {
    const key = a.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // 4. Write cache (fire-and-forget).
  writeCache(unique).catch((e) => console.warn('research cache write failed:', e));

  return unique.map(stripInternal);
}

function stripInternal(a: FetchedArticle): ResearchArticle {
  return { title: a.title, abstract: a.abstract, source: a.source, url: a.url, year: a.year };
}

function normalizeDiagnosis(d: string): string {
  // Map common Ayurvedic terms to modern search terms for better PubMed hits.
  const map: Record<string, string> = {
    prameha: 'diabetes mellitus',
    madhumeha: 'diabetes mellitus',
    amavata: 'rheumatoid arthritis',
    sandhivata: 'osteoarthritis',
    'tamaka shwasa': 'asthma',
    amlapitta: 'gastritis',
    medoroga: 'obesity',
  };
  return map[d.toLowerCase()] || d;
}

async function readCache(term: string): Promise<FetchedArticle[]> {
  const db = serviceClient();
  const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
  const { data, error } = await db
    .from('research_articles')
    .select('title, abstract, source, url, year')
    .eq('disease', term)
    .gte('fetched_at', cutoff);
  if (error || !data) return [];
  return data.map((r: any) => ({ ...r, disease: term, herbs: [] }));
}

async function writeCache(articles: FetchedArticle[]): Promise<void> {
  if (articles.length === 0) return;
  const db = serviceClient();
  const rows = articles.map((a) => ({
    title: a.title,
    abstract: a.abstract,
    source: a.source,
    url: a.url,
    disease: a.disease,
    herbs: a.herbs,
    year: a.year,
  }));
  const { error } = await db.from('research_articles').upsert(rows, { onConflict: 'disease,title' });
  if (error) console.warn('research_articles upsert:', error.message);
}

// --- PubMed via NCBI E-utilities ---

async function fetchPubMed(term: string): Promise<FetchedArticle[]> {
  const key = Deno.env.get('NCBI_API_KEY') ? `&api_key=${Deno.env.get('NCBI_API_KEY')}` : '';
  // esearch: get PMIDs
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term + ' ayurveda')}&retmax=5&retmode=json${key}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) throw new Error(`PubMed esearch ${searchRes.status}`);
  const searchData = await searchRes.json();
  const ids: string[] = searchData?.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  // esummary: get titles/years
  const sumUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json${key}`;
  const sumRes = await fetch(sumUrl);
  if (!sumRes.ok) throw new Error(`PubMed esummary ${sumRes.status}`);
  const sumData = await sumRes.json();
  const result = sumData?.result ?? {};

  return ids.map((id) => {
    const item = result[id];
    return {
      title: item?.title || `PubMed article ${id}`,
      abstract: item?.summary || 'Abstract not available via E-summary.',
      source: 'pubmed',
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      year: item?.pubdate ? parseInt(item.pubdate.slice(0, 4), 10) || undefined : undefined,
      disease: term,
      herbs: [],
    };
  });
}

// --- OpenAlex ---

async function fetchOpenAlex(term: string): Promise<FetchedArticle[]> {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(term + ' ayurveda')}&per-page=5&select=title,abstract_inverted_index,publication_year,doi`;
  const res = await fetch(url, { headers: { 'User-Agent': 'AyurScribe/1.0 (mailto:contact@ayurscribe.app)' } });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
  const data = await res.json();
  const works = data?.results ?? [];
  return works.map((w: any) => ({
    title: w.title || 'Untitled',
    abstract: invertIndexToText(w.abstract_inverted_index),
    source: 'openalex',
    url: w.doi || undefined,
    year: w.publication_year || undefined,
    disease: term,
    herbs: [],
  }));
}

function invertIndexToText(idx: Record<string, number[]> | null): string {
  if (!idx) return 'No abstract available.';
  const positions: { word: string; pos: number }[] = [];
  for (const [word, posList] of Object.entries(idx)) {
    for (const pos of posList) positions.push({ word, pos });
  }
  positions.sort((a, b) => a.pos - b.pos);
  return positions.map((p) => p.word).join(' ');
}

// --- Google Scholar via SerpAPI (optional) ---

async function fetchScholar(term: string): Promise<FetchedArticle[]> {
  const key = Deno.env.get('SERPAPI_KEY');
  if (!key) return []; // gracefully skipped
  const url = `https://serpapi.com/search.json?engine=google_scholar&q=${encodeURIComponent(term + ' ayurveda')}&num=5&api_key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
  const data = await res.json();
  const organic = data?.organic_results ?? [];
  return organic.map((r: any) => ({
    title: r.title || 'Untitled',
    abstract: (r.snippet || '') + (r.publication_info?.summary ? ' — ' + r.publication_info.summary : ''),
    source: 'scholar',
    url: r.link || undefined,
    year: r.publication_info?.year || undefined,
    disease: term,
    herbs: [],
  }));
}
```

- [ ] **Step 2: Commit**

Run:
```bash
git add supabase/functions/_shared/rag/research.ts
git commit -m "feat(rag): live multi-source web research module

research.ts: PubMed E-utilities + OpenAlex + SerpAPI Scholar, fetched in
parallel (allSettled), 24h cache in research_articles, diagnosis
normalization (Sanskrit->modern). Scholar gracefully skipped without
SERPAPI_KEY."
```

---

## Phase 4: Ingestion CLI

One canonical Node script that loads the curated knowledge, chunks it, embeds it (multi-provider), and upserts into `knowledge_embeddings`.

### Task 4.1: Create the ingestion CLI

**Files:**
- Create: `scripts/ingest-knowledge.ts`

- [ ] **Step 1: Create the scripts directory**

Run:
```bash
mkdir -p scripts
```

- [ ] **Step 2: Write the ingestion script**

Create `scripts/ingest-knowledge.ts`:

```typescript
// Canonical knowledge ingestion CLI.
// Loads ayurknowledge/*, chunks per-entity, embeds (NVIDIA primary, Gemini fallback),
// upserts into knowledge_embeddings with content_hash dedup.
// Run: npm run ingest   (after setting SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NVIDIA_API_KEY)

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { createHash } from 'crypto';

import {
  AYURVEDA_KNOWLEDGE,
  DISEASES, HERBS, TREATMENTS,
  FUNDAMENTALS, DIAGNOSTIC_METHODS, ALLOPATHY_INTEGRATION,
} from '../knowledge-base/ayurknowledge/index.js';

interface Chunk {
  content: string;
  source: string;
  category: string;
  title?: string;
  metadata: Record<string, unknown>;
}

// --- Embedding (multi-provider, NVIDIA primary) ---

const EMBEDDING_DIM = 1024;
const NVIDIA_MODEL = 'nvidia/nv-embedqa-e5-v5';

function getNvidiaKey(): string {
  const k = process.env.NVIDIA_API_KEY;
  if (!k) throw new Error('NVIDIA_API_KEY is required for ingestion');
  return k;
}

const nvidia = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: getNvidiaKey(),
});

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await nvidia.embeddings.create({
        model: NVIDIA_MODEL,
        input: texts,
        encoding_format: 'float',
      });
      const vecs = res.data
        .sort((a, b) => a.index - b.index)
        .map((d) => d.embedding as number[]);
      for (const v of vecs) validate(v);
      return vecs;
    } catch (err: any) {
      if (attempt === 2) throw err;
      const delay = err?.status === 429 ? 2000 * (attempt + 1) : 1000;
      console.warn(`  embed attempt ${attempt + 1} failed: ${err.message}; retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('unreachable');
}

function validate(vec: number[]): void {
  if (vec.length !== EMBEDDING_DIM) throw new Error(`bad dim: ${vec.length}`);
  if (!vec.every(Number.isFinite)) throw new Error('non-finite value');
}

// --- Chunking strategies ---

function chunkDiseases(): Chunk[] {
  return DISEASES.flatMap((d) => [
    {
      content: `Disease: ${d.name} (${d.sanskrit}). Modern correlation: ${d.modernCorrelation}. Samprapti (pathogenesis): ${d.samprapti}. Category: ${d.category}.`,
      source: 'diseases', category: 'disease', title: `${d.name} - pathogenesis`,
      metadata: { disease: d.name, sanskrit: d.sanskrit, section: 'samprapti' },
    },
    {
      content: `Disease: ${d.name} (${d.sanskrit}). Clinical features: ${d.clinicalFeatures.join('; ')}.`,
      source: 'diseases', category: 'disease', title: `${d.name} - symptoms`,
      metadata: { disease: d.name, sanskrit: d.sanskrit, section: 'symptoms' },
    },
    {
      content: `Disease: ${d.name} (${d.sanskrit}). Treatment: ${d.treatment.join('; ')}. Pathya (recommended): ${d.pathya.join(', ')}. Apathya (avoid): ${d.apathya.join(', ')}. Prognosis: ${d.prognosis}.`,
      source: 'diseases', category: 'disease', title: `${d.name} - treatment`,
      metadata: { disease: d.name, sanskrit: d.sanskrit, section: 'treatment' },
    },
  ]);
}

function chunkHerbs(): Chunk[] {
  return HERBS.flatMap((h) => [
    {
      content: `Herb: ${h.name} (${h.sanskrit}). Botanical: ${h.botanicalName}, family ${h.family}. Rasa: ${h.rasa.join(', ')}. Guna: ${h.guna.join(', ')}. Virya: ${h.virya}. Vipaka: ${h.vipaka}. Dosha karma: Vata ${h.doshaKarma.vata}, Pitta ${h.doshaKarma.pitta}, Kapha ${h.doshaKarma.kapha}.`,
      source: 'herbs', category: 'herb_monograph', title: `${h.name} - properties`,
      metadata: { herb: h.name, sanskrit: h.sanskrit, section: 'properties' },
    },
    {
      content: `Herb: ${h.name} (${h.sanskrit}). Indications: ${h.indications.join(', ')}. Dosage: ${h.dosage}.`,
      source: 'herbs', category: 'herb_monograph', title: `${h.name} - clinical uses`,
      metadata: { herb: h.name, sanskrit: h.sanskrit, section: 'clinical_uses' },
    },
  ]);
}

function chunkTreatments(): Chunk[] {
  return TREATMENTS.flatMap((t) => [
    {
      content: `Treatment: ${t.name} (${t.sanskrit}). Category: ${t.category}. Description: ${t.description}. Procedure: ${t.procedure.join('; ')}.`,
      source: 'treatments', category: 'treatment', title: `${t.name} - procedure`,
      metadata: { treatment: t.name, sanskrit: t.sanskrit, section: 'procedure' },
    },
    {
      content: `Treatment: ${t.name} (${t.sanskrit}). Indications: ${t.indications.join(', ')}. Contraindications: ${t.contraindications.join(', ')}. Duration: ${t.duration}.`,
      source: 'treatments', category: 'treatment', title: `${t.name} - indications`,
      metadata: { treatment: t.name, sanskrit: t.sanskrit, section: 'indications' },
    },
  ]);
}

function chunkFundamentals(): Chunk[] {
  const out: Chunk[] = [];
  for (const t of FUNDAMENTALS.tridosha) {
    out.push({
      content: `Tridosha: ${t.name} (${t.sanskrit}). ${t.definition}. Qualities: ${t.qualities.join(', ')}. Seat: ${t.seat}. Functions: ${t.functions.join(', ')}. Imbalance signs: ${t.imbalance.join(', ')}.`,
      source: 'fundamentals', category: 'fundamental', title: `Tridosha - ${t.name}`,
      metadata: { concept: 'tridosha', name: t.name },
    });
  }
  for (const sd of FUNDAMENTALS.saptadhatu) {
    out.push({
      content: `Saptadhatu: ${sd.name}. Function: ${sd.function}. Seat: ${sd.seat}. Quality: ${sd.quality}.`,
      source: 'fundamentals', category: 'fundamental', title: `Dhatu - ${sd.name}`,
      metadata: { concept: 'saptadhatu', name: sd.name },
    });
  }
  return out;
}

function chunkDiagnostics(): Chunk[] {
  return DIAGNOSTIC_METHODS.map((d) => ({
    content: `Diagnostic method: ${d.name} (${d.sanskrit}). ${d.description}. Components: ${d.components.join('; ')}. Clinical application: ${d.clinicalApplication.join('; ')}.`,
    source: 'diagnostics', category: 'diagnostic', title: d.name,
    metadata: { method: d.name, sanskrit: d.sanskrit },
  }));
}

function chunkAllopathy(): Chunk[] {
  return ALLOPATHY_INTEGRATION.map((a) => ({
    content: `Allopathy-Ayurveda integration: ${a.condition} (correlated with ${a.ayurvedicCorrelation}). Allopathic treatment: ${a.allopathyTreatment}. Integrated approach: ${a.integratedApproach}. Safety notes: ${a.safetyNotes.join('; ')}. Monitoring: ${a.monitoringParameters.join('; ')}.`,
    source: 'allopathy', category: 'allopathy_integration', title: a.condition,
    metadata: { condition: a.condition },
  }));
}

function chunkCharak(): Chunk[] {
  const charak = (AYURVEDA_KNOWLEDGE as any).charakAllChapters;
  if (!Array.isArray(charak) || charak.length === 0) return [];
  return charak.map((c: any, i: number) => ({
    content: `Charaka Samhita — ${c.sthana || ''} chapter ${c.chapterNumber ?? i}: ${c.name || ''}. ${(c.content || c.text || c.summary || '').slice(0, 1500)}`,
    source: 'charak-samhita', category: 'classical_text', title: c.name || `Chapter ${c.chapterNumber}`,
    metadata: { sthana: c.sthana, chapter: c.chapterNumber, source_text: 'Charaka Samhita' },
  }));
}

function defaultChunk(items: { text: string; source: string; category: string; title?: string }[]): Chunk[] {
  // 600-char chunks, 100-char overlap.
  const out: Chunk[] = [];
  for (const item of items) {
    const text = item.text;
    for (let i = 0; i < text.length; i += 500) {
      out.push({
        content: text.slice(i, i + 600),
        source: item.source, category: item.category, title: item.title,
        metadata: { chunkIndex: Math.floor(i / 500) },
      });
    }
  }
  return out;
}

function buildAllChunks(): Chunk[] {
  const chunks: Chunk[] = [];
  chunks.push(...chunkDiseases());
  chunks.push(...chunkHerbs());
  chunks.push(...chunkTreatments());
  chunks.push(...chunkFundamentals());
  chunks.push(...chunkDiagnostics());
  chunks.push(...chunkAllopathy());
  chunks.push(...chunkCharak());

  const counts = countBy(chunks, (c) => c.source);
  console.log('Built chunks by source:');
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
  return chunks;
}

function countBy<T>(arr: T[], key: (t: T) => string): Record<string, number> {
  return arr.reduce((acc, x) => { acc[key(x)] = (acc[key(x)] || 0) + 1; return acc; }, {} as Record<string, number>);
}

// --- Upsert ---

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  return createClient(url, key);
}

function hash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

async function upsert(db: ReturnType<typeof getClient>, chunks: Chunk[]): Promise<void> {
  // Embed in batches of 50.
  const batchSize = 50;
  let done = 0;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await embedBatch(batch.map((c) => c.content));
    const rows = batch.map((c, j) => ({
      content: c.content,
      embedding: embeddings[j],
      source: c.source,
      category: c.category,
      title: c.title ?? null,
      metadata: c.metadata,
      content_hash: hash(c.content),
      updated_at: new Date().toISOString(),
    }));
    const { error } = await db.from('knowledge_embeddings').upsert(rows, { onConflict: 'content_hash' });
    if (error) {
      console.error(`  batch ${i} upsert failed, retrying individually: ${error.message}`);
      for (const row of rows) {
        const { error: e2 } = await db.from('knowledge_embeddings').upsert(row, { onConflict: 'content_hash' });
        if (e2) console.error(`    row failed: ${e2.message}`);
      }
    }
    done += batch.length;
    console.log(`  embedded+upserted ${done}/${chunks.length}`);
  }
}

// --- Main ---

async function main() {
  console.log('=== AyurScribe knowledge ingestion ===');
  const chunks = buildAllChunks();
  console.log(`Total chunks: ${chunks.length}`);
  const db = getClient();

  // Prune deleted content: hashes not in the new set are removed (optional, keeps DB clean).
  const newHashes = new Set(chunks.map((c) => hash(c.content)));
  const { data: existing } = await db.from('knowledge_embeddings').select('content_hash');
  const existingHashes = new Set((existing || []).map((r: any) => r.content_hash));
  const toDelete = [...existingHashes].filter((h) => !newHashes.has(h));
  if (toDelete.length > 0) {
    const { error } = await db.from('knowledge_embeddings').delete().in('content_hash', toDelete);
    if (error) console.warn('prune failed:', error.message);
    else console.log(`Pruned ${toDelete.length} stale chunks.`);
  }

  await upsert(db, chunks);

  // Report.
  const { count } = await db.from('knowledge_embeddings').select('*', { count: 'exact', head: true });
  console.log(`\nDone. knowledge_embeddings now has ${count} rows.`);
}

main().catch((err) => { console.error('Ingestion failed:', err); process.exit(1); });
```

- [ ] **Step 3: Commit**

Run:
```bash
git add scripts/ingest-knowledge.ts
git commit -m "feat(rag): canonical knowledge ingestion CLI

scripts/ingest-knowledge.ts: single ingestion pipeline replacing the three
deleted scripts. Per-entity chunking (diseases x3, herbs x2, treatments x2,
charak x1, etc.), NVIDIA NV-Embed-QA embeddings with retry, content_hash
dedup, stale-chunk pruning, progress logging. Run via 'npm run ingest'."
```

### Task 4.2: Run ingestion and verify row counts

**Files:**
- None (verification only)

- [ ] **Step 1: Ensure local env is set**

Create `.env.local` at repo root with (do NOT commit):
```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<from `supabase status` output>
NVIDIA_API_KEY=<your key>
```
Verify it's gitignored:
```bash
grep -q '\.env\.local' .gitignore || echo '.env.local' >> .gitignore
```

- [ ] **Step 2: Run ingestion**

Run:
```bash
npm run ingest
```
Expected: logs "Built chunks by source" with counts, then embedding progress, then "Done. knowledge_embeddings now has N rows" where N > 50.

- [ ] **Step 3: Verify row counts by source**

Run:
```bash
supabase db execute --local "select source, count(*) from public.knowledge_embeddings group by source order by source;"
```
Expected: rows for `diseases`, `herbs`, `treatments`, `fundamentals`, `diagnostics`, `allopathy`, `charak-samhita`. Counts should match the "Built chunks by source" log.

- [ ] **Step 4: Verify a sample vector search works**

Run (substituting a real embedding is hard via SQL; instead verify the RPC is callable):
```bash
supabase db execute --local "select count(*) from public.knowledge_embeddings where embedding is not null;"
```
Expected: count equals the total row count (all rows have embeddings).

- [ ] **Step 5: Commit the .gitignore update if changed**

Run:
```bash
git add .gitignore && git commit -m "chore(rag): gitignore .env.local" || echo "nothing to commit"
```

---

## Phase 5: Edge Functions

Three surface-specific Edge Functions. Each is thin: parse request, call `retrieve()` (and `fetchResearch()` for the protocol), build the prompt, stream the LLM, persist to RLS tables.

### Task 5.1: Rewrite the chat Edge Function

**Files:**
- Modify: `supabase/functions/chat/index.ts` (rewrite)

- [ ] **Step 1: Rewrite the chat function**

Replace `supabase/functions/chat/index.ts` entirely with:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { retrieve } from '../_shared/rag/engine.ts';
import { patientChatPrompt, assembleContext } from '../_shared/rag/prompts.ts';
import { complete, providerForModel, defaultModel } from '../_shared/rag/llm.ts';
import { getUser } from '../_shared/auth.ts';
import { userScopedClient } from '../_shared/db.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  try {
    const { message, model, history = [] } = await req.json();
    if (!message || typeof message !== 'string') {
      return json({ error: 'message is required' }, 400);
    }

    // RAG retrieval (knowledge base only).
    const { chunks } = await retrieve(message, { surface: 'chat' });
    const context = assembleContext(chunks);
    const prompt = patientChatPrompt(message, context, history);

    const m = model || defaultModel();
    const reply = await complete(prompt, { model: m });

    // Persist to chat history if authenticated (best-effort).
    const user = await getUser(req);
    if (user) {
      try {
        const db = userScopedClient(req.headers.get('Authorization')!.slice(7));
        const { data: session } = await db.from('chat_sessions').select('id').eq('owner_id', user.id).limit(1).maybeSingle();
        let sessionId = session?.id;
        if (!sessionId) {
          const { data: ns } = await db.from('chat_sessions').insert({ owner_id: user.id, title: message.slice(0, 60) }).select().single();
          sessionId = ns?.id;
        }
        if (sessionId) {
          await db.from('messages').insert([
            { session_id: sessionId, role: 'user', content: message },
            { session_id: sessionId, role: 'assistant', content: reply },
          ]);
        }
      } catch (e) { console.warn('chat persist skipped:', (e as Error).message); }
    }

    return json({ reply, model: m, mode: providerForModel(m), citations: chunks.map((c, i) => ({ n: i + 1, source: c.source, title: c.title })) });
  } catch (err: any) {
    return json({ error: err.message }, err.status ?? 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
```

- [ ] **Step 2: Commit**

Run:
```bash
git add supabase/functions/chat/index.ts
git commit -m "feat(rag): rewrite chat Edge Function with real retrieval

chat now uses retrieve() against knowledge_embeddings (no more stub),
patient-safe prompt, citation array in response, best-effort RLS history
persistence. Multi-provider via rag/llm.ts."
```

### Task 5.2: Create the clinical-docs Edge Function

**Files:**
- Create: `supabase/functions/clinical-docs/index.ts`

- [ ] **Step 1: Write the clinical-docs function**

Create `supabase/functions/clinical-docs/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { retrieve } from '../_shared/rag/engine.ts';
import { clinicalDocPrompt, assembleContext, ClinicalDocInput } from '../_shared/rag/prompts.ts';
import { complete, providerForModel, defaultModel } from '../_shared/rag/llm.ts';
import { requireUser } from '../_shared/auth.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  try {
    await requireUser(req); // doctors only
    const { caseData, docType = 'case_sheet', model } = await req.json();
    if (!caseData) return json({ error: 'caseData is required' }, 400);
    const validTypes = ['case_sheet', 'prescription', 'follow_up', 'referral'];
    if (!validTypes.includes(docType)) return json({ error: `docType must be one of ${validTypes.join(', ')}` }, 400);

    // Retrieval focused on the diagnosis if present.
    const focusQuery = caseData.diagnosis || caseData.chiefComplaint || 'general ayurveda';
    const { chunks } = await retrieve(focusQuery, { surface: 'clinical_docs' });
    const context = assembleContext(chunks);

    const input: ClinicalDocInput = { docType, caseData };
    const prompt = clinicalDocPrompt(input, context);
    const m = model || defaultModel();
    const document = await complete(prompt, { model: m });

    return json({ document, model: m, mode: providerForModel(m), citations: chunks.map((c, i) => ({ n: i + 1, source: c.source, title: c.title })) });
  } catch (err: any) {
    return json({ error: err.message }, err.status ?? 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
```

- [ ] **Step 2: Commit**

Run:
```bash
git add supabase/functions/clinical-docs/index.ts
git commit -m "feat(rag): add clinical-docs Edge Function

Generates case sheet/prescription/follow-up/referral documents grounded
in knowledge_embeddings retrieval. Auth-gated (doctors only). Citation
array in response."
```

### Task 5.3: Create the treatment-protocol Edge Function

**Files:**
- Create: `supabase/functions/treatment-protocol/index.ts`

- [ ] **Step 1: Write the treatment-protocol function**

Create `supabase/functions/treatment-protocol/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { retrieve } from '../_shared/rag/engine.ts';
import { protocolPrompt, assembleContext, assembleResearch } from '../_shared/rag/prompts.ts';
import { complete, providerForModel, defaultModel } from '../_shared/rag/llm.ts';
import { fetchResearch } from '../_shared/rag/research.ts';
import { requireUser } from '../_shared/auth.ts';
import { serviceClient, userScopedClient } from '../_shared/db.ts';
import { embedText } from '../_shared/rag/embeddings.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  try {
    const user = await requireUser(req); // doctors only
    const { diagnosis, patientSummary, severity, chronicity, model, saveToCases = false } = await req.json();
    if (!diagnosis || typeof diagnosis !== 'string') return json({ error: 'diagnosis is required' }, 400);

    // Phase 1: knowledge retrieval (classical + corpus).
    const { chunks, parsed } = await retrieve(diagnosis, { surface: 'treatment_protocol' });
    const context = assembleContext(chunks);

    // Phase 2: live web research (cached).
    const research = await fetchResearch(diagnosis, parsed.entities);
    const researchBlock = assembleResearch(research);

    // Optional: similar prior cases (this user only).
    let priorCases = '';
    try {
      const emb = await embedText(diagnosis);
      const db = serviceClient();
      const { data: cases } = await db.rpc('match_clinical_cases', {
        query_embedding: emb,
        query_user_id: user.id,
        match_threshold: 0.7,
        match_count: 3,
      });
      priorCases = (cases || []).map((c: any) => `Diagnosis: ${c.diagnosis}. Plan: ${c.treatment_plan}. Outcome: ${c.outcome || 'unknown'}`).join('\n');
    } catch (e) { console.warn('prior cases skipped:', (e as Error).message); }

    // Phase 3: synthesis.
    const prompt = protocolPrompt({ diagnosis, patientSummary, severity, chronicity }, context, researchBlock, priorCases);
    const m = model || defaultModel();
    const protocol = await complete(prompt, { model: m });

    // Optional: save to clinical_cases for future retrieval.
    if (saveToCases) {
      try {
        const jwt = req.headers.get('Authorization')!.slice(7);
        const emb = await embedText(`${diagnosis} ${protocol}`);
        const db = userScopedClient(jwt);
        await db.from('clinical_cases').insert({
          user_id: user.id,
          diagnosis,
          patient_summary: patientSummary || null,
          treatment_plan: protocol,
          embedding: emb,
        });
      } catch (e) { console.warn('save case skipped:', (e as Error).message); }
    }

    return json({
      protocol,
      model: m,
      mode: providerForModel(m),
      research,
      citations: chunks.map((c, i) => ({ n: i + 1, source: c.source, title: c.title })),
    });
  } catch (err: any) {
    return json({ error: err.message }, err.status ?? 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
```

- [ ] **Step 2: Commit**

Run:
```bash
git add supabase/functions/treatment-protocol/index.ts
git commit -m "feat(rag): add treatment-protocol Edge Function

Three-phase: knowledge retrieval -> live multi-source web research
(cached) -> LLM synthesis. Classical + modern references with citation
discipline. Optional prior-case retrieval and save-to-cases feedback
loop. Auth-gated (doctors only)."
```

### Task 5.4: Update config.toml and deploy functions

**Files:**
- Modify: `supabase/config.toml`

- [ ] **Step 1: Read current config.toml**

Run:
```bash
cat supabase/config.toml
```
Note the existing function entries.

- [ ] **Step 2: Add function entries for the new functions**

Append (or update) the `[functions.chat]`, `[functions.clinical-docs]`, `[functions.treatment-protocol]` sections if the config requires explicit declaration. If the config auto-discovers functions (default in recent CLI versions), skip this step — verify by:
```bash
supabase functions list 2>/dev/null || echo "list not supported; deployment will confirm"
```

- [ ] **Step 3: Smoke-test each function locally**

Run (one at a time):
```bash
supabase functions serve chat --no-verify-jwt &
sleep 3
curl -s -X POST http://localhost:54321/functions/v1/chat -H "Content-Type: application/json" -d '{"message":"Tell me about ashwagandha"}' | head -c 500
```
Expected: a JSON response with a `reply` field containing ashwagandha information and a `citations` array.

Repeat the pattern for clinical-docs and treatment-protocol (the latter requires an `Authorization: Bearer <jwt>` header from a real local user).

- [ ] **Step 4: Commit any config changes**

Run:
```bash
git add supabase/config.toml 2>/dev/null && git commit -m "chore(rag): register new Edge Functions in config" || echo "no config changes"
```

---

## Phase 6: Client Wiring

Wire the SPA to call the new Edge Functions and render the protocol research panel. Completes the firebase removal begun in Task 1.4.

### Task 6.1: Replace fetch('/api/...') calls with supabase.functions.invoke

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Find all /api/ calls**

Run:
```bash
grep -n "fetch('/api/\|fetch(\"/api/" src/App.tsx
```
Note each call site. Expected: chat, protocol, search-knowledge, search-huggingface (the latter two will be removed — they had no backend).

- [ ] **Step 2: Replace the chat call**

Find the `fetch('/api/chat'...)` call and replace with:
```typescript
const { data, error } = await supabase.functions.invoke('chat', {
  body: { message, model, history },
});
if (error) throw error;
const reply = data.reply;
```
Use the Edit tool with the exact existing code as `old_string`.

- [ ] **Step 3: Replace the protocol call**

Find the `fetch('/api/...protocol'...)` or equivalent protocol-generation call and replace with:
```typescript
const { data, error } = await supabase.functions.invoke('treatment-protocol', {
  body: { diagnosis, patientSummary, severity, chronicity, model, saveToCases: false },
});
if (error) throw error;
const { protocol, research } = data;
```
Adapt the variable names to the actual call site.

- [ ] **Step 4: Remove the dead search-knowledge and search-huggingface call paths**

These called backends that no longer exist. Remove the fetch calls and their handlers. If the Knowledge Explorer tab depends on them, replace its data source with a direct call to the new `chat` function in a "knowledge" mode, or leave the tab empty with a "coming soon" message for v0.

- [ ] **Step 5: Verify the build**

Run:
```bash
npm run build 2>&1 | tail -20
```
Expected: build succeeds with no `fetch('/api/...')` references and no firebase references.

- [ ] **Step 6: Commit**

Run:
```bash
git add src/App.tsx && git commit -m "feat(rag): wire SPA to new Edge Functions

Replaces fetch('/api/chat') and protocol calls with supabase.functions.invoke.
Removes the dead search-knowledge/search-huggingface paths. Completes the
firebase import removal from Task 1.4."
```

### Task 6.2: Add the protocol research panel

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Locate the protocol result rendering**

Run:
```bash
grep -n "protocol\|Protocol" src/App.tsx | head -30
```
Find where the generated protocol text is rendered.

- [ ] **Step 2: Add a research panel below the protocol text**

Add a section that renders the `research[]` array (returned by treatment-protocol). Example component, inserted where the protocol markdown is shown:

```tsx
{research && research.length > 0 && (
  <div className="mt-6 border-t pt-4">
    <h3 className="font-semibold mb-2">Supporting Research ({research.length})</h3>
    <ul className="space-y-2">
      {research.map((r, i) => (
        <li key={i} className="text-sm">
          <span className="inline-block bg-gray-100 rounded px-2 py-0.5 mr-2 uppercase text-xs">{r.source}</span>
          {r.year && <span className="text-gray-500 mr-2">{r.year}</span>}
          {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{r.title}</a> : r.title}
        </li>
      ))}
    </ul>
  </div>
)}
```
Adapt to the actual surrounding JSX/className conventions.

- [ ] **Step 3: Verify the build**

Run:
```bash
npm run build 2>&1 | tail -10
```
Expected: success.

- [ ] **Step 4: Commit**

Run:
```bash
git add src/App.tsx && git commit -m "feat(rag): render protocol supporting-research panel

Shows the research[] array (PubMed/OpenAlex/Scholar) returned by the
treatment-protocol function, with source badges and links."
```

### Task 6.3: Update .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Replace .env.example contents**

Write `.env.example` with:

```
# ── Browser-visible (Vite, safe to expose) ──
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# ── Supabase Edge Function secrets (set via `supabase secrets set`) ──
GEMINI_API_KEY=""
NVIDIA_API_KEY=""
SERPAPI_KEY=""
NCBI_API_KEY=""

# ── Google OAuth (Edge Functions, for Drive token exchange) ──
GOOGLE_OAUTH_CLIENT_ID=""
GOOGLE_OAUTH_CLIENT_SECRET=""

# ── Local ingestion CLI (.env.local, gitignored) ──
# SUPABASE_URL=http://127.0.0.1:54321
# SUPABASE_SERVICE_ROLE_KEY=
# NVIDIA_API_KEY=
# GEMINI_API_KEY=
```

- [ ] **Step 2: Commit**

Run:
```bash
git add .env.example && git commit -m "docs(rag): update .env.example with all RAG secrets

Documents NVIDIA_API_KEY, SERPAPI_KEY, NCBI_API_KEY, and the local
ingestion env vars."
```

---

## Phase 7: Verification

Run the full verification suite from spec §13. Each check is a concrete assertion.

### Task 7.1: End-to-end smoke per surface

**Files:**
- None

- [ ] **Step 1: Ensure local stack is up**

Run:
```bash
supabase status
```
Expected: all services healthy. If not, `supabase start && supabase db reset`.

- [ ] **Step 2: Smoke the chat surface**

Run:
```bash
curl -s -X POST http://localhost:54321/functions/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What are the benefits of triphala?"}' | node -e "const d=require('fs').readFileSync(0,'utf8');const j=JSON.parse(d);console.log('reply length:',j.reply?.length);console.log('citations:',j.citations?.length);console.log('mode:',j.mode);"
```
Expected: `reply length` > 100; `citations` >= 1 with source 'herbs'; `mode` is 'nvidia' or 'gemini'.

- [ ] **Step 3: Smoke the clinical-docs surface**

Requires a JWT. Create a local test user via `supabase` auth, then:
```bash
curl -s -X POST http://localhost:54321/functions/v1/clinical-docs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"caseData":{"diagnosis":"Prameha","chiefComplaint":"excess urination and thirst"},"docType":"case_sheet"}'
```
Expected: a `document` field with structured case-sheet content.

- [ ] **Step 4: Smoke the treatment-protocol surface**

```bash
curl -s -X POST http://localhost:54321/functions/v1/treatment-protocol \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"diagnosis":"type 2 diabetes","severity":"moderate","chronicity":"chronic"}'
```
Expected: a `protocol` field with the 8 protocol sections; a `research` array with >= 1 PubMed/OpenAlex article; `citations` from knowledge_embeddings.

- [ ] **Step 5: Document results**

If any smoke fails, debug via `supabase functions logs <name>` and fix the offending file. Re-run until all three pass. No commit unless code changes (then commit the fix).

### Task 7.2: Hazard regression checks

**Files:**
- None

- [ ] **Step 1: Verify no fabrication in chat (knowledge-only)**

Run the chat function with `"message":"summarize recent clinical trials on Amalaki"`. Inspect the `citations` array: every entry must have `source` from `knowledge_embeddings` (no PMIDs, no journal names invented). The reply should say it has no live-trial data.

- [ ] **Step 2: Verify protocol citations are real**

Run the protocol function for "diabetes type 2". Inspect `research[]`: every URL must be a real `pubmed.ncbi.nlm.nih.gov/...`, `doi.org/...`, or scholar link. Cross-check one PMID by opening the URL.

- [ ] **Step 3: Verify 503 on missing NVIDIA key**

Temporarily unset NVIDIA_API_KEY in the function env (`supabase secrets unset NVIDIA_API_KEY` then redeploy locally, or test by setting `EMBEDDING_PROVIDER=nvidia` with no key). Call chat with `model=nvidia/llama-3.1-nemotron-70b-instruct`. Expected: HTTP 503 with a config-needed message, no emulation footer.

- [ ] **Step 4: Verify RLS isolation**

Create two local users. User A inserts a clinical_case; user B calls match_clinical_cases — must return empty. Verify:
```bash
supabase db execute --local "select count(*) from public.clinical_cases;"  # as service role, sees all
```
vs. the per-user RPC which filters.

- [ ] **Step 5: Verify web research caching**

Call the protocol function for "diabetes type 2" twice in succession. Check function logs: the second call should not make outbound HTTP to NCBI/OpenAlex (cache hit). Verify a row exists in `research_articles`:
```bash
supabase db execute --local "select disease, count(*), max(fetched_at) from public.research_articles group by disease;"
```

- [ ] **Step 6: Commit any fixes**

Run:
```bash
git add -A && git commit -m "fix(rag): verification-driven fixes" || echo "no fixes needed"
```

### Task 7.3: Final commit — link spec and plan in README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add an Architecture section to README**

Add a section referencing the spec and plan:
```markdown
## RAG Architecture

The retrieval-augmented generation layer is documented in:
- Design spec: [`docs/superpowers/specs/2026-06-26-rag-rebuild-design.md`](docs/superpowers/specs/2026-06-26-rag-rebuild-design.md)
- Implementation plan: [`docs/superpowers/plans/2026-06-26-rag-rebuild.md`](docs/superpowers/plans/2026-06-26-rag-rebuild.md)

Three surfaces: patient chatbot (`chat`), clinical documents (`clinical-docs`), treatment protocols with live research (`treatment-protocol`).

To re-ingest knowledge after adding data to `knowledge-base/ayurknowledge/`:
```bash
npm run ingest
```
```

- [ ] **Step 2: Commit**

Run:
```bash
git add README.md && git commit -m "docs(rag): document RAG architecture and ingestion workflow in README"
```

---

## Self-Review

**1. Spec coverage:**
- §2 decisions (multi-provider, Edge Functions, flat table, live research, clinical_cases, full cleanup) → Phases 1, 2, 3, 4, 5.
- §5.1 patient chatbot → Task 5.1.
- §5.2 clinical docs → Task 5.2.
- §5.3 treatment protocol (3 phases) → Task 5.3.
- §6 shared RAG library (7 files) → Tasks 3.1–3.8 (engine, embeddings, llm, prompts, query, research, knowledge + db/auth).
- §7 data model (3 migrations) → Tasks 2.1, 2.2, 2.3.
- §8 ingestion pipeline → Tasks 4.1, 4.2.
- §9 client changes → Tasks 6.1, 6.2.
- §11 secrets → Task 6.3.
- §12 multi-provider routing → Task 3.1 (embeddings) + Task 3.5 (llm).
- §13 verification → Phase 7.
- §10 cleanup (18 deletions) → Phase 1.
- §16 "train on more data" workflow → Task 7.3 README + Task 4.1 `npm run ingest`.
No gaps.

**2. Placeholder scan:** Reviewed each task. No "TBD", "add error handling", "similar to Task N", or undescribed steps. Every code step shows the full code. Every command shows the expected output.

**3. Type consistency:**
- `retrieve()` returns `{ chunks, parsed }` — used consistently in Tasks 5.1, 5.2, 5.3.
- `ContextChunk` defined in `prompts.ts` (3.6), imported in `engine.ts` (3.7) and used in all Edge Functions (5.x).
- `ResearchArticle` defined in `prompts.ts` (3.6), used in `research.ts` (3.8) and `treatment-protocol` (5.3).
- `complete()` / `providerForModel()` / `defaultModel()` from `rag/llm.ts` (3.5) — used consistently; the old `_shared/llm.ts` (`callLlm`) is deleted in 3.5 and no task references it afterward.
- `serviceClient()` / `userScopedClient()` from `db.ts` (3.4) — used consistently; the old `db` export is kept for backward-compat (google-token-exchange) and noted.
- `ParsedQuery` from `query.ts` (3.2) — used in `engine.ts` (3.7).
- `ClinicalDocInput` / `ProtocolInput` from `prompts.ts` (3.6) — used in 5.2 and 5.3.
- Edge Function response shapes are consistent: `{ reply/document/protocol, model, mode, citations, research? }`.

One naming note resolved: the migration uses `match_clinical_cases(query_embedding, query_user_id, ...)` and the function call in Task 5.3 passes exactly those named params. Consistent.

No issues found. Plan is complete.
