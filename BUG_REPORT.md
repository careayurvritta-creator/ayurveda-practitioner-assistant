# Bug Report - Ayurvedic Practitioner Assistant

**Project:** AyurScribe - Ayurvedic Practitioner Assistant  
**Report Date:** 2025  
**Severity Legend:** 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low  

---

## 🔴 Critical Bugs

### 1. Undefined Function References (Runtime Crash)
**File:** `knowledge-base/ayurrag/query-engine.ts`  
**Lines:** ~180-200  
**Severity:** 🔴 Critical

**Description:**  
The functions `extractDrugFromQuery()` and `extractDrugClassFromQuery()` are called in the `generateAyurvedaResponse()` function but are never defined in the file. This will cause a `ReferenceError` at runtime when the drug interaction intent is triggered.

**Problematic Code:**
```typescript
case 'drug_interaction': {
  const herbName = analysis.entities[0] || extractDrugFromQuery(query)  // ❌ Undefined!
  const drugClass = extractDrugClassFromQuery(query)  // ❌ Undefined!
  response = checkDrugInteraction(herbName, drugClass)
  break
}
```

**Resolution:**
Either implement these helper functions or refactor to use the existing `analyzeQuery()` to extract entities:

```typescript
case 'drug_interaction': {
  const herbName = analysis.entities[0] || query.split(/[,+]/)[0].trim()
  const drugClass = analysis.entities[1] || 'General'
  response = checkDrugInteraction(herbName, drugClass)
  break
}
```

---

### 2. Hardcoded NVIDIA API Key Fallback
**File:** `server.ts`  
**Lines:** ~1000  
**Severity:** 🔴 Critical (Security)

**Description:**  
A fallback NVIDIA API key is hardcoded in the source code. If the environment variable is not set, this key is used, potentially exposing credentials.

**Problematic Code:**
```typescript
const nvidiaApiKey = process.env.NVIDIA_API_KEY || 'nvapi-...';  // ❌ Hardcoded fallback
```

**Resolution:**
Remove the fallback and throw a clear configuration error:

```typescript
const nvidiaApiKey = process.env.NVIDIA_API_KEY;
if (!nvidiaApiKey) {
  console.warn('NVIDIA_API_KEY not configured - NVIDIA NIM features disabled');
}
```

---

### 3. LRU Cache Deletes Before Returning
**File:** `knowledge-base/ayurrag/vector-rag.ts`  
**Lines:** ~100-120  
**Severity:** 🔴 Critical (Logic)

**Description:**  
The `getCachedResults()` function deletes the cache entry before returning it, completely defeating the caching mechanism. Every cache hit becomes a cache miss.

**Problematic Code:**
```typescript
function getCachedResults(cacheKey: string): VectorSearchResult[] | null {
  const cached = searchCache.get(cacheKey)
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    searchCache.delete(cacheKey)  // ✓ Correct - expired entry
    return null
  }
  searchCache.delete(cacheKey)  // ❌ BUG - deletes before returning!
  searchCache.set(cacheKey, cached)  // Re-sets but this is inefficient
  return cached.results
}
```

**Resolution:**
```typescript
function getCachedResults(cacheKey: string): VectorSearchResult[] | null {
  const cached = searchCache.get(cacheKey)
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    searchCache.delete(cacheKey)
    return null
  }
  // Move to end (most recently used) without deleting
  searchCache.delete(cacheKey)
  searchCache.set(cacheKey, cached)
  return cached.results
}
```

---

## 🟠 High Priority Bugs

### 4. Firebase initAuth() Logic Bug
**File:** `src/firebase.ts`  
**Lines:** ~30-45  
**Severity:** 🟠 High

**Description:**  
The `initAuth()` function has flawed logic. When a user is signed in but `cachedAccessToken` is null (which happens on page refresh before signIn completes), it incorrectly calls `onAuthFailure` instead of waiting for the token or triggering a re-authentication.

**Problematic Code:**
```typescript
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;  // ❌ Unnecessary assignment
        if (onAuthFailure) onAuthFailure();  // ❌ Called incorrectly!
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};
```

**Resolution:**
```typescript
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Try to get fresh token if cached one is missing
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else {
        try {
          const token = await user.getIdToken();
          cachedAccessToken = token;
          onAuthSuccess?.(user, token);
        } catch {
          onAuthFailure?.();
        }
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
};
```

---

### 5. Race Condition in NVIDIA Client Singleton
**File:** `server.ts`  
**Severity:** 🟠 High

**Description:**  
`getNvidiaClient()` is called in multiple async contexts without synchronization. The singleton initialization could race, creating multiple instances or using an uninitialized client.

**Resolution:**
```typescript
let nvidiaClient: OpenAI | null = null;
let nvidiaClientPromise: Promise<OpenAI> | null = null;

export function getNvidiaClient(): OpenAI {
  if (nvidiaClient) return nvidiaClient;
  
  if (!nvidiaClientPromise) {
    nvidiaClientPromise = (async () => {
      const apiKey = process.env.NVIDIA_API_KEY;
      if (!apiKey) throw new Error('NVIDIA_API_KEY not configured');
      
      nvidiaClient = new OpenAI({
        apiKey,
        baseURL: 'https://integrate.api.nvidia.com/v1'
      });
      return nvidiaClient;
    })();
  }
  
  throw nvidiaClientPromise; // Signal that initialization is in progress
}

// Wrapper to handle the async initialization
export async function getNvidiaClientAsync(): Promise<OpenAI> {
  const client = getNvidiaClient();
  if (client) return client;
  
  try {
    return await nvidiaClientPromise!;
  } catch (e) {
    if (e instanceof Error && e.message.includes('NVIDIA_API_KEY')) throw e;
    return await nvidiaClientPromise!;
  }
}
```

---

### 6. useEffect Missing Dependencies
**File:** `src/App.tsx`  
**Lines:** ~700-780  
**Severity:** 🟠 High

**Description:**  
The Google Drive loading effect calls `loadGoogleDriveFiles()` but doesn't include it in the dependency array. This can cause stale closure issues and inconsistent behavior.

**Problematic Code:**
```typescript
useEffect(() => {
  if (firebaseUser) {
    // ... setup code ...
    loadGoogleDriveFiles();  // ❌ Not in dependency array
    // ...
  }
}, [firebaseUser, googleAccessToken]);  // Missing loadGoogleDriveFiles
```

**Resolution:**
```typescript
// Define the function with useCallback
const loadGoogleDriveFiles = useCallback(async () => {
  if (!googleAccessToken) return;
  setDriveFilesLoading(true);
  try {
    const res = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=...",
      { headers: { Authorization: `Bearer ${googleAccessToken}` } }
    );
    if (res.ok) {
      const data = await res.json();
      setDriveFiles(data.files || []);
    }
  } finally {
    setDriveFilesLoading(false);
  }
}, [googleAccessToken]);

useEffect(() => {
  if (firebaseUser) {
    loadGoogleDriveFiles();
  }
}, [firebaseUser, loadGoogleDriveFiles]);
```

---

### 7. XSS Vulnerability - Unsanitized User Input
**File:** `src/App.tsx`  
**Severity:** 🟠 High (Security)

**Description:**  
Patient notes, chat messages, and other user-generated content are rendered without sanitization. Malicious scripts could be injected via patient data.

**Resolution:**
Create a sanitization utility and apply it before rendering:

```typescript
// utils/sanitize.ts
export function sanitizeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;'
  };
  return input.replace(/[&<>"']/g, m => map[m]);
}

// In components, sanitize before display
const displayNotes = sanitizeHtml(patient.notes || '');
```

---

## 🟡 Medium Priority Bugs

### 8. Inefficient JSON.stringify for Array Check
**File:** `server.ts`  
**Lines:** ~50-60  
**Severity:** 🔵 Low (Performance)

**Description:**  
Uses `JSON.stringify(logs)` to check if logs exist. Should use `Array.isArray()` directly.

**Problematic Code:**
```typescript
if (logs && Array.isArray(logs) && logs.length > 0) {
  // But logs is already validated as array, JSON.stringify is unnecessary
```

**Resolution:**
```typescript
if (Array.isArray(logs) && logs.length > 0) {
```

---

### 9. NVIDIA Diagnostic Check on Every Boot
**File:** `server.ts`  
**Lines:** ~1180-1195  
**Severity:** 🔵 Low (Reliability)

**Description:**  
The diagnostic check runs on every server boot and logs errors to console. If NVIDIA API is down, this creates noisy logs and could mask real startup issues.

**Resolution:**
```typescript
// Only run diagnostic in development or when explicitly enabled
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_NVIDIA_DIAGNOSTIC === 'true') {
  (async () => {
    try {
      console.log("--- Diagnostic Check: Testing NVIDIA NIM connection ---");
      const openai = getNvidiaClient();
      const list = await openai.models.list();
      console.log("NVIDIA NIM Connection Successful!");
    } catch (err: any) {
      console.debug("NVIDIA NIM Diagnostic (non-critical):", err.message);
    }
  })();
}
```

---

### 10. Inconsistent Error Handling
**File:** `server.ts` (multiple endpoints)  
**Severity:** 🟡 Medium

**Description:**  
Some endpoints have specific error messages, others use generic ones. Error responses are not standardized.

**Resolution:**
Create a standardized error handler:

```typescript
// utils/errorHandler.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown, res: express.Response) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code
    });
  }
  console.error('Unexpected error:', error);
  return res.status(500).json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR'
  });
}
```

---

### 11. Missing Request Validation
**File:** `server.ts` (API endpoints)  
**Severity:** 🟡 Medium

**Description:**  
API endpoints don't validate required fields or data types in request bodies.

**Resolution:**
```typescript
import { z } from 'zod';

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  model: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() }))
  })).optional()
});

app.post('/api/chat', async (req, res) => {
  const validation = ChatRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.message });
  }
  // proceed with validated data
});
```

---

### 12. Type Safety - Widespread `any` Types
**Files:** Multiple  
**Severity:** 🟡 Medium

**Description:**  
Extensive use of `any` types reduces TypeScript's type safety benefits.

**Resolution:**
Define proper interfaces:

```typescript
// types/api.ts
export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  parts: Array<{ text: string }>;
  timestamp?: string;
}

export interface PatientProfile {
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  prakriti: 'Vata' | 'Pitta' | 'Kapha' | 'Vata-Pitta' | 'Pitta-Kapha' | 'Vata-Kapha' | 'Tridoshic';
  agni: string;
  koshta: string;
  lifestyle: string;
  season: string;
}

export interface ProtocolRequest {
  patientProfile: PatientProfile;
  principalImbalance: string;
  chiefComplaint: string;
  model?: string;
}
```

---

### 13. Cache TTL Not Refreshed on Access
**File:** `knowledge-base/ayurrag/vector-rag.ts`  
**Lines:** ~100-130  
**Severity:** 🔵 Low (Performance)

**Description:**  
When cache entries are accessed via `getCachedResults()`, the TTL is not properly refreshed. The current implementation deletes and re-sets, but this is inefficient and the TTL calculation may not work as intended.

**Resolution:**
```typescript
function getCachedResults(cacheKey: string): VectorSearchResult[] | null {
  const cached = searchCache.get(cacheKey);
  if (!cached) return null;
  
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL_MS) {
    searchCache.delete(cacheKey);
    return null;
  }
  
  // Refresh TTL by re-inserting (LRU update)
  searchCache.delete(cacheKey);
  searchCache.set(cacheKey, { results: cached.results, timestamp: Date.now() });
  
  return cached.results;
}
```

---

### 14. Potential Null Pointer in Protocol Generation
**File:** `src/App.tsx`  
**Severity:** 🔵 Low

**Description:**  
`protocolImbalance || activePatient.vikriti` could result in `undefined` if both are empty strings.

**Resolution:**
```typescript
const effectiveImbalance = protocolImbalance || activePatient?.vikriti || 'Doshic Imbalance';
```

---

### 15. Missing CORS Configuration
**File:** `server.ts`  
**Severity:** 🟡 Medium (Security/Functionality)

**Description:**  
No CORS middleware is configured, which could cause issues when the frontend calls APIs from different origins in production.

**Resolution:**
```typescript
import cors from 'cors';

const corsOptions: cors.CorsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') 
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

---

## 🔵 Low Priority / Code Quality

### 16. Inefficient Patient State Updates
**File:** `src/App.tsx`  
**Severity:** 🔵 Low (Performance)

**Description:**  
Multiple `patients.map()` calls create new arrays unnecessarily. Could be optimized with a single update.

**Resolution:**
```typescript
const updatePatient = (patientId: string, updater: (p: Patient) => Patient) => {
  setPatients(prev => prev.map(p => p.id === patientId ? updater(p) : p));
};
```

---

### 17. Unused Variable in embed-knowledge.ts
**File:** `knowledge-base/embed-knowledge.ts`  
**Severity:** 🔵 Low

**Description:**  
The `truncate()` function is defined but never used.

**Resolution:**
Either use it or remove:
```typescript
// If not needed, remove
// If needed, use it in chunk processing
```

---

### 18. Missing Error Boundaries in React
**File:** `src/App.tsx`  
**Severity:** 🔵 Low (Robustness)

**Description:**  
No React error boundaries are defined. Uncaught errors will crash the entire application.

**Resolution:**
```typescript
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App Error:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return <div className="error-fallback">Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

// Wrap App
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## New Bugs Found (2026)

### 19. Undefined Variable Reference (Runtime Crash)
**File:** `supabase/functions/_shared/auth.ts:11`  
**Severity:** 🔴 Critical

**Description:**  
The `userScopedClient()` function references `SUPABASE_ANON_KEY` which is never declared in this file. Only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are declared at lines 3-4. This will cause a `ReferenceError` at runtime when any edge function uses `userScopedClient()`.

**Problematic Code:**
```typescript
export function userScopedClient(jwt: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {  // ❌ SUPABASE_ANON_KEY is undefined!
```

**Resolution:**
```typescript
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

export function userScopedClient(jwt: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
```

---

### 20. Weak JWT Verification (Security)
**File:** `supabase/functions/_shared/db.ts:18-24`  
**Severity:** 🔴 Critical (Security)

**Description:**  
The `authUid()` function decodes JWT payload via `atob()` + `JSON.parse()` without verifying the signature. Any client can forge a JWT with any `sub` claim. Edge functions like `chat/index.ts:36-38` rely solely on this for authorization.

**Problematic Code:**
```typescript
export function authUid(jwt: string): string | null {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));  // ❌ No signature verification!
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
```

**Resolution:** Use Supabase's built-in JWT verification:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function verifyJwt(jwt: string): Promise<string | null> {
  const client = serviceRoleClient();
  const { data: { user }, error } = await client.auth.getUser(jwt);
  if (error || !user) return null;
  return user.id;
}
```

---

### 21. Incorrect rank_fields Parameter
**File:** `supabase/functions/_shared/reranker.ts:45`  
**Severity:** 🟡 Medium

**Description:**  
The Cohere Rerank API `rank_fields` parameter is only used when documents are objects with named fields. Here documents are plain strings (line 28-31 maps chunks to strings), so `rank_fields: ['text']` is semantically wrong.

**Problematic Code:**
```typescript
body: JSON.stringify({
  model,
  query,
  documents,
  top_n: topN,
  rank_fields: ['text'],  // ❌ Documents are strings, not objects
  return_documents: false,
}),
```

**Resolution:** Remove `rank_fields` since documents are strings:
```typescript
body: JSON.stringify({
  model,
  query,
  documents,
  top_n: topN,
  return_documents: false,
}),
```

---

### 22. Leading Space in Keyword Prevents Matching
**File:** `supabase/functions/_shared/rag/query.ts:13`  
**Severity:** 🟡 Medium

**Description:**  
The `disease` array contains `' disorder'` with a leading space. The `classifyIntent()` function uses `lower.includes(k)`, so this keyword will never match unless the user's query has a space before "disorder" (e.g., "a disorder" would match, but "disorder" alone would not).

**Problematic Code:**
```typescript
disease: ['disease', 'vyadhi', ' disorder', 'condition', ...],  // ❌ Leading space
```

**Resolution:** Remove the leading space:
```typescript
disease: ['disease', 'vyadhi', 'disorder', 'condition', ...],
```

Also note: `'syndrome'` appears twice in this array (duplicate entry).

---

### 23. Missing CORS Headers
**File:** `supabase/functions/google-token-exchange/index.ts`  
**Severity:** 🟡 Medium (Functionality)

**Description:**  
Unlike `chat/index.ts`, `treatment-protocol/index.ts`, and `clinical-docs/index.ts` which all define CORS headers, this function has no CORS headers. Browser preflight requests will fail.

**Problematic Code:**
```typescript
serve(async (req: Request) => {
  // ❌ No CORS headers defined
  try {
    const { refresh_token } = await req.json();
```

**Resolution:**
```typescript
const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  // ...
```

---

### 24. Undefined Error in collectStream
**File:** `supabase/functions/chat/index.ts:18`, `treatment-protocol/index.ts:18`, `clinical-docs/index.ts:17`  
**Severity:** 🔵 Low

**Description:**  
When `part.type === 'error'`, `part.error` could be `undefined` (since `error` is optional in the type), resulting in string `"[Error: undefined]"` being appended to the response.

**Problematic Code:**
```typescript
if (part.type === 'error') result += `\n\n[Error: ${part.error}]`;  // ❌ part.error may be undefined
```

**Resolution:**
```typescript
if (part.type === 'error') result += `\n\n[Error: ${part.error ?? 'Unknown error'}]`;
```

---

### 25. Duplicated collectStream Implementation
**Files:** `chat/index.ts:14-21`, `treatment-protocol/index.ts:14-21`, `clinical-docs/index.ts:13-20`  
**Severity:** 🔵 Low (Code Quality)

**Description:**  
The `collectStream()` function is copy-pasted identically across three edge functions. This violates DRY and makes maintenance error-prone.

**Resolution:** Move to a shared utility:
```typescript
// _shared/stream-utils.ts
export async function collectStream(gen: AsyncGenerator<{ type: string; content?: string; error?: string }>): Promise<string> {
  let result = '';
  for await (const part of gen) {
    if (part.type === 'content' && part.content) result += part.content;
    if (part.type === 'error') result += `\n\n[Error: ${part.error ?? 'Unknown error'}]`;
  }
  return result;
}
```

---

## Summary Table

| # | Bug | File | Severity | Status |
|---|-----|------|----------|--------|
| 1 | Undefined functions | query-engine.ts | 🔴 Critical | Needs Fix |
| 2 | Hardcoded API key | server.ts | 🔴 Critical | Needs Fix |
| 3 | LRU cache deletes before return | vector-rag.ts | 🔴 Critical | Needs Fix |
| 4 | Firebase initAuth logic | firebase.ts | 🟠 High | Needs Fix |
| 5 | Race condition (NVIDIA) | server.ts | 🟠 High | Needs Fix |
| 6 | useEffect missing deps | App.tsx | 🟠 High | Needs Fix |
| 7 | XSS vulnerability | App.tsx | 🟠 High | Needs Fix |
| 8 | JSON.stringify inefficiency | server.ts | 🔵 Low | Optional |
| 9 | NVIDIA diagnostic noise | server.ts | 🔵 Low | Optional |
| 10 | Inconsistent error handling | server.ts | 🟡 Medium | Recommended |
| 11 | Missing request validation | server.ts | 🟡 Medium | Recommended |
| 12 | Type safety (any types) | Multiple | 🟡 Medium | Technical Debt |
| 13 | Cache TTL refresh | vector-rag.ts | 🔵 Low | Optional |
| 14 | Null pointer risk | App.tsx | 🔵 Low | Optional |
| 15 | Missing CORS | server.ts | 🟡 Medium | Recommended |
| 16 | Inefficient state updates | App.tsx | 🔵 Low | Optional |
| 17 | Unused function | embed-knowledge.ts | 🔵 Low | Cleanup |
| 18 | Missing error boundaries | App.tsx | 🔵 Low | Recommended |
| 19 | Undefined SUPABASE_ANON_KEY | auth.ts:11 | 🔴 Critical | Needs Fix |
| 20 | Weak JWT verification (no signature check) | db.ts:18-24 | 🔴 Critical | Needs Fix |
| 21 | Incorrect rank_fields with string docs | reranker.ts:45 | 🟡 Medium | Needs Fix |
| 22 | Leading space in keyword prevents matching | query.ts:13 | 🟡 Medium | Needs Fix |
| 23 | Missing CORS headers | google-token-exchange/index.ts | 🟡 Medium | Needs Fix |
| 24 | Undefined error in collectStream | chat/index.ts:18 | 🔵 Low | Optional |
| 25 | Duplicated collectStream | chat/treatment-protocol/clinical-docs | 🔵 Low | Cleanup |

---

## Recommended Priority Actions

1. **Immediate (Critical):** Fix bugs #1, #2, #3, #19, #20 - These cause runtime crashes or security vulnerabilities
2. **High Priority:** Fix bugs #4, #5, #6, #7 - These affect core functionality and security
3. **Medium Priority:** Address bugs #10, #11, #15, #21, #22, #23 - These improve reliability and production readiness
4. **Technical Debt:** Plan to address bug #12 (type safety) in future refactoring sprint