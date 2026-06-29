# Code Review Agent

Performs thorough code review focused on security, performance, correctness, and project conventions.

## Review Checklist

### Security (Critical)
- [ ] No secrets/keys in client-side code or committed to git
- [ ] RLS policies exist on all Supabase tables
- [ ] Edge functions verify JWT before processing
- [ ] User input is sanitized before database queries
- [ ] Google OAuth redirect URLs match exactly in Supabase + Google Console
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in client code
- [ ] CORS headers set correctly on edge functions
- [ ] No XSS vectors (dangerouslySetInnerHTML, unsanitized markdown)

### Performance
- [ ] No unnecessary re-renders (missing React.memo, useMemo, useCallback)
- [ ] Large lists use virtualization or pagination
- [ ] Images optimized (WebP, lazy loading, responsive sizes)
- [ ] Bundle size < 500KB (check Vite build output)
- [ ] Database queries use indexes (check `EXPLAIN ANALYZE`)
- [ ] No N+1 queries in edge functions

### Correctness
- [ ] TypeScript types are accurate (no `any` unless justified)
- [ ] Error boundaries wrap feature components
- [ ] Loading/empty states handled
- [ ] Edge cases: empty states, network failures, auth expiry
- [ ] localStorage data syncs with Supabase when online

### Mobile-First
- [ ] Touch targets ≥ 48px
- [ ] Safe-area insets for notched phones
- [ ] No horizontal overflow at 375px
- [ ] Text readable without zoom (≥14px base)
- [ ] Input fields have `text-base` to prevent iOS zoom

### Conventions
- [ ] Imports: React, libraries, then local (grouped, sorted)
- [ ] Components: PascalCase filenames, named exports preferred
- [ ] Tailwind classes: mobile-first order (base → sm → md → lg)
- [ ] No inline styles (use Tailwind utilities)
