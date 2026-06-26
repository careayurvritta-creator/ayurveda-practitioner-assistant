# AyurScribe RAG Rebuild — Real Retrieval for Three Surfaces

**Date:** 2026-06-26
**Status:** Draft (pending implementation plan) — branch `migration/v0`.
**Owner:** user
**Repository root:** `E:/ayurveda-practitioner-assistant`
**Predecessor spec:** `2026-06-19-ayurscribe-v0-design.md` (which explicitly deferred real RAG to "a separate iteration"; this is that iteration).

## 1. Problem

The v0 migration shipped a clean auth + persistence layer but left the knowledge/RAG layer broken. An audit of the current `knowledge-base/` tree found eleven concrete defects:

1. **Three competing embedding pipelines** (`rag-pipeline.ts`, `chunking-pipeline.ts`, `embed-knowledge.ts`) target three different table schemas. There is no canonical ingestion path.
2. **Two competing migration `0003` files.** `0003_rag.sql` uses Chinese column names (`文档`, `文本块`, `研究文章`); `0003_rag_schema.sql` uses English names with a different table set. They cannot both apply.
3. **Vector search is a stub.** `semanticSearch()` in `ayurrag/vector-rag.ts` returns `{ data: [], error: null }`. Despite a working embedding client, no pgvector query ever runs at request time — all retrieval is in-memory substring matching.
4. **Edge Functions call RPCs that don't exist** in any migration (`match_knowledge_chunks`, `search_knowledge`, `search_research_articles`, `search_treatment_plans`).
5. **Six places define query expansion / intent detection** with overlapping, inconsistent logic: `rag-engine.ts`, `vector-rag.ts`, `query-engine.ts`, `llm-stream-utils.ts`, `ayurrag/index.ts`, and inline in `types.ts` SYSTEM_PROMPT.
6. **`input-learning.ts` uses a Proxy mock** for Supabase — clinical-case embeddings are generated and then discarded; nothing persists.
7. **Four of twelve knowledge sources are permanently empty** (`clinical-evidence`, `external-qa`, `modern-medicines`, `sushruta`) because the referenced `scripts/` ingestion directory was never written.
8. **`openai` package missing from `package.json`** but required by every embedding script.
9. **Syntax bugs:** stray Chinese characters in `web-research.ts:42` (`良好`) and `protocol/index.ts:38` (`兼ts`); invalid JS object-in-array syntax in `llm-stream-utils.ts:73` (`preemptive: 'vata vyadhi'`); property-name typo in `corpus.ts:11` (`anticancer_name`).
10. **`_shared/db.ts` uses the service-role key** inside request-time handlers, bypassing all RLS policies. The user-scoped client (`_shared/supabase.ts`) is never imported.
11. **`web-research.ts` and `chunking-pipeline.ts` reference Chinese table/column names** that match only the discarded `0003_rag.sql`.

**Goal:** replace this fragmented non-functional layer with a single, well-bounded RAG system that (a) ingests the full curated knowledge base into a real vector store, (b) retrieves reliably via hybrid search, and (c) serves three distinct product surfaces with surface-appropriate behavior — a patient chatbot, clinical-document generation for doctors, and treatment-protocol generation for doctors that includes live multi-source web research.

## 2. Decisions locked in this design

These were resolved through brainstorming with the user (2026-06-26). Each is a user-confirmed choice.

- **LLM provider:** multi-provider — NVIDIA NIM primary, Gemini fallback, OpenAI-compatible API configurable. Routing by env + per-request `model` field. If the chosen provider's key is unset, the function returns HTTP 503 with a clear config-needed message; **no silent cross-provider fallback** (consistent with the v0 hazard policy §3).
- **Embedding provider:** multi-provider — NVIDIA `NV-Embed-QA` (1024-dim) primary, Gemini `text-embedding-004` fallback. Dimension validated on every response.
- **API host:** Supabase Edge Functions (Deno runtime). No Vercel serverless functions for the RAG layer. (Ingestion is a Node CLI — see §6.)
- **Knowledge storage:** one **single flat `knowledge_embeddings` table** with `source` / `category` / `metadata` tags and an HNSW vector index. Replaces the competing structured-table schemas.
- **Web research:** **live multi-source search** (PubMed E-utilities + OpenAlex + Google Scholar via SerpAPI) during protocol generation, cached in a `research_articles` table with a 24h TTL.
- **Clinical learning:** a `clinical_cases` table stores doctor-submitted treatment plans with embeddings for future similarity retrieval. Seeded empty; populated through the protocol surface.
- **Strategy:** **full cleanup + rebuild** — delete dead/duplicated code, fix migrations, fix syntax bugs, then build the new RAG on a clean foundation. Not a parallel system.

## 3. Hazards removed by this work

Mapped to current-code defects, consistent with the v0 hazard policy (fix, don't preserve):

1. **Stub vector search.** `semanticSearch()` returning `[]` is deleted. The new `engine.ts` issues real `match_knowledge()` RPC calls against pgvector.
2. **Duplicate intent/expansion logic.** Six copies collapse into one: `_shared/rag/query.ts`.
3. **Three embedding pipelines.** Replaced by one canonical `scripts/ingest-knowledge.ts`.
4. **Two competing `0003` migrations.** Both deleted; one new `0003_rag_unified.sql` replaces them.
5. **Mock Supabase in `input-learning.ts`.** Deleted; the clinical-case feedback loop now writes through the real service-role client (server-side, ingestion-time only).
6. **Service-role key at request time.** Edge Functions use a user-scoped client built from the caller's JWT for user tables; the service-role client is used **only** for read-only retrieval from `knowledge_embeddings` / `research_articles` (global knowledge, no PII, no RLS).
7. **Syntax bugs (Chinese artifacts, invalid JS).** All deleted with the files that contain them.
8. **Missing `openai` dependency.** Added to `package.json`.

## 4. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Browser (React SPA, Vercel static)                          │
│  ┌──────────┐  ┌───────────────┐  ┌────────────────────┐     │
│  │ Patient   │  │ Clinical Doc  │  │ Treatment Protocol │     │
│  │ Chatbot   │  │ Generator     │  │ Generator          │     │
│  └────┬─────┘  └──────┬────────┘  └─────────┬──────────┘     │
│       └────────────────┼─────────────────────┘               │
│                        ▼                                     │
│          supabase.functions.invoke('chat' | 'clinical-docs'  │
│                 | 'treatment-protocol')                       │
└────────────────────────┬─────────────────────────────────────┘
                         │ JWT bearer
┌────────────────────────▼─────────────────────────────────────┐
│  Supabase Edge Functions (Deno)                              │
│                                                              │
│  ┌──────┐   ┌──────────────┐   ┌──────────────────┐         │
│  │ chat │   │ clinical-docs│   │treatment-protocol│         │
│  └──┬───┘   └──────┬───────┘   └────────┬─────────┘         │
│     └──────────────┼─────────────────────┘                  │
│                    ▼                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  _shared/rag/   (one unified library, all surfaces) │    │
│  │   engine · llm · embeddings · prompts · query ·     │    │
│  │   research · knowledge                              │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────▼───────────────────┐                 │
│  │  _shared/db.ts                          │                 │
│  │   userScopedClient(jwt) — RLS user data │                 │
│  │   serviceClient() — global KB reads     │                 │
│  └─────────────────────────────────────────┘                 │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│  Supabase PostgreSQL + pgvector                              │
│   knowledge_embeddings  (flat, HNSW, match_knowledge() RPC)  │
│   research_articles     (24h web-research cache)             │
│   clinical_cases        (doctor-submitted, RLS, HNSW)        │
│   patients, feedback_logs, chat_sessions, messages (RLS)     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Ingestion (Node CLI, server-side, not in request path)      │
│   scripts/ingest-knowledge.ts                                │
│     load ayurknowledge/* → chunk → embed (multi-provider) →  │
│     upsert knowledge_embeddings (content_hash dedup)         │
└──────────────────────────────────────────────────────────────┘
```

## 5. The three surfaces

### 5.1 Patient chatbot — `chat` Edge Function

**Audience:** common people. **Tone:** accessible, no jargon, explicitly informational.

Request:
```
POST /functions/v1/chat
  body: { message: string, model?: string, history?: Message[], context?: object }
  returns: { reply: string, mode: 'nvidia' | 'gemini', citations?: Citation[] }
```

Pipeline:
1. `classifyIntent(query)` → one of `herb | disease | treatment | diet | dosha | general` + named entities.
2. `expandQuery(query, intent)` → 3–5 variants (English + Sanskrit synonyms + medical terms).
3. Parallel: `vectorSearch(variants)` via `match_knowledge()` (top 15) **and** `keywordSearch(query)` against in-memory `AYURVEDA_KNOWLEDGE` (top 10).
4. `rerankAndMerge` → intent-aware boosts, dedup by content hash, source diversity (≤3 chunks/source).
5. Build prompt: 8k-token budget, numbered references with source labels, safety preamble.
6. Stream LLM response in `[CHAT]`-tagged format; store the turn in `messages` under RLS.

**Constraints:**
- No web research. No clinical-case retrieval. Knowledge base only.
- System prompt carries a hard "not a doctor; see a practitioner for diagnosis" preamble.
- Citations are chunk IDs + source labels from `knowledge_embeddings` only — no invented references (consistent with v0 §3 #3).

### 5.2 Clinical document generation — `clinical-docs` Edge Function

**Audience:** Ayurvedic doctors. **Input:** structured `CaseData`. **Output:** formatted clinical document.

Request:
```
POST /functions/v1/clinical-docs
  body: {
    caseData: CaseData,            // chief complaint, examination, prakriti, investigations
    docType: 'case_sheet' | 'prescription' | 'follow_up' | 'referral',
    model?: string,
    context?: object
  }
  returns: { document: string, mode: 'nvidia' | 'gemini', citations?: Citation[] }
```

Pipeline:
1. Expand around `caseData.diagnosis` + any named herbs/treatments.
2. Hybrid retrieval from `knowledge_embeddings` with category bias toward `disease`, `herb_monograph`, `treatment`, `allopathy_integration`.
3. **Optional** similarity retrieval from `clinical_cases` (same user only) for analogical reference — gated by a `usePriorCases` flag, default off in v0.
4. Build a `docType`-specific prompt template; LLM generates a SOAP-style Ayurvedic document with `[CHAT]` reasoning + `[OUTPUT]` formatted document.

**Constraints:**
- No web research (documents should be grounded in the curated corpus + the doctor's own input).
- Same citation-hygiene rule: only `knowledge_embeddings` IDs, never invented.

### 5.3 Treatment protocol generation — `treatment-protocol` Edge Function

**Audience:** Ayurvedic doctors. **Input:** provisional diagnosis + patient details. **Output:** extensive, evidence-based protocol with classical + modern references.

Request:
```
POST /functions/v1/treatment-protocol
  body: {
    diagnosis: string,             // provisional diagnosis
    patientSummary?: string,
    severity?: 'mild' | 'moderate' | 'severe',
    chronicity?: 'acute' | 'subacute' | 'chronic',
    model?: string,
    saveToCases?: boolean          // persist the generated case for future retrieval
  }
  returns: {
    protocol: string,              // full markdown protocol
    mode: 'nvidia' | 'gemini',
    research: ResearchArticle[],   // the papers cited
    citations?: Citation[]
  }
```

Pipeline (three phases):

**Phase 1 — Knowledge retrieval (grounding):**
- Deep vector search with diagnosis-specific expanded queries.
- Targeted fetch of Charak / Sushruta classical references (category filter `classical_text`).
- Optional `clinical_cases` similarity retrieval (gated by `usePriorCases`).

**Phase 2 — Live web research (parallel, cached):**
- Normalize the diagnosis to a search term.
- Check `research_articles` cache for the term; if any row is < 24h old, reuse the cached set.
- Otherwise fetch in parallel from:
  - **PubMed** via NCBI E-utilities (free, no key required; optional `NCBI_API_KEY` raises rate limit).
  - **OpenAlex** (free, no key).
  - **Google Scholar** via SerpAPI (requires `SERPAPI_KEY`; gracefully skipped if unset).
- Normalize to `{ title, abstract, source, url, year }`; upsert to `research_articles`.
- Promise.allSettled so a single source failing doesn't abort the protocol.

**Phase 3 — Synthesis:**
- Merge knowledge chunks + research abstracts into a structured prompt.
- LLM generates a protocol with these sections:
  - **Classical reference** — Sanskrit verse + translation + Charak/Sushruta location.
  - **Samprapti (pathogenesis)** — dosha/dushya/srotas analysis.
  - **Treatment approach** — Shodhana / Shamana / Rasayana plan.
  - **Herbal interventions** — herb, form, dosage, duration, anupana.
  - **Panchakarma** — procedures, sequence, duration, when indicated.
  - **Pathya-Apathya** — diet and regimen do/don't list.
  - **Modern evidence** — summary of retrieved research papers, each cited `[n]`.
  - **Expected outcomes + follow-up** — milestones, review schedule, red flags.
- Stream the protocol.

**Constraints:**
- Every modern-research claim maps to a real retrieved article; if no papers were retrieved for a claim, the protocol says so rather than inventing one.
- If `saveToCases`, embed the generated case and insert into `clinical_cases` with `user_id = auth.uid()`.

## 6. Shared RAG library — `_shared/rag/`

One library, seven focused files. Each is small and independently understandable.

| File | Responsibility | Depends on |
|------|----------------|------------|
| `engine.ts` | `retrieve(query, surface, options)` — single retrieval entry point. Orchestrates expand → parallel vector+keyword search → rerank → truncate to budget. | `query.ts`, `knowledge.ts`, `_shared/db.ts` |
| `embeddings.ts` | Multi-provider embedding client (NVIDIA primary, Gemini fallback). Dimension validation, retry with backoff, NaN/Inf detection. Replaces the duplicate logic in `embedding-client.ts`. | env, fetch |
| `llm.ts` | Multi-provider streaming LLM client (NVIDIA NIM, Gemini, OpenAI-compatible). Token counting, model routing, 503-on-missing-key. Replaces `_shared/llm.ts` and `llm-stream-utils.ts`. | env, fetch |
| `prompts.ts` | Surface-specific system prompts + prompt builders that assemble context + instructions. One source of truth replacing the prompts scattered across `rag-engine.ts`, `types.ts`, `query-engine.ts`. | — |
| `query.ts` | Single source of truth for intent classification, query expansion, Sanskrit synonym mapping, disease-concept map, complexity scoring. Replaces six duplicates. | `ayurknowledge/` |
| `research.ts` | Live web research: PubMed E-utilities, OpenAlex, SerpAPI Scholar. Parallel fetch, 24h cache in `research_articles`, result normalization. Replaces `web-research.ts`. | `_shared/db.ts`, env |
| `knowledge.ts` | In-memory access to `AYURVEDA_KNOWLEDGE`: keyword search fallback, entity extraction for query enhancement, classical-text lookup. | `ayurknowledge/` |

### Unified retrieval flow

```
retrieve(query, surface, options)
│
├─ 1. classifyIntent(query) → { intent, entities }
│
├─ 2. expandQuery(query, intent, entities) → variants[3..5]
│
├─ 3. parallel:
│  ├─ vectorSearch(variants, surface.categoryBias)
│  │     → match_knowledge() RPC × each variant
│  │     → cosine similarity ≥ threshold
│  │     → top-N per surface (chat: 15, docs: 20, protocol: 25)
│  │
│  └─ keywordSearch(query, entities)
│       → in-memory scan of AYURVEDA_KNOWLEDGE
│       → top-10 entity matches
│
├─ 4. rerankAndMerge
│    → intent-aware source/category boosting (per surface config)
│    → dedup by content hash
│    → source diversity cap (≤3 chunks per source)
│
├─ 5. [protocol only] webResearch(diagnosis)
│    → cache check (research_articles, 24h TTL)
│    → else parallel PubMed + OpenAlex + Scholar
│    → normalize + cache
│
└─ 6. buildContext(chunks, articles?, surface.budget)
     → truncate to token budget (chat 8k, docs 12k, protocol 16k)
     → numbered references with source labels
```

## 7. Data model

### `knowledge_embeddings` — single flat table

```sql
-- 0003_rag_unified.sql (replaces both prior 0003 files)
create extension if not exists vector;

create table if not exists public.knowledge_embeddings (
  id           uuid primary key default gen_random_uuid(),
  content      text not null,
  embedding    vector(1024),
  source       text not null,                  -- 'charak-samhita', 'herbs', 'diseases', ...
  category     text not null,                  -- 'classical_text', 'herb_monograph', 'disease', ...
  title        text,
  metadata     jsonb not null default '{}',    -- {chapter, verse, herb_name, disease_name, ...}
  content_hash text not null unique,           -- sha-256, for incremental upserts
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
```

**No RLS on this table** — it is global public knowledge, read by all surfaces via the service-role client. It contains no PII.

### `research_articles` — web-research cache

```sql
-- 0005_research_and_cases.sql
create table if not exists public.research_articles (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  abstract   text,
  source     text not null,          -- 'pubmed' | 'openalex' | 'scholar'
  url        text,
  disease    text not null,          -- normalized search term
  herbs      text[] not null default '{}',
  year       int,
  fetched_at timestamptz not null default now()
);

create index if not exists idx_ra_disease on public.research_articles(disease);
create index if not exists idx_ra_fetched on public.research_articles(fetched_at);
-- public cache; no RLS.
```

### `clinical_cases` — doctor-submitted cases (RLS)

```sql
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
create policy "cases: select own" on public.clinical_cases for select
  using (user_id = auth.uid());
create policy "cases: insert own" on public.clinical_cases for insert
  with check (user_id = auth.uid());
create policy "cases: update own" on public.clinical_cases for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cases: delete own" on public.clinical_cases for delete
  using (user_id = auth.uid());
```

Similarity search over `clinical_cases` is performed through a service-role RPC that filters by `user_id` before scoring — RLS alone cannot enforce "you see only your own neighbors" through vector operators, so the RPC hard-codes the user filter.

### `chat_sessions` / `messages` — conversation persistence (RLS)

Carried forward from v0's `patients.chats` JSONB but normalized so history can grow without row bloat. `chat_sessions.owner_id = auth.uid()`; `messages.session_id` cascades.

## 8. Ingestion pipeline — `scripts/ingest-knowledge.ts`

One canonical Node CLI. Replaces `rag-pipeline.ts`, `chunking-pipeline.ts`, `embed-knowledge.ts`. Run manually after knowledge edits; not in the request path.

```
scripts/ingest-knowledge.ts
│
├─ load all knowledge from ayurknowledge/ (12 modules)
│
├─ chunk (per-entity strategies):
│    diseases     → 3 chunks (samprapti | symptoms | treatment)
│    herbs        → 3 chunks (properties | clinical_uses | safety)
│    treatments   → 2 chunks (procedure | indications)
│    charak       → 1 chunk per chapter (full text)
│    fundamentals → 1 chunk per concept
│    diagnostics  → 1 chunk per method
│    default      → 600-char chunks, 100-char overlap
│
├─ embed (multi-provider):
│    primary:   NVIDIA NV-Embed-QA (1024-dim)
│    fallback:  Gemini text-embedding-004
│    validate:  dimension check, NaN/Inf, progressive-truncate fallback
│
├─ upsert knowledge_embeddings:
│    sha-256 content_hash dedup (skip unchanged)
│    batch upsert (100 rows), individual retry on failure
│
└─ report: total chunks, by source/category, skipped, errors
```

**Why Node, not Deno:** the CLI runs locally and benefits from the npm ecosystem (`openai`, `dotenv`). It uses `SUPABASE_SERVICE_ROLE_KEY` to write global knowledge. It never ships in the Edge Function bundle.

**Empty knowledge sources** (`clinical-evidence`, `external-qa`, `modern-medicines`, `sushruta`) are skipped with a warning until their data lands. The pipeline is idempotent and re-runnable — future data trains in by re-running `npm run ingest`.

## 9. Client changes (`src/App.tsx`)

Minimal in this iteration — the three surfaces already exist as tabs. The work is wiring, not redesign:

- Replace remaining `fetch('/api/...')` calls with `supabase.functions.invoke('chat' | 'clinical-docs' | 'treatment-protocol', { body })`.
- Remove the `./firebase` import (already a build breaker per v0 §10; completes that item).
- The protocol tab gains a **research panel** that renders the `research[]` array returned by the protocol function — title, source badge, year, link — alongside the generated protocol.
- No new tabs, no layout changes.

## 10. File tree (target state)

```
knowledge-base/
├── ayurknowledge/             (KEEP — all data files, solid)
├── types.ts                   (KEEP — update shared types)
├── seed-knowledge.ts          (KEEP — update for new schema if still used)
└── AYURVEDIC-KNOWLEDGE-BASE.md
scripts/
└── ingest-knowledge.ts        (NEW — canonical ingestion)
supabase/
├── functions/
│   ├── chat/index.ts                       (REWRITE — patient chatbot)
│   ├── clinical-docs/index.ts              (NEW)
│   ├── treatment-protocol/index.ts         (NEW)
│   ├── _shared/
│   │   ├── db.ts                           (REWRITE — dual client factory)
│   │   ├── auth.ts                         (NEW — JWT validation helper)
│   │   ├── rag/
│   │   │   ├── engine.ts                   (NEW)
│   │   │   ├── embeddings.ts               (NEW)
│   │   │   ├── llm.ts                      (REWRITE — multi-provider)
│   │   │   ├── prompts.ts                  (NEW)
│   │   │   ├── query.ts                    (NEW — single source of truth)
│   │   │   ├── research.ts                 (REWRITE — clean web research)
│   │   │   └── knowledge.ts                (NEW — in-memory KB access)
│   │   ├── google.ts                       (KEEP)
│   │   └── corpus.ts                       (DELETE — superseded by rag/knowledge.ts)
│   ├── google-token-exchange/index.ts      (KEEP)
│   └── _health/index.ts                    (KEEP)
├── migrations/
│   ├── 0001_init.sql                       (KEEP)
│   ├── 0002_rls.sql                        (KEEP)
│   ├── 0003_rag_unified.sql                (NEW — replaces both prior 0003s)
│   ├── 0004_chat_tables.sql                (NEW — chat_sessions, messages)
│   └── 0005_research_and_cases.sql         (NEW)
└── config.toml                             (KEEP)
.env.example                                (UPDATE — add NVIDIA_*, SERPAPI_KEY, NCBI_API_KEY)
package.json                                (UPDATE — add openai, dotenv)
```

### Deleted files (dead/duplicated/broken)

- `knowledge-base/rag-pipeline.ts`
- `knowledge-base/chunking-pipeline.ts`
- `knowledge-base/embed-knowledge.ts` (logic moves to `scripts/ingest-knowledge.ts`)
- `knowledge-base/ayurrag/vector-rag.ts`
- `knowledge-base/ayurrag/query-engine.ts`
- `knowledge-base/ayurrag/index.ts`
- `knowledge-base/input-learning.ts`
- `knowledge-base/rag-engine.ts` (logic moves to `_shared/rag/`)
- `knowledge-base/web-research.ts` (logic moves to `_shared/rag/research.ts`)
- `knowledge-base/embedding-client.ts` (logic moves to `_shared/rag/embeddings.ts`)
- `knowledge-base/llm-stream-utils.ts` (logic moves to `_shared/rag/llm.ts`)
- `supabase/migrations/0003_rag.sql`
- `supabase/migrations/0003_rag_schema.sql`
- `supabase/functions/_shared/corpus.ts`
- `supabase/functions/protocol/index.ts` (replaced by `treatment-protocol/`)
- `supabase/functions/knowledge/index.ts` (replaced by direct RAG retrieval; the module-list endpoint moves into `chat` if still needed)
- `supabase/functions/search/index.ts` (substring search superseded by real retrieval)
- `knowledge-base.zip` (untracked artifact at repo root)

## 11. Secrets

### Vercel project env (browser-visible)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase Edge Function secrets (`supabase secrets set`)
- `GEMINI_API_KEY`
- `NVIDIA_API_KEY` — required for NVIDIA models/embeddings; 503 with config-needed message if unset and an NVIDIA model is selected.
- `SERPAPI_KEY` — required for Google Scholar in protocol research; gracefully skipped if unset.
- `NCBI_API_KEY` — optional; raises PubMed rate limit.
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` (carried from v0).
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — auto-provisioned.

### Local ingestion (`.env.local`, gitignored)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_API_KEY`, `GEMINI_API_KEY`.

`.env.example` is updated to document all of the above with placeholder values.

## 12. Multi-provider routing

`llm.ts` and `embeddings.ts` route on the `model` / `provider` field:

| Provider prefix | Endpoint | Key env |
|-----------------|----------|---------|
| `nvidia/*` (e.g. `nvidia/llama-3.1-nemotron-70b-instruct`, `nvidia/nv-embedqa-e5-v5`) | `https://integrate.api.nvidia.com/v1` (OpenAI-compatible) | `NVIDIA_API_KEY` |
| `gemini/*` (e.g. `gemini-2.5-pro`, `text-embedding-004`) | Generative Language API | `GEMINI_API_KEY` |
| `openai-compatible/*` | configurable `LLM_BASE_URL` | `LLM_API_KEY` |

**Routing rules** (consistent with v0 hazard policy):
- If the requested provider's key is unset → HTTP 503 with `{ error: '<provider> not configured...' }`. No silent cross-provider fallback.
- A `defaultModel` env/config picks the provider when the client omits `model`.
- Invalid model IDs → HTTP 422 with "model not supported", listing valid IDs.

## 13. Verification

After implementation:

1. **Ingestion completeness.** `npm run ingest` reports chunk counts per source/category; `select source, count(*) from knowledge_embeddings group by 1` matches.
2. **Real retrieval assertion.** A query for "triphala benefits" returns ≥1 chunk with `source = 'herbs'` and similarity > 0.7. The stub-returning-`[]` behavior is gone.
3. **No fabrication regression** (carried from v0 §12 #1). A chat prompt asking for "recent clinical trials on Amalaki" must return only `knowledge_embeddings`-sourced citations; a protocol prompt for the same must return only real PubMed/OpenAlex/Scholar URLs from the `research[]` array.
4. **503 behavior.** With `NVIDIA_API_KEY` unset and `model=nvidia/...`, all three functions return HTTP 503 with the documented message; response body contains no emulation footer.
5. **RLS.** Two test users; cross-user reads on `clinical_cases`, `chat_sessions` rejected; global `knowledge_embeddings` readable by both.
6. **Web research caching.** A protocol request for "diabetes type 2" fetches from PubMed/OpenAlex; an immediate second request reuses the cache (no outbound HTTP to NCBI/OpenAlex).
7. **Smoke per surface:** chat (informational answer + citation), clinical-docs (formatted SOAP-style document), treatment-protocol (full protocol with research panel).
8. **Zero unhandled exceptions** in Supabase function logs for the smoke run.

## 14. Out of scope (follow-up)

- **Streaming under Edge Function timeout** — protocols may run long (research + synthesis). Flagged for a follow-up; v0 of this RAG returns complete responses. If timeouts bite, the protocol function can be split (research phase → synthesis phase) or moved to a longer-lived host.
- **Empty knowledge sources** — `clinical-evidence`, `external-qa`, `modern-medicines`, `sushruta` are skipped until data is provided. Their ingestion paths exist; only the data is missing.
- **Cross-user clinical-case sharing / anonymized learning pool** — v0 is per-user only.
- **Fine-tuning / model retraining** — the system is designed so that "training on more data" = re-running `npm run ingest` after adding `ayurknowledge/*.ts` files. Actual model fine-tuning is a separate effort.
- **Observability / Sentry / metrics** (carried from v0 §11 #4).

## 15. Order of operations (each step independently revertable)

1. **Cleanup pass** — delete the dead/duplicated/broken files listed in §10; remove the two `0003` migrations; remove the `./firebase` import; add `openai` + `dotenv` to `package.json`. Commit.
2. **Schema** — add migrations `0003_rag_unified.sql`, `0004_chat_tables.sql`, `0005_research_and_cases.sql`; apply locally.
3. **Shared RAG library** — `_shared/rag/{engine,embeddings,llm,prompts,query,research,knowledge}.ts`; `_shared/db.ts` dual-client; `_shared/auth.ts`.
4. **Ingestion CLI** — `scripts/ingest-knowledge.ts`; run it; verify row counts.
5. **Edge Functions** — implement `chat`, `clinical-docs`, `treatment-protocol`; smoke each via `supabase functions invoke`.
6. **Client wiring** — `App.tsx` `fetch('/api/...')` → `supabase.functions.invoke`; protocol research panel; remove Firebase import.
7. **End-to-end verification** per §13.

## 16. How "train on more data" works later

The user explicitly wants to add more data over time. The design makes this a routine, not a project:

1. Add or edit a file in `knowledge-base/ayurknowledge/` (e.g. a new `diseases-supplement.ts`, or more chapters in `charak.ts`).
2. Export it from `ayurknowledge/index.ts` into `AYURVEDA_KNOWLEDGE`.
3. Run `npm run ingest`. The `content_hash` dedup means unchanged chunks are skipped; only new/changed content is embedded and upserted.
4. All three surfaces immediately benefit — no code changes, no redeploy of Edge Functions (the data lives in pgvector, not in the function bundle).

This also means the `scripts/` ingestion directory the old code referenced but never wrote now actually exists and is the single entry point for all future data.
