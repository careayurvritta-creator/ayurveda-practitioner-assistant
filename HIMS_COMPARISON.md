# HIMS Module: HospitalRun vs AyurScribe Comparison

**Date:** 2026-06-24  
**Reference:** HospitalRun Frontend v2.0.0-alpha.7  
**Our Module:** AyurScribe HIMS (23 files, ~3,725 lines)

---

## Architecture Comparison

| Aspect | HospitalRun | AyurScribe HIMS |
|--------|-------------|-----------------|
| **State Management** | Redux Toolkit (slices) | React Context + `useLocalStorage` |
| **Persistence** | PouchDB (offline-first) → CouchDB sync | Browser localStorage |
| **UI Framework** | React Bootstrap | Tailwind CSS |
| **Routing** | React Router v5 | Lazy-loaded `<Routes>` in App.tsx |
| **i18n** | i18next (14 languages) | None (hardcoded English) |
| **Testing** | Jest + React Testing Library (unit + integration) | No tests |
| **Domain Modules** | Patients, Labs, Imagings, Medications, Incidents, Scheduling, Settings | Patients, OPD, Pharmacy, Billing |
| **Permissions** | Role-based `getPermissions()` utility | None (all features open) |
| **Offline Support** | PouchDB IndexedDB + CouchDB sync | localStorage only |

---

## Key Patterns from HospitalRun Worth Adopting

### 1. Redux Toolkit Slices (Instead of Context)
HospitalRun uses `createSlice` for each domain (patients, medications, labs, etc.). This provides:
- **Predictable state updates** via reducers
- **Built-in immutability** with Immer
- **Slice-level selectors** for derived data
- **Thunk middleware** for async operations (API calls, PouchDB)

**Our current approach:** React Context with `useLocalStorage` — works but no async support, no middleware, and context re-renders all consumers on any change.

### 2. PouchDB Offline-First (Instead of localStorage)
HospitalRun stores all data in PouchDB (IndexedDB wrapper), which:
- Works offline and syncs to CouchDB when online
- Supports complex queries via `pouchdb-find`
- Handles conflicts during concurrent edits
- Scales to thousands of records

**Our current approach:** `useLocalStorage` — fine for small data but:
- Limited to ~5MB per origin
- No query support (full array scan on every filter)
- No conflict resolution
- No offline sync capability

### 3. Role-Based Permissions
HospitalRun has a `getPermissions()` utility that checks user roles before allowing actions (e.g., only admins can delete patients).

**Our current approach:** No access control — any user can create, edit, delete everything.

### 4. i18n Internationalization
HospitalRun uses `react-i18next` with 14 language files. Translation keys are validated at build time via a custom script.

**Our current approach:** All strings hardcoded in English.

### 5. Test Infrastructure
HospitalRun has:
- Unit tests for each slice (reducer logic)
- Integration tests for page components
- `@testing-library/user-event` for user interaction simulation
- Coverage reporting via Coveralls
- Lint-staged runs tests before commit

**Our current approach:** Zero tests.

---

## Features HospitalRun Has That We Don't

| Feature | HospitalRun | AyurScribe HIMS |
|---------|-------------|-----------------|
| Lab Orders | ✅ Full workflow (create → complete → view) | ❌ Not implemented |
| Imaging Orders | ✅ X-ray, MRI, CT orders | ❌ Not implemented |
| Medications | ✅ With dosage, frequency, PRN, refill tracking | ✅ Basic dispensing |
| Incidents | ✅ Patient incident reporting | ❌ Not implemented |
| Scheduling | ✅ Appointments with calendar | ❌ Not implemented |
| Settings | ✅ Organization, user preferences | ❌ Not implemented |
| User Management | ✅ Login, roles, preferences | ❌ Not implemented |
| Export/CSV | ✅ `json2csv` for data export | ❌ Not implemented |
| Audit Trail | ✅ Created/modified by, timestamps | ❌ Not implemented |
| Search | ✅ PouchDB full-text search | ⚠️ Basic name/MRN filter |
| Dark Mode | ❌ Not implemented | ✅ Full dark mode support |
| Mobile-First | ❌ Desktop-focused | ✅ Responsive with bottom tabs |

---

## Features We Have That HospitalRun Doesn't

| Feature | AyurScribe HIMS | HospitalRun |
|---------|-----------------|-------------|
| Ayurveda Domain | ✅ Prakriti, Vikriti, Dosha types | ❌ General medicine |
| Treatment Plans | ✅ Nidana Parivarjana, Chikitsa | ❌ Not implemented |
| Therapy Categories | ✅ Abhyanga, Swedana, Panchakarma | ❌ Not implemented |
| Schedule of Charges | ✅ 52 procedures, 7 categories | ❌ Not implemented |
| Disease-Drug Lookup | ✅ 89 conditions with Ayurveda mappings | ❌ Not implemented |
| PWA Support | ✅ Service worker, manifest | ❌ Not implemented |
| Google OAuth | ✅ Via Supabase | ❌ PouchDB local only |
| AI Integration | ✅ NVIDIA NIM chat | ❌ Not implemented |
| Calendar Sync | ✅ Google Calendar API | ❌ Not implemented |
| Duplicate Detection | ✅ Phone + name matching | ❌ Not implemented |

---

## Our HIMS Module Structure

```
src/features/hims/
├── types/
│   └── index.ts              (137 lines) — HimsPatient, OpdVisit, Invoice, Medicine types
├── contexts/
│   ├── HimsPatientContext.tsx (153 lines) — Patient CRUD + search + duplicate check
│   ├── OpdContext.tsx         (133 lines) — Visit lifecycle + stats
│   ├── BillingContext.tsx     — Invoice management + revenue tracking
│   └── PharmacyContext.tsx    — Medicine inventory + low stock alerts
├── pages/
│   ├── HimsDashboard.tsx     (142 lines) — Stats cards, recent visits, low stock
│   ├── HimsOPD.tsx           (365 lines) — Visit list, filters, status management
│   ├── HimsPatients.tsx      — Patient list + search
│   ├── HimsPatientDetail.tsx — Patient detail + visit history
│   ├── HimsPharmacy.tsx      (162 lines) — Medicine list + search + category filter
│   └── HimsBilling.tsx       — Invoice list + revenue summary
├── components/
│   ├── CreateVisitModal.tsx   — New visit form
│   ├── PatientFormModal.tsx   — New/edit patient form
│   ├── QuickInvoiceModal.tsx  — Quick invoice from visit
│   ├── CreateInvoiceModal.tsx — Full invoice creation
│   ├── DispenseMedicineModal.tsx — Dispense from prescription
│   ├── AddMedicineModal.tsx   — Add medicine to inventory
│   └── CalendarSyncButton.tsx — Google Calendar integration
├── layout/
│   ├── HimsLayout.tsx        — Main HIMS layout wrapper
│   ├── HimsHeader.tsx        — Top header bar
│   ├── HimsSidebar.tsx       — Desktop sidebar nav
│   ├── HimsBottomTabs.tsx    — Mobile bottom tabs
│   └── HimsStatsCard.tsx     — Dashboard stat card
```

---

## Known Issues (25 Total)

### Critical (5)
1. **Undefined function references** in `query-engine.ts` — runtime crash
2. **Hardcoded NVIDIA API key** fallback in `server.ts`
3. **LRU cache deletes before returning** in `vector-rag.ts`
4. **Duplicate Supabase config** — `supabaseClient` defined in 2 files
5. **Stale cache in Supabase edge function** — no invalidation

### High (4)
1. No backend persistence — all data in localStorage
2. No edit/delete for invoices
3. No edit/delete for medicines (only delete)
4. No edit/delete for visits

### Medium (8)
- No export functionality
- No audit trail
- No role-based access control
- No search across all modules
- No pagination for large datasets
- No offline support
- No i18n
- No tests

### Low (8)
- Hardcoded doctor names
- No dark mode toggle persistence
- No print invoice
- No PDF generation
- No email/SMS notifications
- No batch operations
- No advanced analytics
- No integration with external labs

---

## Recommended Next Steps

### Priority 1: Fix Known Bugs
- [ ] Fix undefined function references in `query-engine.ts`
- [ ] Remove hardcoded NVIDIA API key fallback
- [ ] Fix LRU cache logic in `vector-rag.ts`
- [ ] Deduplicate Supabase config

### Priority 2: Add Backend Persistence
- [ ] Migrate from localStorage to Supabase tables
- [ ] Create `hims_patients`, `hims_visits`, `hims_invoices`, `hims_medicines` tables
- [ ] Add RLS policies for multi-tenant support
- [ ] Implement real-time subscriptions for live updates

### Priority 3: Enhance HIMS Module
- [ ] Add edit functionality for invoices, medicines, visits
- [ ] Add role-based access control
- [ ] Add audit trail (created_by, updated_at)
- [ ] Add CSV/Excel export
- [ ] Add pagination for large lists
- [ ] Add test coverage (unit + integration)

### Priority 4: New Features (from Excel Data Model)
- [ ] OPD Consultation Form with Ashtvidha/Dashvidha Pariksha
- [ ] IPD Case Paper and Treatment Plan
- [ ] Therapy Register with Schedule of Charges
- [ ] Disease-Drug Lookup integration
- [ ] WHO Ayurveda Terms mapping
- [ ] Discharge Summary template
- [ ] IRDAI Pre-Auth and Reimbursement forms
- [ ] Medical Certificate generation

---

## Summary

**AyurScribe HIMS is stronger in:** Ayurveda domain, mobile UX, PWA support, AI integration, calendar sync.

**HospitalRun is stronger in:** Offline persistence, test coverage, internationalization, role-based access, audit trail, data export.

**Key takeaway:** Our HIMS module is feature-rich for Ayurveda practice but lacks the production fundamentals that HospitalRun has (persistence, tests, permissions, export). The Excel data model provides a clear roadmap for the OPD/IPD/Therapy features we need to build.
