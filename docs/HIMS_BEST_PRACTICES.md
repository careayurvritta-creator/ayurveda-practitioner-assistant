# Hospital Information Management System (HIMS) — Best Practices & Reference
## For Ayurveda Practitioner Assistant (5-Bed Clinic)

> **Purpose**: This document serves as the authoritative reference for building, modifying,
> and extending the HIMS module of AyurGPT. Read this BEFORE writing any HIMS code.
> Every architectural decision, data model, UI pattern, and error-prevention strategy used
> in this codebase is documented here with rationale.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Data Model & Type System](#2-data-model--type-system)
3. [Module: Patient Registration](#3-module-patient-registration)
4. [Module: OPD (Outpatient Department)](#4-module-opd-outpatient-department)
5. [Module: IPD (Inpatient Department)](#5-module-ipd-inpatient-department)
6. [Module: Billing & Revenue Cycle](#6-module-billing--revenue-cycle)
7. [Module: Pharmacy & Inventory](#7-module-pharmacy--inventory)
8. [Module: Clinical Documentation (EMR)](#8-module-clinical-documentation-emr)
9. [Module: Appointments & Queue Management](#9-module-appointments--queue-management)
10. [Module: Laboratory & Diagnostics](#10-module-laboratory--diagnostics)
11. [Module: Reporting & Analytics](#11-module-reporting--analytics)
12. [Ayurveda-Specific Clinical Workflows](#12-ayurveda-specific-clinical-workflows)
13. [Ayurveda Prescription Standards](#13-ayurveda-prescription-standards)
14. [Panchakarma Therapy Management](#14-panchakarma-therapy-management)
15. [Billing Patterns & GST Compliance](#15-billing-patterns--gst-compliance)
16. [Pharmacy Inventory Patterns](#16-pharmacy-inventory-patterns)
17. [UI/UX Patterns for Healthcare](#17-uiux-patterns-for-healthcare)
18. [State Management Patterns](#18-state-management-patterns)
19. [Error Prevention & Common Pitfalls](#19-error-prevention--common-pitfalls)
20. [Security & Data Privacy](#20-security--data-privacy)
21. [Performance & Optimization](#21-performance--optimization)
22. [Testing Strategies](#22-testing-strategies)
23. [Deployment & DevOps](#23-deployment--devops)
24. [Code Review Checklist](#24-code-review-checklist)
25. [Reference Implementations](#25-reference-implementations)
26. [Glossary](#26-glossary)

---

## 1. System Architecture

### 1.1 Architectural Pattern: Modular Monolith

For a small clinic (5 beds, 5 OPD chambers, 4 doctors), a **modular monolith** is the correct
architecture. Do NOT use microservices — the operational complexity is not justified.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                    │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  AyurGPT │  │   HIMS   │  │  Shared  │  │  Selection    │  │
│  │  (AI Chat)│  │  (Clinic)│  │  (Auth)  │  │  Page (/)     │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Context Providers                      │   │
│  │  Auth · HimsPatient · Opd · Billing · Pharmacy          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Storage Layer                          │   │
│  │  localStorage (MVP) → Supabase PostgreSQL (Production)  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Why Modular Monolith for Small Clinics

| Pattern | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Monolith** | Simple, fast to build | Tight coupling, hard to scale | Too simple |
| **Microservices** | Independent scaling, deployment | Operational complexity, network latency | Too complex |
| **Modular Monolith** | Clean boundaries, single deploy, easy refactor | Requires discipline | **Correct choice** |

**Reference**: "For a new HMS build in 2026, our recommendation is a modular monolith for
hospitals under 200 beds, a single application with clear module boundaries that can be
decomposed into microservices when scale requires it." — AcquaintSofttech HMS Guide 2026

### 1.3 Module Boundaries

Each HIMS module must be a self-contained directory with its own:
- Types (`types/index.ts`)
- Context/State (`contexts/`)
- Components (`components/`)
- Pages (`pages/`)
- Utils (if any)

**Rule**: Modules communicate through shared types and context APIs, NOT by importing
internal components from other modules.

```
features/hims/
├── types/          # Shared type definitions
├── contexts/       # React Context providers
├── components/     # Reusable modal/form components
├── layout/         # Shell, sidebar, header, bottom tabs
├── pages/          # Route-level page components
└── utils/          # Shared utility functions (if any)
```

### 1.4 Data Flow Architecture

```
User Action → Component → Context Method → localStorage/Supabase → State Update → Re-render
```

**Critical Rule**: All mutations go through context methods. Never modify state directly
in components. Never read/write localStorage directly from components.

### 1.5 Route Structure

```
/                           → SelectionPage (AyurGPT vs HIMS)
/ayurgpt/chat               → AI Chat
/ayurgpt/knowledge          → Knowledge base
/ayurgpt/protocols          → Treatment protocols
/hims/dashboard             → HIMS Dashboard
/hims/patients              → Patient list
/hims/patients/:id          → Patient detail
/hims/opd                   → OPD queue
/hims/billing               → Billing dashboard
/hims/pharmacy              → Pharmacy inventory
```

---

## 2. Data Model & Type System

### 2.1 Core Entity Relationships

```
HimsPatient (1) ──── (many) OpdVisit
OpdVisit   (1) ──── (many) PrescriptionItem
OpdVisit   (1) ──── (0..1) Invoice
Invoice    (1) ──── (many) InvoiceItem
HimsPatient (1) ──── (many) Invoice
HimsPatient (1) ──── (many) DispensingRecord
Medicine   (1) ──── (many) DispensingRecord
OpdVisit   (1) ──── (many) DispensingRecord
```

### 2.2 ID Generation Rules

Every entity must use a prefixed, unique ID format:

| Entity | Prefix | Format | Example |
|--------|--------|--------|---------|
| Patient | `hpat_` | `hpat_{timestamp}_{random6}` | `hpat_1719876543_a3f2k1` |
| Visit | `vst_` | `vst_{timestamp}_{random6}` | `vst_1719876543_b7c4d2` |
| Invoice | `inv_` | `inv_{timestamp}_{random6}` | `inv_1719876543_e9f0g3` |
| Medicine | `med_` | `med_{timestamp}_{random6}` | `med_1719876543_h1i2j3` |
| Dispensing | `disp_` | `disp_{timestamp}_{random6}` | `disp_1719876543_k4l5m6` |

**Why prefixed IDs?**
- Debugging: You can identify entity type from ID alone
- Search: Can filter by prefix in console/tools
- Collision avoidance: Different entity types can never collide even with same timestamp

**Rule**: NEVER use sequential numeric IDs. Always use prefixed UUIDs with random component.

### 2.3 HimsPatient Type

```typescript
interface HimsPatient {
  id: string;                    // hpat_{ts}_{rand}
  mrn: string;                   // MRN-{YYYYMMDD}-{seq} — auto-generated
  name: string;                  // Full name
  age: number;                   // Age in years
  gender: 'Male' | 'Female' | 'Other';
  phone: string;                 // 10-digit Indian mobile
  email?: string;
  address?: string;
  bloodGroup?: string;           // A+, B+, O+, AB+, etc.
  prakriti?: string;             // Ayurvedic constitution
  vikriti?: string;              // Current dosha imbalance
  allergies?: string;            // Free-text allergy description
  emergencyContact?: string;
  createdAt: string;             // ISO 8601
}
```

**MRN Format**: `MRN-{YYYYMMDD}-{sequence}`
- Example: `MRN-20260702-001`, `MRN-20260702-002`
- Sequence resets daily (optional) or is lifetime sequential
- MRN is the human-readable identifier shown everywhere

### 2.4 OpdVisit Type

```typescript
interface OpdVisit {
  id: string;                    // vst_{ts}_{rand}
  patientId: string;             // FK → HimsPatient.id
  patientName: string;           // Denormalized for display
  doctorName: string;            // From DOCTORS constant
  visitDate: string;             // ISO 8601
  chiefComplaint: string;        // Free text
  diagnosis: string;             // Free text (provisional)
  prescription: PrescriptionItem[];
  notes?: string;                // Clinical notes
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  consultationFee: number;       // In INR
}
```

**Status Workflow**:
```
waiting → in-progress → completed
   ↓          ↓            ↓
cancelled  cancelled    (terminal)
```

**Rules**:
- `waiting`: Patient registered, waiting for doctor
- `in-progress`: Doctor has started consultation
- `completed`: Consultation finished, prescription written
- `cancelled`: Patient didn't show or appointment cancelled
- Once `completed`, status CANNOT be changed
- Once `cancelled`, status CANNOT be changed

### 2.5 PrescriptionItem Type

```typescript
interface PrescriptionItem {
  medicine: string;              // Medicine name (free text or search)
  dosage: string;                // e.g., "500mg", "10ml"
  frequency: string;             // e.g., "Twice daily", "After meals"
  duration: string;              // e.g., "7 days", "2 weeks"
  instructions?: string;         // e.g., "Take with warm water"
}
```

**Ayurveda-Specific Prescription Fields** (to be added in Phase 2):
```typescript
interface AyurvedaPrescriptionItem extends PrescriptionItem {
  anupana?: string;              // Vehicle — warm water, milk, honey
  kala?: string;                 // Time of administration — empty stomach, after food
  matra?: string;                // Dose in classical terms — 2 tablets, 5ml
  pathya?: string;               // Dietary restrictions
  apathya?: string;              // Foods to avoid
}
```

### 2.6 Invoice Type

```typescript
interface InvoiceItem {
  description: string;           // Service/medicine description
  quantity: number;
  unitPrice: number;             // In INR
  total: number;                 // quantity × unitPrice
}

interface Invoice {
  id: string;                    // inv_{ts}_{rand}
  invoiceNumber: string;         // INV-{YYYYMMDD}-{seq}
  patientId: string;             // FK → HimsPatient.id
  patientName: string;           // Denormalized
  visitId?: string;              // FK → OpdVisit.id (optional)
  items: InvoiceItem[];
  subtotal: number;
  discount: number;              // In INR or percentage
  total: number;                 // subtotal - discount
  paymentMethod: 'cash' | 'card' | 'upi' | 'insurance';
  paymentStatus: 'paid' | 'pending' | 'partial';
  paidAmount: number;
  createdAt: string;             // ISO 8601
}
```

**Invoice Number Format**: `INV-{YYYYMMDD}-{sequence}`
- Example: `INV-20260702-001`

### 2.7 Medicine Type

```typescript
interface Medicine {
  id: string;                    // med_{ts}_{rand}
  name: string;                  // Generic or brand name
  category: 'Ayurvedic' | 'Allopathic' | 'Siddha';
  manufacturer?: string;
  batchNumber?: string;
  expiryDate?: string;           // ISO date (YYYY-MM-DD)
  quantity: number;              // Current stock
  unit: string;                  // 'tablets' | 'bottles' | 'grams' | 'ml' | 'packets'
  price: number;                 // Selling price in INR
  costPrice?: number;            // Purchase cost
  reorderLevel: number;          // Alert when stock ≤ this
  createdAt: string;             // ISO 8601
}
```

### 2.8 DispensingRecord Type

```typescript
interface DispensingRecord {
  id: string;                    // disp_{ts}_{rand}
  patientId: string;             // FK → HimsPatient.id
  patientName: string;           // Denormalized
  visitId: string;               // FK → OpdVisit.id
  medicineId: string;            // FK → Medicine.id
  medicineName: string;          // Denormalized
  quantityDispensed: number;
  unit: string;
  dispensedBy: string;           // Doctor name
  dispensedAt: string;           // ISO 8601
}
```

### 2.9 Constants

```typescript
const DOCTORS = [
  'Dr. Rajesh Sharma',
  'Dr. Priya Verma',
  'Dr. Amit Patel',
  'Dr. Sunita Gupta',
];

const MEDICINE_CATEGORIES = ['Ayurvedic', 'Allopathic', 'Siddha'] as const;
const MEDICINE_UNITS = ['tablets', 'bottles', 'grams', 'ml', 'packets'] as const;

const OPD_STATUS = ['waiting', 'in-progress', 'completed', 'cancelled'] as const;
const PAYMENT_METHODS = ['cash', 'card', 'upi', 'insurance'] as const;
const PAYMENT_STATUSES = ['paid', 'pending', 'partial'] as const;
```

---

## 3. Module: Patient Registration

### 3.1 Patient Registration Workflow

```
1. Receptionist opens Patient Registration
2. Enters: Name, Age, Gender, Phone (required)
3. Optionally enters: Email, Address, Blood Group, Allergies, Emergency Contact
4. Optionally enters: Prakriti, Vikriti (Ayurveda-specific)
5. System auto-generates MRN
6. System saves patient → localStorage/Supabase
7. Patient appears in patient list immediately
```

### 3.2 MRN Generation Algorithm

```typescript
function generateMrn(existingPatients: HimsPatient[]): string {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  
  // Count existing patients with today's date prefix
  const todayPrefix = `MRN-${dateStr}-`;
  const todayCount = existingPatients.filter(p => p.mrn.startsWith(todayPrefix)).length;
  
  const sequence = (todayCount + 1).toString().padStart(3, '0');
  return `${todayPrefix}${sequence}`;
}
```

### 3.3 Duplicate Detection

**Before saving a new patient, check for duplicates**:
```typescript
function findDuplicatePatient(patients: HimsPatient[], phone: string, name: string): HimsPatient | null {
  // Exact phone match (highest confidence)
  const byPhone = patients.find(p => p.phone === phone);
  if (byPhone) return byPhone;
  
  // Exact name match (medium confidence)
  const byName = patients.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (byName) return byName;
  
  return null;
}
```

**UI Pattern**: Show a "Possible duplicate found" warning with the existing patient's
details and let the user choose: "Use Existing" or "Create New".

### 3.4 Phone Number Validation

Indian mobile numbers:
- 10 digits
- Starts with 6, 7, 8, or 9
- No country code in the field (store without +91)

```typescript
function isValidIndianMobile(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}
```

### 3.5 Age vs Date of Birth

**Decision**: Store `age` (number) for simplicity in MVP. Date of birth can be added in
Phase 2 for more accurate age calculation.

**Rule**: Age must be between 0 and 120. Validate on input.

### 3.6 Patient Search

Search should be fuzzy and support:
- Name (partial match, case-insensitive)
- MRN (exact or partial match)
- Phone (exact match)

```typescript
function searchPatients(patients: HimsPatient[], query: string): HimsPatient[] {
  const q = query.toLowerCase().trim();
  return patients.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.mrn.toLowerCase().includes(q) ||
    p.phone.includes(q)
  );
}
```

---

## 4. Module: OPD (Outpatient Department)

### 4.1 OPD Visit Lifecycle

```
Registration → Waiting → In Progress → Completed → Billing → Discharge
                     ↓           ↓
                  Cancelled   Cancelled
```

### 4.2 OPD Queue Management

**For a 5 OPD chamber clinic**:
- Each chamber has one doctor
- Queue is per-doctor (not global)
- Tokens are sequential within a day
- Status drives the queue display

**Queue Display Rules**:
- Show waiting patients first (by time registered)
- Show in-progress patients second
- Show completed/cancelled patients last (or hide)
- Highlight current patient being seen

### 4.3 Visit Creation Rules

**Required fields**:
- Patient (must be selected from existing patients)
- Doctor (from hardcoded list)
- Chief Complaint (free text, minimum 2 characters)

**Optional fields**:
- Diagnosis (can be filled during/after consultation)
- Prescription (filled during consultation)
- Notes
- Consultation Fee (defaults to ₹500)

### 4.4 Status Transition Rules

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  'waiting': ['in-progress', 'cancelled'],
  'in-progress': ['completed', 'cancelled'],
  'completed': [],          // Terminal state
  'cancelled': [],          // Terminal state
};

function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

### 4.5 Prescription Builder

**Pattern**: Inline prescription builder within the visit creation/edit form.

**Fields per prescription item**:
- Medicine name (text input with pharmacy autocomplete)
- Dosage (text input)
- Frequency (dropdown: Once daily, Twice daily, Thrice daily, Before meals, After meals, At bedtime)
- Duration (text input: "7 days", "2 weeks", etc.)
- Instructions (optional text: "Take with warm water")

**UI Pattern**:
```
[Medicine name input]  [Dosage input]
[Frequency dropdown]   [Duration input]
[Instructions input (optional)]
[+ Add] button

--- Added items ---
1. Ashwagandha Churna — 500mg Twice daily × 2 weeks — Take with honey  [×]
2. Triphala Tablets — 500mg After meals × 1 month                        [×]
```

### 4.6 Date-Based Filtering

**Default**: Show today's visits only.
**Toggle**: "All Time" to show all visits.

**Date Picker**: Simple date input (not a complex calendar widget).
**Quick Navigation**: Previous day / Today / Next day buttons.

### 4.7 Historical View

When "All Time" is enabled:
- Show date picker for specific date
- Show visits grouped by date (newest first)
- Show date headers: "2 July 2026 — 5 visits"

---

## 5. Module: IPD (Inpatient Department)

### 5.1 IPD Overview (Future Phase)

For a 5-bed clinic, IPD is simple:
- Bed allocation (Bed 1-5)
- Admission date/time
- Discharge date/time
- Daily progress notes
- Treatment schedule
- Discharge summary

### 5.2 Bed Management

```
Bed 1: [Occupied] — Patient: Ramesh Kumar — Since: 1 Jul 2026
Bed 2: [Available]
Bed 3: [Occupied] — Patient: Suresh Patel — Since: 28 Jun 2026
Bed 4: [Available]
Bed 5: [Maintenance]
```

**Bed Statuses**: `available`, `occupied`, `maintenance`, `reserved`

### 5.3 IPD Admission Workflow

```
1. Doctor decides to admit patient
2. Receptionist creates IPD admission
3. System allocates available bed
4. Admission record created with:
   - Patient ID
   - Bed number
   - Admission date/time
   - Admitting doctor
   - Provisional diagnosis
   - Expected length of stay
5. Bed status changes to 'occupied'
```

### 5.4 IPD Discharge Workflow

```
1. Doctor writes discharge summary
2. System calculates total bill:
   - Consultation charges
   - Bed charges (per day × days stayed)
   - Medicines administered
   - Procedures performed
   - Investigation charges
3. Payment processed
4. Discharge summary generated
5. Bed status changes to 'available'
6. Patient record updated with discharge date
```

---

## 6. Module: Billing & Revenue Cycle

### 6.1 Invoice Generation Rules

**When to create an invoice**:
- After OPD consultation is completed
- After IPD discharge
- For pharmacy sales (walk-in)
- For procedures/therapies

**Invoice creation MUST**:
1. Reference the visit (if applicable)
2. Calculate subtotal from line items
3. Apply discount (if any)
4. Calculate total
5. Record payment method and status
6. Generate unique invoice number

### 6.2 Invoice Number Generation

```typescript
function generateInvoiceNumber(existingInvoices: Invoice[]): string {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  
  const todayPrefix = `INV-${dateStr}-`;
  const todayCount = existingInvoices.filter(i => i.invoiceNumber.startsWith(todayPrefix)).length;
  
  const sequence = (todayCount + 1).toString().padStart(3, '0');
  return `${todayPrefix}${sequence}`;
}
```

### 6.3 Payment Status Logic

```typescript
function calculatePaymentStatus(total: number, paidAmount: number): 'paid' | 'partial' | 'pending' {
  if (paidAmount >= total) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'pending';
}
```

### 6.4 Revenue Tracking

**Dashboard metrics**:
- Today's revenue (sum of all invoices created today)
- This month's revenue
- Pending amount (sum of invoices with status 'pending' or 'partial')
- Average invoice value

**Revenue calculation**:
```typescript
function calculateRevenue(invoices: Invoice[], startDate: string, endDate: string): number {
  return invoices
    .filter(inv => {
      const invDate = inv.createdAt.split('T')[0];
      return invDate >= startDate && invDate <= endDate;
    })
    .reduce((sum, inv) => sum + inv.total, 0);
}
```

### 6.5 Quick Invoice from OPD

**Pattern**: After completing an OPD visit, a "Bill This Visit" button appears.

**Auto-populated fields**:
- Patient name (from visit)
- Visit ID (linked)
- Consultation fee (from visit)
- Medicine charges (from prescription, if pharmacy prices are available)

**Manual fields**:
- Additional items (procedures, investigations)
- Discount
- Payment method
- Amount paid

### 6.6 GST Compliance (Future Phase)

For a small clinic, GST is simpler than a hospital:
- Consultation fees: Exempt from GST (medical services)
- Pharmacy sales: 12% GST (GSTIN required)
- Procedures: May attract GST depending on type

**Rule**: For MVP, do NOT calculate GST. Just show total. GST module comes in Phase 2.

### 6.7 Partial Payments

```typescript
interface Invoice {
  // ... existing fields
  paidAmount: number;            // Amount already paid
  paymentStatus: 'paid' | 'pending' | 'partial';
}

// When patient pays in installments:
function processPayment(invoice: Invoice, amount: number): Invoice {
  const newPaidAmount = invoice.paidAmount + amount;
  return {
    ...invoice,
    paidAmount: newPaidAmount,
    paymentStatus: calculatePaymentStatus(invoice.total, newPaidAmount),
  };
}
```

---

## 7. Module: Pharmacy & Inventory

### 7.1 Pharmacy Workflow

```
Add Medicine → Stock Management → Dispensing → Low Stock Alert → Reorder
```

### 7.2 Medicine Categories

For an Ayurveda clinic:
- **Ayurvedic**: Classical formulations (Churna, Vati, Asava, Arishta, Ghrita, Taila)
- **Allopathic**: Modern medicines (tablets, capsules, syrups)
- **Siddha**: Tamil traditional medicine (if applicable)

### 7.3 Stock Management Rules

**CRITICAL RULES**:
1. Never allow negative stock
2. Always check stock before dispensing
3. Update stock atomically (read-modify-write in single operation)
4. Track every stock change (dispensing, returns, adjustments)

```typescript
function dispenseStock(medicine: Medicine, quantity: number): Medicine | null {
  if (medicine.quantity < quantity) return null; // Insufficient stock
  return {
    ...medicine,
    quantity: medicine.quantity - quantity,
  };
}
```

### 7.4 Low Stock Alerts

**Reorder Level**: When stock falls to or below `reorderLevel`, show alert.

**Dashboard display**:
```
⚠️ Low Stock Alert
- Ashwagandha Churna: 15 units (reorder at 20)
- Triphala Tablets: 8 packets (reorder at 10)
- Brahmi Ghrita: 3 bottles (reorder at 5)
```

### 7.5 Expiry Tracking (Future Phase)

**FEFO (First Expiry, First Out)**:
- When dispensing, always dispense the batch with earliest expiry
- Show expiry warnings for items expiring within 30 days
- Never dispense expired medicines

### 7.6 Medicine Search

Search should support:
- Name (partial match)
- Category filter
- Manufacturer (partial match)
- Stock availability (only show items with quantity > 0 when dispensing)

### 7.7 Dispensing Records

Every dispensing operation MUST create a `DispensingRecord`:
- Links to patient, visit, and medicine
- Records quantity dispensed
- Records who dispensed (doctor name)
- Timestamps the operation

**Rule**: Dispensing is IMMUTABLE. Once created, a dispensing record cannot be deleted.
If stock was dispensed in error, create a stock adjustment (positive) instead.

### 7.8 Pharmacy → OPD Integration

When creating a prescription in OPD:
- Medicine name field shows autocomplete from pharmacy inventory
- Shows stock availability and price
- After visit is completed, "Dispense" button appears
- DispenseModal shows prescribed medicines and allows dispensing from stock

---

## 8. Module: Clinical Documentation (EMR)

### 8.1 SOAP Notes Pattern (Future Phase)

```
S (Subjective): Patient's chief complaint, history, symptoms
O (Objective):   Vitals, examination findings, Prakriti/Vikriti
A (Assessment):  Diagnosis, dosha imbalance analysis
P (Plan):        Treatment plan, prescriptions, follow-up
```

### 8.2 Ayurveda-Specific Documentation

**Rogi Pariksha (Patient Examination)**:
- Prakriti (Constitution): Vata/Pitta/Kapha predominant
- Vikriti (Current Imbalance): Which dosha is aggravated
- Agni (Digestive Fire): Tikshna, Sama, Vishama, Manda
- Ama (Toxins): Present/Absent
- Koshta (Bowel Habit): Regular/Irregular/Constipated
- Satmya (Adaptability): Sattvika/Rajasika/Tamasika

**Roga Pariksha (Disease Examination)**:
- Nidana (Etiology): Causative factors
- Samprapti (Pathogenesis): Disease mechanism
- Lakshana (Symptoms): Clinical features
- Upasaya (Prognostic tests): Diagnostic interventions

### 8.3 Note Locking (Future Phase)

Medical notes are legal records. Once finalized, they should be IMMUTABLE.

```
Draft → Finalized (locked) → Amendment / Addendum
```

**Rule**: AI-generated notes should ALWAYS be drafts. A doctor must review and explicitly
finalize them.

---

## 9. Module: Appointments & Queue Management

### 9.1 Queue Display Pattern

```
┌─────────────────────────────────────────────┐
│  OPD Queue — Dr. Rajesh Sharma              │
│  Chamber 1 · 2 July 2026                    │
├─────────────────────────────────────────────┤
│  🔵 #003  Ramesh Kumar    Joint pain    NOW │
│  🟡 #004  Suresh Patel    Fever         →   │
│  🟡 #005  Anita Sharma    Headache      →   │
│  ⚪ #006  Mohan Lal        Back pain     →   │
├─────────────────────────────────────────────┤
│  ✅ #001  Priya Singh     Digestive      ✓  │
│  ✅ #002  Rajesh Verma    Skin rash      ✓  │
└─────────────────────────────────────────────┘

Legend: 🔵 In Progress | 🟡 Waiting | ✅ Completed | ⚪ New
```

### 9.2 Token System

- Token number = sequential within the day per doctor
- Token displayed on registration
- Token called when doctor is ready
- Token history maintained for the day

### 9.3 Wait Time Estimation (Future Phase)

```typescript
function estimateWaitTime(
  queuePosition: number,
  avgConsultationMinutes: number
): number {
  return queuePosition * avgConsultationMinutes;
}
```

---

## 10. Module: Laboratory & Diagnostics

### 10.1 Lab Orders (Future Phase)

```
Doctor creates lab order → Lab receives order → Sample collected → 
Report generated → Doctor reviews → Report attached to visit
```

### 10.2 Common Ayurveda-Related Investigations

- Blood: CBC, ESR, Blood Sugar, Lipid Profile, Liver Function
- Urine: Routine, Microscopy
- Special: Prakriti assessment questionnaire, Dosha analysis

---

## 11. Module: Reporting & Analytics

### 11.1 Dashboard Metrics (Current)

**HIMS Dashboard shows**:
1. Total Patients (registered this month)
2. Today's OPD Visits
3. Revenue (this month)
4. Low Stock Alerts (count)
5. Recent Visits (last 5)
6. Low Stock Items (list)

### 11.2 Revenue Reports (Future Phase)

- Daily revenue collection
- Monthly revenue trend
- Revenue by doctor
- Revenue by service type
- Outstanding payments

### 11.3 Patient Reports (Future Phase)

- New vs returning patients
- Most common diagnoses
- Average consultation time
- Patient satisfaction (if feedback collected)

### 11.4 Pharmacy Reports (Future Phase)

- Top dispensed medicines
- Expiry tracking report
- Stock movement report
- Purchase vs dispensing analysis

---

## 12. Ayurveda-Specific Clinical Workflows

### 12.1 The Ayurveda Consultation Flow

Unlike allopathic medicine, Ayurveda consultation follows a specific flow:

```
1. Darshana (Inspection) — Visual examination
2. Sparshana (Palpation) — Touch examination  
3. Prashna (Questioning) — Detailed questioning
4. Upadesha (Advising) — Lifestyle/diet advice
```

### 12.2 Dashavidha Pariksha (Tenfold Examination)

The complete Ayurveda clinical examination includes:

| # | Examination | What to Record |
|---|-------------|----------------|
| 1 | Prakriti | Constitutional type (V/P/K/Va/Pa/Ka) |
| 2 | Vikriti | Current dosha imbalance |
| 3 | Sara | Tissue essence (plasma, blood, muscle, bone, marrow, semen) |
| 4 | Samhanana | Body compactness |
| 5 | Pramana | Body measurements |
| 6 | Satmya | Adaptability |
| 7 | Sattva | Mental constitution |
| 8 | Ahara Shakti | Digestive capacity |
| 9 | Vyayama Shakti | Exercise capacity |
| 10 | Vaya | Age assessment |

### 12.3 Ashtavidha Pariksha (Eightfold Examination)

| # | Examination | What to Record |
|---|-------------|----------------|
| 1 | Nadi (Pulse) | Vata/Pitta/Kapha pulse quality |
| 2 | Mutra (Urine) | Color, frequency, consistency |
| 3 | Mala (Stool) | Consistency, frequency |
| 4 | Jihva (Tongue) | Coating, color, cracks |
| 5 | Shabda (Voice) | Quality, volume |
| 6 | Sparsha (Touch) | Skin quality, temperature |
| 7 | Drik (Eyes) | Color, luster |
| 8 | Akriti (Appearance) | General appearance |

### 12.4 Dosha Assessment

**Vata Signs**:
- Dry, rough, cool skin
- Thin build
- Quick movements
- Anxiety, insomnia
- Constipation
- Joint pain

**Pitta Signs**:
- Oily, warm skin
- Medium build
- Sharp features
- Irritability, anger
- Loose stools
- Skin rashes

**Kapha Signs**:
- Cool, moist, smooth skin
- Heavy build
- Slow movements
- Depression, lethargy
- Constipation
- Weight gain

### 12.5 Treatment Principles

**Shodhana (Purification)**: Panchakarma therapies
- Vamana (Therapeutic vomiting)
- Virechana (Purgation)
- Basti (Enema)
- Nasya (Nasal administration)
- Raktamokshana (Bloodletting)

**Shamana (Palliative)**: Internal medicines, lifestyle modifications
- Deepana (Digestive stimulants)
- Pachana (Digestives)
- Upavasa (Fasting)
- Vyayama (Exercise)
- Atapa (Sunbathing)
- Maruta (Fresh air)

---

## 13. Ayurveda Prescription Standards

### 13.1 Prescription Format

```
═══════════════════════════════════════════════════
              PRESCRIPTION
═══════════════════════════════════════════════════
Patient: Ramesh Kumar          MRN: MRN-20260702-001
Age: 45 years                  Gender: Male
Date: 2 July 2026

Doctor: Dr. Rajesh Sharma
═══════════════════════════════════════════════════

CHIEF COMPLAINT: Joint pain for 2 months

DIAGNOSIS: Amavata (Rheumatoid Arthritis)
           Vata-Kapha Prakopa

═══════════════════════════════════════════════════
Rx:
═══════════════════════════════════════════════════
1. Ashwagandha Churna    500mg   Twice daily
   Duration: 2 months
   Anupana: Warm milk
   Kala: After meals

2. Guggulu Tab           500mg   Twice daily
   Duration: 2 months
   Anupana: Warm water
   Kala: After meals

3. Maharasnadi Kashayam  15ml    Twice daily
   Duration: 1 month
   Anupana: Equal water
   Kala: Before meals

═══════════════════════════════════════════════════
ADVICE:
═══════════════════════════════════════════════════
- Avoid cold foods and drinks
- Practice gentle yoga daily
- Apply warm oil massage (Abhyanga)
- Follow-up after 2 weeks

═══════════════════════════════════════════════════
```

### 13.2 Medicine Formulation Types

| Type | Sanskrit | Description | Example |
|------|----------|-------------|---------|
| Churna | चूर्ण | Powder | Ashwagandha Churna |
| Vati/Gutika | वटी/गुटिका | Tablet/Pill | Arogyavardhini Vati |
| Asava | आसव | Self-generated alcohol-based | Kumaryasava |
| Arishta | अरिष्ट | Decoction-based alcohol | Dashamularishta |
| Kwath | क्वाथ | Decoction | Mahamanjistadi Kwath |
| Ghrita | घृत | Medicated ghee | Brahmi Ghrita |
| Taila | तैल | Medicated oil | Mahanarayan Taila |
| Bhasma | भस्म | Calcined preparation | Swarna Bhasma |
| Lehya/Avaleha | लेह्य/अवलेह | Semisolid preparation | Agastya Haritaki |
| Guggulu | गुग्गुलु | Guggulu-based preparation | Yogaraj Guggulu |

### 13.3 Anupana (Vehicle) Options

| Anupana | When to Use |
|---------|-------------|
| Warm water (Ushnodaka) | General, Vata disorders |
| Cold water (Sheetodaka) | Pitta disorders |
| Honey (Madhu) | Kapha disorders, respiratory |
| Milk (Ksheera) | Rasayana, strengthening |
| Ghee (Ghrita) | Pitta, neurological |
| Buttermilk (Takra) | Digestive disorders |
| Sugar candy (Mishri) | Urinary disorders |
| Salt warm water (Lavana Ushnodaka) | Digestive stimulant |

---

## 14. Panchakarma Therapy Management

### 14.1 Therapy Categories (Future Phase)

| Category | Therapies |
|----------|-----------|
| Poorvakarma (Preparatory) | Snehana (oleation), Swedana (sudation) |
| Pradhankarma (Main) | Vamana, Virechana, Basti, Nasya, Raktamokshana |
| Paschatkarma (Post) | Sansarjana Krama, Rasayana |

### 14.2 Therapy Session Structure

```typescript
interface TherapySession {
  id: string;
  patientId: string;
  visitId: string;
  therapyType: string;           // 'Abhyanga' | 'Shirodhara' | etc.
  therapistName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;              // minutes
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  oils?: string[];               // Oils used
  observations?: string;
}
```

### 14.3 Therapy Packages (Future Phase)

```typescript
interface TherapyPackage {
  id: string;
  name: string;                  // 'Panchakarma Detox - 7 Days'
  therapies: string[];           // List of therapy types included
  sessions: number;              // Total sessions
  price: number;
  validityDays: number;          // Must complete within this period
}
```

---

## 15. Billing Patterns & GST Compliance

### 15.1 Invoice Line Items for Ayurveda Clinic

| Item | HSN/SAC | GST Rate | Notes |
|------|---------|----------|-------|
| Consultation fee | 998311 | Exempt | Medical service |
| Panchakarma therapy | 998311 | Exempt | Medical service |
| Ayurvedic medicines | 3004 | 12% | If selling from pharmacy |
| Pathology tests | 998211 | 18% | If conducting tests |
| Room charges (IPD) | 996111 | 12% | If applicable |
| Food/diet | 996321 | 5% | If providing meals |

### 15.2 Discount Patterns

```typescript
// Absolute discount
const discount = 100; // ₹100 off

// Percentage discount
const discountPercent = 10; // 10% off
const discount = subtotal * (discountPercent / 100);

// Item-level discount (future)
const itemDiscount = item.unitPrice * 0.1; // 10% off this item
```

### 15.3 Payment Splitting (Future Phase)

```typescript
interface Payment {
  method: 'cash' | 'card' | 'upi' | 'insurance';
  amount: number;
  reference?: string;           // Transaction ID for digital payments
}

// A single invoice can have multiple payments
interface Invoice {
  payments: Payment[];
  totalPaid: number;
  balance: number;
}
```

---

## 16. Pharmacy Inventory Patterns

### 16.1 Stock Transaction Types

| Type | Effect on Stock | Example |
|------|----------------|---------|
| Purchase | +quantity | Buying new stock |
| Dispensing | -quantity | Patient takes medicine |
| Return | +quantity | Patient returns unused medicine |
| Adjustment | +/- quantity | Stock count correction |
| Expired | -quantity | Removing expired stock |
| Damaged | -quantity | Removing damaged stock |

### 16.2 Stock Valuation Methods

**FIFO (First In, First Out)**: Oldest stock dispensed first
**FEFO (First Expiry, First Out)**: Earliest expiry dispensed first — **RECOMMENDED for pharmacy**

### 16.3 Reorder Point Calculation

```typescript
function calculateReorderPoint(
  averageDailyUsage: number,
  leadTimeDays: number,
  safetyStock: number
): number {
  return (averageDailyUsage * leadTimeDays) + safetyStock;
}
```

For a small clinic, reorder levels are typically set manually based on experience.

### 16.4 Batch Tracking (Future Phase)

```typescript
interface MedicineBatch {
  id: string;
  medicineId: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
  supplier?: string;
}
```

---

## 17. UI/UX Patterns for Healthcare

### 17.1 Color System

**HIMS uses emerald/green accent** (distinct from AyurGPT cyan):

| Purpose | Color | Tailwind Class |
|---------|-------|---------------|
| Primary actions | Emerald 600 | `bg-emerald-600` |
| Success states | Green 500 | `text-green-500` |
| Warning states | Amber 500 | `text-amber-500` |
| Error states | Red 500 | `text-red-500` |
| Info states | Blue 500 | `text-blue-500` |
| Background (light) | Surface 50 | `bg-surface-50` |
| Background (dark) | Surface 900 | `bg-surface-900` |
| Card (light) | White | `bg-white` |
| Card (dark) | Surface 800 | `bg-surface-800` |
| Border (light) | Surface 200 | `border-surface-200` |
| Border (dark) | Surface 700 | `border-surface-700` |

### 17.2 Status Badges

```typescript
function statusBadge(status: string) {
  const styles: Record<string, string> = {
    'waiting': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'cancelled': 'bg-surface-100 text-surface-500 dark:bg-surface-800',
    'paid': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'partial': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return styles[status] || 'bg-surface-100 text-surface-500';
}
```

### 17.3 Card Patterns

**Stats Card (Dashboard)**:
```tsx
<div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
  <div className="flex items-center gap-3">
    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
      <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    </div>
    <div>
      <p className="text-sm text-surface-500">Label</p>
      <p className="text-xl font-bold text-surface-900 dark:text-white">Value</p>
    </div>
  </div>
</div>
```

**List Item Card**:
```tsx
<div className="bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4">
  <div className="flex items-center justify-between">
    <div className="min-w-0 flex-1">
      <p className="font-medium text-surface-900 dark:text-white truncate">Title</p>
      <p className="text-sm text-surface-500">Subtitle</p>
    </div>
    <div className="flex items-center gap-2">
      <StatusBadge />
      <ActionButton />
    </div>
  </div>
</div>
```

### 17.4 Form Patterns

**Input Field**:
```tsx
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
    Field Label *
  </label>
  <input
    type="text"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    placeholder="Placeholder text"
    className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
    required
  />
</div>
```

**Select Field**:
```tsx
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
    Field Label
  </label>
  <select
    value={value}
    onChange={(e) => setValue(e.target.value)}
    className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
  >
    {options.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
</div>
```

### 17.5 Modal Pattern

```tsx
<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
  <div className="bg-white dark:bg-surface-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
    <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
      <h2 className="font-semibold text-surface-900 dark:text-white">Modal Title</h2>
      <button onClick={onClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg">
        <X className="w-5 h-5 text-surface-500" />
      </button>
    </div>
    <div className="p-4">
      {/* Modal content */}
    </div>
    <div className="p-4 border-t border-surface-200 dark:border-surface-700 flex justify-end gap-2">
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button onClick={handleSubmit}>Confirm</Button>
    </div>
  </div>
</div>
```

### 17.6 Empty State Pattern

```tsx
<div className="text-center py-12 text-surface-500">
  <Icon className="w-12 h-12 mx-auto mb-4 text-surface-300" />
  <p className="text-lg mb-2">No data found</p>
  <p className="text-sm mb-4">Description of what should appear here</p>
  <Button size="sm" onClick={handleAction}>Create First Item</Button>
</div>
```

### 17.7 Mobile-First Touch Targets

**Minimum touch target**: 44px × 44px (Apple HIG) or 48px × 48px (Material Design)

**Rule**: Every interactive element (button, link, select) must be at least 44px tall.

```tsx
// BAD
<button className="p-1">Click</button>  // ~16px — too small

// GOOD
<button className="min-h-[44px] px-4 py-2">Click</button>  // 44px — correct
```

### 17.8 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom tabs |
| Tablet | 640-1024px | Sidebar + content |
| Desktop | > 1024px | Full sidebar + content |

---

## 18. State Management Patterns

### 18.1 Context + useLocalStorage Pattern

```typescript
// Context type
interface ModuleContextType {
  items: Item[];
  addItem: (item: Omit<Item, 'id' | 'createdAt'>) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  getItem: (id: string) => Item | undefined;
}

// Provider
function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useLocalStorage<Item[]>('hims_items', []);

  const addItem = useCallback((data: Omit<Item, 'id' | 'createdAt'>) => {
    const newItem: Item = {
      ...data,
      id: `prefix_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [newItem, ...prev]);
  }, [setItems]);

  // ... other methods

  return (
    <ModuleContext.Provider value={{ items, addItem, updateItem, deleteItem, getItem }}>
      {children}
    </ModuleContext.Provider>
  );
}
```

### 18.2 useCallback for All Context Methods

**Rule**: Every method exposed through context MUST be wrapped in `useCallback` to prevent
unnecessary re-renders.

```typescript
// CORRECT
const addItem = useCallback((data: ...) => {
  // ...
}, [setItems]);

// WRONG — causes re-render on every parent render
const addItem = (data: ...) => {
  // ...
};
```

### 18.3 useMemo for Derived State

```typescript
const lowStockMedicines = useMemo(
  () => medicines.filter((m) => m.quantity <= m.reorderLevel),
  [medicines]
);
```

### 18.4 localStorage Keys

All HIMS localStorage keys must be prefixed with `hims_`:

| Key | Type | Description |
|-----|------|-------------|
| `hims_patients` | `HimsPatient[]` | All registered patients |
| `hims_visits` | `OpdVisit[]` | All OPD visits |
| `hims_invoices` | `Invoice[]` | All invoices |
| `hims_medicines` | `Medicine[]` | Pharmacy inventory |
| `hims_dispensing` | `DispensingRecord[]` | Dispensing history |

### 18.5 Data Migration Pattern

When adding new fields to existing types:

```typescript
function migratePatients(raw: any[]): HimsPatient[] {
  return raw.map(p => ({
    ...p,
    // Add new fields with defaults
    prakriti: p.prakriti || '',
    vikriti: p.vikriti || '',
    allergies: p.allergies || '',
  }));
}
```

---

## 19. Error Prevention & Common Pitfalls

### 19.1 Billing Double-Charge Bug

**Problem**: Payment webhook/process retries can create duplicate invoices.

**Solution**: Use deduplication keys on invoices.

```typescript
// When creating an invoice
const invoice = {
  id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  deduplicationKey: `visit_${visitId}_${Date.now()}`, // Unique per visit
  // ...
};

// Before creating, check for existing
const existing = invoices.find(i => i.deduplicationKey === newInvoice.deduplicationKey);
if (existing) return existing; // Idempotent
```

### 19.2 Stale Token/Permission Bug

**Problem**: A doctor whose account was suspended can still access data until token expires.

**Solution**: Never encode permissions in client-side tokens. Always check permissions
against the database on every request (or in our case, in every context method).

### 19.3 Race Condition in Stock Dispensing

**Problem**: Two users dispense the same medicine simultaneously, both see stock = 10,
both dispense 10, stock goes negative.

**Solution**: Atomic read-modify-write.

```typescript
// CORRECT — atomic operation
const dispenseMedicine = useCallback((medicineId: string, quantity: number) => {
  setMedicines((prev) => {
    const med = prev.find(m => m.id === medicineId);
    if (!med || med.quantity < quantity) return prev; // Reject
    return prev.map(m => 
      m.id === medicineId 
        ? { ...m, quantity: m.quantity - quantity } 
        : m
    );
  });
}, []);
```

### 19.4 Orphaned Records

**Problem**: Deleting a patient leaves orphaned visits, invoices, and dispensing records.

**Solution**: Soft-delete patients (mark as `deleted: true` but keep in database).
OR enforce referential integrity — prevent deletion if related records exist.

```typescript
function canDeletePatient(patientId: string, visits: OpdVisit[]): boolean {
  // Cannot delete patient with any visit history
  return !visits.some(v => v.patientId === patientId);
}
```

### 19.5 Empty State Crashes

**Problem**: Component tries to access `.name` on `undefined` patient.

**Solution**: Always check for null/undefined before accessing properties.

```typescript
// WRONG
const patient = getPatient(id);
return <div>{patient.name}</div>; // Crashes if patient is undefined

// CORRECT
const patient = getPatient(id);
if (!patient) return <div>Patient not found</div>;
return <div>{patient.name}</div>;
```

### 19.6 Date Handling Errors

**Problem**: Using `new Date()` for display without timezone consideration.

**Solution**: Always use ISO 8601 strings and format with `toLocaleDateString`.

```typescript
// WRONG — timezone-dependent
const date = new Date(); // Could be different day in different timezones

// CORRECT — use stored ISO string
const dateStr = new Date(visit.visitDate).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
```

### 19.7 Invoice Amount Miscalculation

**Problem**: Floating-point arithmetic causes ₹0.1 + ₹0.2 = ₹0.30000000000000004

**Solution**: Use integer paise (multiply by 100) for calculations, or round explicitly.

```typescript
// CORRECT
const total = Math.round((subtotal - discount) * 100) / 100;

// Or use integer paise
const totalPaise = Math.round((subtotalPaise - discountPaise));
const totalRupees = totalPaise / 100;
```

### 19.8 localStorage Quota Exceeded

**Problem**: localStorage has ~5MB limit. Large datasets will fail.

**Solution**: 
- Monitor localStorage usage
- Implement data archival (move old data to Supabase)
- Compress data if needed

```typescript
function getLocalStorageSize(): number {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2; // UTF-16
    }
  }
  return total;
}
```

### 19.9 Modal Z-Index Stacking

**Problem**: Multiple modals open simultaneously, z-index conflicts.

**Solution**: Use consistent z-index values and stack modals.

```typescript
// Base modal: z-50
// Confirmation dialog on top: z-[60]
// Toast notifications: z-[70]
```

### 19.10 Form Reset After Modal Close

**Problem**: Modal form state persists after closing and reopening.

**Solution**: Reset form state in useEffect when modal opens.

```typescript
useEffect(() => {
  if (isOpen) {
    setName('');
    setAge('');
    // Reset all fields
  }
}, [isOpen]);
```

---

## 20. Security & Data Privacy

### 20.1 Data Storage Security

**MVP (localStorage)**:
- Data stored in browser — NOT encrypted
- Data persists until user clears browser data
- No server-side backup
- Acceptable for demo/MVP only

**Production (Supabase)**:
- Data encrypted at rest (AES-256)
- Data encrypted in transit (TLS 1.3)
- Row Level Security (RLS) enforced
- Regular automated backups
- HIPAA-aligned infrastructure

### 20.2 Sensitive Data Handling

**Never store in localStorage/DB**:
- Passwords (use Supabase Auth)
- API keys
- Credit card numbers
- Aadhaar numbers (unless encrypted)

**Safe to store**:
- Patient name, age, gender
- Phone number, email
- Medical records (with patient consent)
- Prescription data

### 20.3 Audit Trail (Future Phase)

Every create, update, and delete operation should log:
- Who performed the action
- When it was performed
- What was changed
- Previous value (for updates)

```typescript
interface AuditLog {
  id: string;
  entityType: string;           // 'patient' | 'visit' | 'invoice' | etc.
  entityId: string;
  action: 'create' | 'update' | 'delete';
  performedBy: string;
  timestamp: string;
  changes?: Record<string, { from: any; to: any }>;
}
```

### 20.4 Role-Based Access (Future Phase)

| Role | Permissions |
|------|-------------|
| Admin | Full access to all modules |
| Doctor | OPD, patients, prescriptions, clinical notes |
| Nurse | Vitals, nursing notes, patient lookup |
| Receptionist | Registration, appointments, billing |
| Pharmacist | Pharmacy module only |

---

## 21. Performance & Optimization

### 21.1 localStorage Performance

- **Read**: ~0.1ms for small datasets (< 1000 records)
- **Write**: ~1-5ms depending on data size
- **Limit**: ~5MB total per domain

**Optimization**: Use `useLocalStorage` hook with lazy initialization.

### 21.2 Re-render Prevention

```typescript
// CORRECT — memoized components
const PatientCard = React.memo(({ patient }: { patient: HimsPatient }) => {
  return <div>{patient.name}</div>;
});

// CORRECT — stable references from context
const contextValue = useMemo(() => ({
  patients,
  addPatient,
  // ...
}), [patients, addPatient]);
```

### 21.3 List Rendering

For lists > 100 items, consider:
- Virtualization (react-window, react-virtual)
- Pagination
- Infinite scroll

For MVP with < 500 records, simple `.map()` is fine.

### 21.4 Bundle Size

Current bundle: ~589KB JS gzipped to ~158KB.

**Rule**: Keep total bundle under 300KB gzipped for mobile performance.

---

## 22. Testing Strategies

### 22.1 Unit Tests (Future Phase)

```typescript
// Test MRN generation
describe('generateMrn', () => {
  it('should generate MRN with today date prefix', () => {
    const mrn = generateMrn([]);
    expect(mrn).toMatch(/^MRN-\d{8}-\d{3}$/);
  });

  it('should increment sequence for existing patients', () => {
    const existing = [{ mrn: 'MRN-20260702-001' }];
    const mrn = generateMrn(existing);
    expect(mrn).toBe('MRN-20260702-002');
  });
});
```

### 22.2 Integration Tests (Future Phase)

```typescript
// Test complete OPD workflow
describe('OPD Workflow', () => {
  it('should complete full visit lifecycle', () => {
    // 1. Create patient
    // 2. Create visit
    // 3. Update status to in-progress
    // 4. Add prescription
    // 5. Complete visit
    // 6. Create invoice
    // 7. Dispense medicine
  });
});
```

### 22.3 E2E Tests (Future Phase)

Use Playwright or Cypress for full workflow testing:
- Patient registration → OPD visit → Billing → Pharmacy

---

## 23. Deployment & DevOps

### 23.1 Build Process

```bash
# Type check
npx tsc --noEmit

# Build
npx vite build

# Preview
npx vite preview
```

### 23.2 Environment Variables

```env
# Client-side (Vite)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Server-side (Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=...
NVIDIA_API_KEY=...
```

**Rule**: NEVER put `SUPABASE_SERVICE_ROLE_KEY` in client-side code.

### 23.3 Deployment Pipeline

```
Push to GitHub → Vercel auto-deploys → Production at assistant.ayurvrittaayurveda.in
```

### 23.4 Rollback Strategy

If a deployment breaks:
1. Vercel shows previous deployment
2. Click "Promote to Production" on the last working deployment
3. Fix the issue and push again

---

## 24. Code Review Checklist

Before merging any HIMS code, verify:

### Data Integrity
- [ ] All IDs use prefixed format (`hpat_`, `vst_`, `inv_`, `med_`, `disp_`)
- [ ] No sequential numeric IDs
- [ ] All required fields validated
- [ ] No negative stock possible
- [ ] Invoice amounts calculated correctly (no floating-point errors)
- [ ] Status transitions are valid

### UI/UX
- [ ] All interactive elements ≥ 44px touch target
- [ ] Loading states for async operations
- [ ] Empty states for no-data scenarios
- [ ] Error messages are user-friendly
- [ ] Dark mode works correctly
- [ ] Mobile responsive (bottom tabs visible)

### State Management
- [ ] All context methods wrapped in `useCallback`
- [ ] Derived state uses `useMemo`
- [ ] localStorage keys prefixed with `hims_`
- [ ] No direct state mutation
- [ ] Modal state resets on close

### Security
- [ ] No secrets in client-side code
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in frontend
- [ ] Patient data not exposed in URLs
- [ ] Input sanitization (XSS prevention)

### Performance
- [ ] No unnecessary re-renders
- [ ] Lists memoized if > 50 items
- [ ] Images optimized (if any)
- [ ] Bundle size not significantly increased

---

## 25. Reference Implementations

### 25.1 ClinicOS (Open Source)

**Repository**: github.com/raghuramkomara2906/ClinicOS

Key patterns to adopt:
- Multi-tenant architecture with `clinic_id` isolation
- Note locking (Draft → Finalized → Amendment)
- Role-based access control
- Patient mobile app integration

### 25.2 OpenHIMS2 (Open Source)

**Repository**: github.com/Dr-Francis-Drobniewski/OpenHIMS2-core

Key patterns to adopt:
- Workflow: Clerk → Doctor → Pharmacist
- Queue management per clinic per day
- Prescription dispensing with audit trail
- Medical terminology autocomplete

### 25.3 AyurHIS (Commercial Reference)

Modules to study:
- OPD/IPD with Ayurveda-specific case papers
- E-Prescription with classical formulations
- Pharmacy with batch/expiry tracking
- GST billing

### 25.4 AyurAdmin (Commercial Reference)

Key features:
- 14+ modules covering all operations
- Panchakarma therapy scheduling
- Production management (in-house medicine production)
- Multi-branch support

---

## 26. Glossary

| Term | Definition |
|------|------------|
| **ABHA** | Ayushman Bharat Health Account — India's health ID |
| **ADT** | Admission, Discharge, Transfer |
| **Agni** | Digestive fire |
| **Ama** | Metabolic toxins |
| **Anupana** | Vehicle taken with medicine |
| **Asava** | Self-generated alcohol-based medicine |
| **Arishta** | Decoction-based alcohol medicine |
| **Basti** | Enema therapy (one of Panchakarma) |
| **Bhasma** | Calcined metal/mineral preparation |
| **CGHS** | Central Government Health Scheme |
| **CGHS** | Central Government Health Scheme |
| **Churna** | Powdered medicine |
| **Deepana** | Digestive stimulant |
| **Dosha** | Bio-energetic force (Vata, Pitta, Kapha) |
| **ECHS** | Ex-Servicemen Contributory Health Scheme |
| **EMR** | Electronic Medical Record |
| **EHR** | Electronic Health Record |
| **FEFO** | First Expiry, First Out |
| **FIFO** | First In, First Out |
| **FHIR** | Fast Healthcare Interoperability Resources |
| **Ghrita** | Medicated ghee |
| **GST** | Goods and Services Tax |
| **GSTIN** | GST Identification Number |
| **HIMS** | Hospital Information Management System |
| **HSN** | Harmonized System of Nomenclature |
| **ICD** | International Classification of Diseases |
| **IPD** | Inpatient Department |
| **Kapha** | Water + Earth dosha |
| **Koshta** | Bowel habit |
| **Kwath** | Decoction |
| **Lehya** | Semisolid preparation |
| **Matra** | Dose quantity |
| **MRN** | Medical Record Number |
| **NABH** | National Accreditation Board for Hospitals |
| **Nasya** | Nasal administration therapy |
| **NCISM** | National Commission for Indian System of Medicine |
| **OPD** | Outpatient Department |
| **Pachana** | Digestive therapy |
| **Panchakarma** | Five purification therapies |
| **Pathya** | Wholesome diet/lifestyle |
| **Pitta** | Fire + Water dosha |
| **Prakriti** | Constitutional type |
| **Rasa** | Taste / Plasma tissue |
| **Rasayana** | Rejuvenation therapy |
| **Rogi Pariksha** | Patient examination |
| **Roga Pariksha** | Disease examination |
| **SAC** | Services Accounting Code |
| **Shodhana** | Purification therapy |
| **Shamana** | Palliative therapy |
| **Sneana** | Oleation therapy |
| **Swedana** | Sudation therapy |
| **Taila** | Medicated oil |
| **TPA** | Third Party Administrator |
| **UHID** | Unique Health Identification |
| **Vati** | Tablet/pill form |
| **Vata** | Air + Space dosha |
| **Vikriti** | Current dosha imbalance |
| **Vyayama** | Exercise |

---

## Appendix A: Module Maturity Assessment

| Module | Current | Target (Phase 1) | Target (Phase 2) | Target (Phase 3) |
|--------|---------|-------------------|-------------------|-------------------|
| Patient Registration | ✅ 3/5 | 4/5 | 4/5 | 5/5 |
| OPD Queue | ✅ 2/5 | 3/5 | 4/5 | 4/5 |
| Clinical Documentation | 🔶 1/5 | 2/5 | 3/5 | 4/5 |
| Billing | 🔶 1.5/5 | 3/5 | 4/5 | 5/5 |
| Pharmacy | 🔶 1.5/5 | 3/5 | 4/5 | 4/5 |
| IPD | ❌ 0/5 | 0/5 | 2/5 | 3/5 |
| Appointments | ❌ 0/5 | 0/5 | 2/5 | 3/5 |
| Laboratory | ❌ 0/5 | 0/5 | 1/5 | 2/5 |
| Reporting | 🔶 1/5 | 2/5 | 3/5 | 4/5 |
| Ayurveda-Specific | 🔶 1/5 | 2/5 | 3/5 | 4/5 |

## Appendix B: Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | React 19 + Vite 6 | Fast builds, modern React features |
| Styling | Tailwind CSS 4 | Rapid UI, consistent design |
| State | React Context + localStorage | Simple, no extra dependencies |
| Storage (MVP) | localStorage | Zero cost, instant setup |
| Storage (Prod) | Supabase PostgreSQL | Managed, RLS, real-time |
| Auth | Supabase Auth + Google OAuth | Easy integration |
| AI | NVIDIA NIM (Kimi K2.6) | Free tier, medical capable |
| Deployment | Vercel | Zero-config, fast CDN |
| Package Manager | npm | Standard for React projects |

## Appendix C: File Structure Reference

```
src/features/hims/
├── types/
│   └── index.ts                    # All type definitions
├── contexts/
│   ├── HimsPatientContext.tsx       # Patient CRUD
│   ├── OpdContext.tsx               # OPD visits
│   ├── BillingContext.tsx           # Invoices
│   └── PharmacyContext.tsx          # Medicine inventory
├── components/
│   ├── RegisterPatientModal.tsx     # New patient form
│   ├── EditPatientModal.tsx         # Edit patient form
│   ├── CreateVisitModal.tsx         # New OPD visit
│   ├── CreateInvoiceModal.tsx       # Manual invoice
│   ├── QuickInvoiceModal.tsx        # Auto-populated invoice
│   ├── AddMedicineModal.tsx         # Add medicine to pharmacy
│   └── DispenseMedicineModal.tsx    # Dispense medicine
├── layout/
│   ├── HimsLayout.tsx              # Shell with sidebar
│   ├── HimsHeader.tsx              # Header with toggle
│   ├── HimsSidebar.tsx             # Collapsible sidebar
│   ├── HimsBottomTabs.tsx          # Mobile bottom nav
│   └── HimsStatsCard.tsx           # Reusable stat card
├── pages/
│   ├── HimsDashboard.tsx           # Main dashboard
│   ├── HimsPatients.tsx            # Patient list
│   ├── HimsPatientDetail.tsx       # Patient profile
│   ├── HimsOPD.tsx                 # OPD queue
│   ├── HimsBilling.tsx             # Invoice list
│   └── HimsPharmacy.tsx            # Medicine inventory
└── utils/                          # Shared utilities (if any)
```

---

## Appendix D: Common Error Patterns & Fixes

### D.1 "Cannot read property of undefined"

**Cause**: Accessing `.name` on `undefined` patient/medicine/visit.

**Fix**: Always null-check before accessing properties.
```typescript
const patient = getPatient(id);
if (!patient) return <NotFound />;
```

### D.2 "Too much recursion" / Stack overflow

**Cause**: Infinite loop in useEffect or circular state updates.

**Fix**: Check dependency arrays, avoid updating state that triggers the same effect.
```typescript
useEffect(() => {
  // Don't update state that's in the dependency array
}, [data]); // Don't include setState here
```

### D.3 "Maximum update depth exceeded"

**Cause**: setState called during render or in a loop.

**Fix**: Move setState into useEffect or event handlers, not render logic.

### D.4 "localStorage quota exceeded"

**Cause**: Storing too much data (>5MB).

**Fix**: Implement data archival, move old records to Supabase, or compress data.

### D.5 Invoice total shows NaN

**Cause**: Parsing undefined or empty string as number.

**Fix**: Default all numeric fields to 0.
```typescript
const total = items.reduce((sum, item) => sum + (item.total || 0), 0);
```

### D.6 Duplicate patients created

**Cause**: Race condition in form submission or missing duplicate check.

**Fix**: Disable submit button while processing, implement client-side duplicate detection.

### D.7 Stock goes negative

**Cause**: Dispensing without checking available quantity.

**Fix**: Always validate stock before dispensing.
```typescript
if (medicine.quantity < quantityToDispense) {
  showError('Insufficient stock');
  return;
}
```

### D.8 Dark mode colors broken

**Cause**: Hardcoded colors instead of dark mode variants.

**Fix**: Always include dark mode classes.
```tsx
// WRONG
<div className="bg-white text-black">

// CORRECT
<div className="bg-white dark:bg-surface-800 text-surface-900 dark:text-white">
```

---

## Appendix E: Future Enhancements Roadmap

### Phase 2 Enhancements
1. **Vitals Recording** — BP, temperature, pulse, weight, height
2. **GST Billing** — HSN codes, GST calculation, GSTIN
3. **Partial Payments** — Installment tracking, balance management
4. **Patient Timeline** — Visual timeline of all patient interactions
5. **Expiry Alerts** — Medicines expiring within 30 days
6. **Print Support** — Print prescriptions, invoices, reports

### Phase 3 Enhancements
1. **IPD Module** — Bed management, admission/discharge
2. **Appointment Scheduling** — Slot-based booking
3. **Laboratory Module** — Test orders, results
4. **Insurance/TPA Billing** — Cashless claims
5. **Multi-branch Support** — Centralized data
6. **Mobile App** — Patient-facing app

### Phase 4 Enhancements
1. **ABHA Integration** — Health ID linking
2. **FHIR Interoperability** — Standard health data exchange
3. **AI Clinical Decision Support** — Dosha analysis, treatment suggestions
4. **Telemedicine** — Video consultation
5. **Analytics Dashboard** — Revenue, patient, clinical analytics
6. **NABH Compliance** — Accreditation-ready documentation

---

---

## Appendix F: Complete Implementation Guides

### F.1 Patient Registration — Full Implementation

#### Step 1: Define the Context

```typescript
// src/features/hims/contexts/HimsPatientContext.tsx
import { createContext, useContext, useCallback, useMemo } from 'react';
import type { HimsPatient } from '../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface HimsPatientContextType {
  patients: HimsPatient[];
  addPatient: (patient: Omit<HimsPatient, 'id' | 'mrn' | 'createdAt'>) => HimsPatient;
  updatePatient: (id: string, updates: Partial<HimsPatient>) => void;
  deletePatient: (id: string) => boolean;
  getPatient: (id: string) => HimsPatient | undefined;
  searchPatients: (query: string) => HimsPatient[];
  getPatientByMrn: (mrn: string) => HimsPatient | undefined;
  getPatientByPhone: (phone: string) => HimsPatient | undefined;
}

const HimsPatientContext = createContext<HimsPatientContextType | null>(null);

export function HimsPatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useLocalStorage<HimsPatient[]>('hims_patients', []);

  const generateMrn = useCallback((existingPatients: HimsPatient[]): string => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const todayPrefix = `MRN-${dateStr}-`;
    const todayCount = existingPatients.filter(p => p.mrn.startsWith(todayPrefix)).length;
    const sequence = (todayCount + 1).toString().padStart(3, '0');
    return `${todayPrefix}${sequence}`;
  }, []);

  const addPatient = useCallback(
    (data: Omit<HimsPatient, 'id' | 'mrn' | 'createdAt'>): HimsPatient => {
      // Check for duplicate phone
      const existingByPhone = patients.find(p => p.phone === data.phone);
      if (existingByPhone) {
        throw new Error(`Patient with phone ${data.phone} already exists (MRN: ${existingByPhone.mrn})`);
      }

      const newPatient: HimsPatient = {
        ...data,
        id: `hpat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        mrn: generateMrn(patients),
        createdAt: new Date().toISOString(),
      };
      setPatients((prev) => [newPatient, ...prev]);
      return newPatient;
    },
    [patients, setPatients, generateMrn]
  );

  const updatePatient = useCallback(
    (id: string, updates: Partial<HimsPatient>) => {
      setPatients((prev) => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    },
    [setPatients]
  );

  const deletePatient = useCallback(
    (id: string): boolean => {
      // Check if patient has any visits
      const hasVisits = localStorage.getItem('hims_visits');
      if (hasVisits) {
        const visits = JSON.parse(hasVisits);
        if (visits.some((v: any) => v.patientId === id)) {
          return false; // Cannot delete patient with visit history
        }
      }
      setPatients((prev) => prev.filter(p => p.id !== id));
      return true;
    },
    [setPatients]
  );

  const getPatient = useCallback(
    (id: string) => patients.find(p => p.id === id),
    [patients]
  );

  const searchPatients = useCallback(
    (query: string) => {
      const q = query.toLowerCase().trim();
      if (!q) return patients;
      return patients.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.phone.includes(q)
      );
    },
    [patients]
  );

  const getPatientByMrn = useCallback(
    (mrn: string) => patients.find(p => p.mrn === mrn),
    [patients]
  );

  const getPatientByPhone = useCallback(
    (phone: string) => patients.find(p => p.phone === phone),
    [patients]
  );

  return (
    <HimsPatientContext.Provider
      value={{
        patients,
        addPatient,
        updatePatient,
        deletePatient,
        getPatient,
        searchPatients,
        getPatientByMrn,
        getPatientByPhone,
      }}
    >
      {children}
    </HimsPatientContext.Provider>
  );
}

export function useHimsPatients() {
  const context = useContext(HimsPatientContext);
  if (!context) throw new Error('useHimsPatients must be used within HimsPatientProvider');
  return context;
}
```

#### Step 2: Register Patient Modal

```typescript
// src/features/hims/components/RegisterPatientModal.tsx
import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useHimsPatients } from '../contexts/HimsPatientContext';

interface RegisterPatientModalProps {
  onClose: () => void;
}

export function RegisterPatientModal({ onClose }: RegisterPatientModalProps) {
  const { addPatient, getPatientByPhone } = useHimsPatients();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [prakriti, setPrakriti] = useState('');
  const [vikriti, setVikriti] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      setError('Please enter a valid age (0-120)');
      return;
    }

    // Check for duplicate
    const existing = getPatientByPhone(phone);
    if (existing) {
      setError(`A patient with this phone already exists: ${existing.name} (${existing.mrn}). Use Edit instead.`);
      return;
    }

    try {
      addPatient({
        name: name.trim(),
        age: ageNum,
        gender,
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        bloodGroup: bloodGroup || undefined,
        prakriti: prakriti || undefined,
        vikriti: vikriti || undefined,
        allergies: allergies.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Register New Patient" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <Input
          label="Full Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Patient's full name"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Age *"
            type="number"
            min={0}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Age in years"
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Gender *
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
              className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <Input
          label="Phone Number *"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit mobile number"
          required
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
            Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder="Full address"
            className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Blood Group
            </label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[44px]"
            >
              <option value="">Select</option>
              <option>A+</option><option>A-</option>
              <option>B+</option><option>B-</option>
              <option>O+</option><option>O-</option>
              <option>AB+</option><option>AB-</option>
            </select>
          </div>
          <Input
            label="Emergency Contact"
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            placeholder="Name & phone"
          />
        </div>

        <div className="border-t border-surface-200 dark:border-surface-700 pt-4">
          <p className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
            Ayurveda Assessment (Optional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs text-surface-500">Prakriti</label>
              <select
                value={prakriti}
                onChange={(e) => setPrakriti(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none min-h-[44px]"
              >
                <option value="">Select</option>
                <option>Vata</option><option>Pitta</option><option>Kapha</option>
                <option>Vata-Pitta</option><option>Pitta-Kapha</option>
                <option>Vata-Kapha</option><option>Sama</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-surface-500">Vikriti</label>
              <select
                value={vikriti}
                onChange={(e) => setVikriti(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none min-h-[44px]"
              >
                <option value="">Select</option>
                <option>Vata</option><option>Pitta</option><option>Kapha</option>
                <option>Vata-Pitta</option><option>Pitta-Kapha</option>
                <option>Vata-Kapha</option><option>Sama</option>
              </select>
            </div>
          </div>
        </div>

        <Input
          label="Allergies"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="Known allergies (food, medicine, etc.)"
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Register Patient
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

#### Step 3: Patient List Page

```typescript
// src/features/hims/pages/HimsPatients.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, User } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useHimsPatients } from '../contexts/HimsPatientContext';
import { RegisterPatientModal } from '../components/RegisterPatientModal';

export default function HimsPatients() {
  const navigate = useNavigate();
  const { patients, searchPatients } = useHimsPatients();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const filteredPatients = searchQuery ? searchPatients(searchQuery) : patients;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-white">Patients</h1>
            <p className="text-sm text-surface-500">{patients.length} registered</p>
          </div>
          <Button onClick={() => setShowRegister(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Register
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name, MRN, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white text-sm min-h-[48px]"
          />
        </div>

        {/* Patient List */}
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12 text-surface-500">
            <User className="w-12 h-12 mx-auto mb-4 text-surface-300" />
            <p className="text-lg mb-2">
              {searchQuery ? 'No patients found' : 'No patients registered'}
            </p>
            <p className="text-sm mb-4">
              {searchQuery ? 'Try a different search' : 'Register your first patient to get started'}
            </p>
            {!searchQuery && (
              <Button size="sm" onClick={() => setShowRegister(true)}>
                Register First Patient
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => navigate(`/hims/patients/${patient.id}`)}
                className="w-full bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 p-4 text-left hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-surface-900 dark:text-white">
                        {patient.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                        {patient.mrn}
                      </span>
                    </div>
                    <div className="text-sm text-surface-500 flex items-center gap-3">
                      <span>{patient.age}y, {patient.gender}</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {patient.phone}
                      </span>
                    </div>
                    {patient.prakriti && (
                      <div className="text-xs text-surface-400 mt-1">
                        Prakriti: {patient.prakriti}
                        {patient.vikriti && ` · Vikriti: ${patient.vikriti}`}
                      </div>
                    )}
                  </div>
                  <div className="text-surface-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showRegister && <RegisterPatientModal onClose={() => setShowRegister(false)} />}
    </div>
  );
}
```

#### Step 4: Patient Detail Page

```typescript
// src/features/hims/pages/HimsPatientDetail.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Droplets, AlertTriangle, Pencil, Receipt } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useHimsPatients } from '../contexts/HimsPatientContext';
import { useOpd } from '../contexts/OpdContext';
import { useBilling } from '../contexts/BillingContext';
import { EditPatientModal } from '../components/EditPatientModal';

export default function HimsPatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPatient } = useHimsPatients();
  const { getVisitsByPatient } = useOpd();
  const { getInvoicesByPatient } = useBilling();
  const [showEdit, setShowEdit] = useState(false);

  const patient = getPatient(id || '');
  const visits = id ? getVisitsByPatient(id) : [];
  const invoices = id ? getInvoicesByPatient(id) : [];

  if (!patient) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-surface-500 mb-4">Patient not found</p>
          <Button variant="secondary" onClick={() => navigate('/hims/patients')}>
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/hims/patients')}
          className="flex items-center gap-2 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 mb-4 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patients
        </button>

        {/* Patient Header */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-1">
                {patient.name}
              </h1>
              <span className="text-sm px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                {patient.mrn}
              </span>
            </div>
            <button
              onClick={() => setShowEdit(true)}
              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <Pencil className="w-5 h-5 text-surface-500" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-surface-500">Age/Gender:</span>
              <p className="font-medium text-surface-900 dark:text-white">
                {patient.age} years, {patient.gender}
              </p>
            </div>
            <div>
              <span className="text-surface-500">Phone:</span>
              <p className="font-medium text-surface-900 dark:text-white flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {patient.phone}
              </p>
            </div>
            {patient.email && (
              <div>
                <span className="text-surface-500">Email:</span>
                <p className="font-medium text-surface-900 dark:text-white flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {patient.email}
                </p>
              </div>
            )}
            {patient.bloodGroup && (
              <div>
                <span className="text-surface-500">Blood Group:</span>
                <p className="font-medium text-surface-900 dark:text-white flex items-center gap-1">
                  <Droplets className="w-3 h-3" />
                  {patient.bloodGroup}
                </p>
              </div>
            )}
          </div>

          {/* Ayurveda Details */}
          {(patient.prakriti || patient.vikriti) && (
            <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {patient.prakriti && (
                  <div>
                    <span className="text-surface-500">Prakriti:</span>
                    <p className="font-medium text-surface-900 dark:text-white">{patient.prakriti}</p>
                  </div>
                )}
                {patient.vikriti && (
                  <div>
                    <span className="text-surface-500">Vikriti:</span>
                    <p className="font-medium text-surface-900 dark:text-white">{patient.vikriti}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {patient.allergies && (
            <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <span className="text-surface-500">Allergies:</span>
                  <p className="font-medium text-amber-700 dark:text-amber-400">{patient.allergies}</p>
                </div>
              </div>
            </div>
          )}

          {patient.address && (
            <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 text-sm">
              <span className="text-surface-500">Address:</span>
              <p className="text-surface-900 dark:text-white">{patient.address}</p>
            </div>
          )}

          {patient.emergencyContact && (
            <div className="mt-2 text-sm">
              <span className="text-surface-500">Emergency Contact:</span>
              <p className="text-surface-900 dark:text-white">{patient.emergencyContact}</p>
            </div>
          )}
        </div>

        {/* Visit History */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
          <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
            <h2 className="font-medium text-surface-900 dark:text-white">
              Visit History ({visits.length})
            </h2>
          </div>
          <div className="divide-y divide-surface-100 dark:divide-surface-700">
            {visits.length === 0 ? (
              <div className="px-4 py-8 text-center text-surface-500 text-sm">
                No visits recorded
              </div>
            ) : (
              visits.map((visit) => (
                <div key={visit.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-surface-900 dark:text-white">
                      {new Date(visit.visitDate).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      {invoices.some((inv) => inv.visitId === visit.id) && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Receipt className="w-3 h-3" /> Billed
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        visit.status === 'completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {visit.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-surface-500">
                    {visit.doctorName} · {visit.chiefComplaint}
                  </div>
                  {visit.diagnosis && (
                    <div className="text-sm text-surface-600 dark:text-surface-300 mt-1">
                      Diagnosis: {visit.diagnosis}
                    </div>
                  )}
                  {visit.prescription.length > 0 && (
                    <div className="mt-2 text-xs text-surface-500">
                      Rx: {visit.prescription.map((p) => p.medicine).join(', ')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showEdit && <EditPatientModal patient={patient} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
```

### F.2 OPD Visit Management — Full Implementation

#### OPD Context

```typescript
// src/features/hims/contexts/OpdContext.tsx
import { createContext, useContext, useCallback, useMemo } from 'react';
import type { OpdVisit, PrescriptionItem } from '../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface OpdContextType {
  visits: OpdVisit[];
  addVisit: (visit: Omit<OpdVisit, 'id' | 'visitDate'>) => void;
  updateVisitStatus: (id: string, status: OpdVisit['status']) => void;
  updateVisit: (id: string, updates: Partial<OpdVisit>) => void;
  getVisit: (id: string) => OpdVisit | undefined;
  getVisitsByPatient: (patientId: string) => OpdVisit[];
  getTodayVisits: () => OpdVisit[];
  getVisitsByDate: (date: string) => OpdVisit[];
  getVisitsByDoctor: (doctorName: string) => OpdVisit[];
}

const OpdContext = createContext<OpdContextType | null>(null);

export function OpdProvider({ children }: { children: React.ReactNode }) {
  const [visits, setVisits] = useLocalStorage<OpdVisit[]>('hims_visits', []);

  const addVisit = useCallback(
    (data: Omit<OpdVisit, 'id' | 'visitDate'>) => {
      const newVisit: OpdVisit = {
        ...data,
        id: `vst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        visitDate: new Date().toISOString(),
      };
      setVisits((prev) => [newVisit, ...prev]);
    },
    [setVisits]
  );

  const updateVisitStatus = useCallback(
    (id: string, status: OpdVisit['status']) => {
      setVisits((prev) => prev.map(v => (v.id === id ? { ...v, status } : v)));
    },
    [setVisits]
  );

  const updateVisit = useCallback(
    (id: string, updates: Partial<OpdVisit>) => {
      setVisits((prev) => prev.map(v => (v.id === id ? { ...v, ...updates } : v)));
    },
    [setVisits]
  );

  const getVisit = useCallback((id: string) => visits.find(v => v.id === id), [visits]);

  const getVisitsByPatient = useCallback(
    (patientId: string) => visits.filter(v => v.patientId === patientId),
    [visits]
  );

  const getTodayVisits = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return visits.filter(v => v.visitDate.startsWith(today));
  }, [visits]);

  const getVisitsByDate = useCallback(
    (date: string) => visits.filter(v => v.visitDate.startsWith(date)),
    [visits]
  );

  const getVisitsByDoctor = useCallback(
    (doctorName: string) => visits.filter(v => v.doctorName === doctorName),
    [visits]
  );

  return (
    <OpdContext.Provider
      value={{
        visits,
        addVisit,
        updateVisitStatus,
        updateVisit,
        getVisit,
        getVisitsByPatient,
        getTodayVisits,
        getVisitsByDate,
        getVisitsByDoctor,
      }}
    >
      {children}
    </OpdContext.Provider>
  );
}

export function useOpd() {
  const context = useContext(OpdContext);
  if (!context) throw new Error('useOpd must be used within OpdProvider');
  return context;
}
```

### F.3 Billing Context — Full Implementation

```typescript
// src/features/hims/contexts/BillingContext.tsx
import { createContext, useContext, useCallback, useMemo } from 'react';
import type { Invoice, InvoiceItem } from '../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface BillingContextType {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  getInvoice: (id: string) => Invoice | undefined;
  getInvoicesByPatient: (patientId: string) => Invoice[];
  getInvoicesByDate: (date: string) => Invoice[];
  getTodayRevenue: () => number;
  getMonthRevenue: () => number;
  getPendingAmount: () => number;
}

const BillingContext = createContext<BillingContextType | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('hims_invoices', []);

  const generateInvoiceNumber = useCallback((existing: Invoice[]): string => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const todayPrefix = `INV-${dateStr}-`;
    const todayCount = existing.filter(i => i.invoiceNumber.startsWith(todayPrefix)).length;
    const sequence = (todayCount + 1).toString().padStart(3, '0');
    return `${todayPrefix}${sequence}`;
  }, []);

  const addInvoice = useCallback(
    (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Invoice => {
      const newInvoice: Invoice = {
        ...data,
        id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        invoiceNumber: generateInvoiceNumber(invoices),
        createdAt: new Date().toISOString(),
      };
      setInvoices((prev) => [newInvoice, ...prev]);
      return newInvoice;
    },
    [invoices, setInvoices, generateInvoiceNumber]
  );

  const updateInvoice = useCallback(
    (id: string, updates: Partial<Invoice>) => {
      setInvoices((prev) => prev.map(i => (i.id === id ? { ...i, ...updates } : i)));
    },
    [setInvoices]
  );

  const getInvoice = useCallback((id: string) => invoices.find(i => i.id === id), [invoices]);

  const getInvoicesByPatient = useCallback(
    (patientId: string) => invoices.filter(i => i.patientId === patientId),
    [invoices]
  );

  const getInvoicesByDate = useCallback(
    (date: string) => invoices.filter(i => i.createdAt.startsWith(date)),
    [invoices]
  );

  const getTodayRevenue = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return invoices
      .filter(i => i.createdAt.startsWith(today))
      .reduce((sum, i) => sum + i.total, 0);
  }, [invoices]);

  const getMonthRevenue = useCallback(() => {
    const monthPrefix = new Date().toISOString().slice(0, 7);
    return invoices
      .filter(i => i.createdAt.startsWith(monthPrefix))
      .reduce((sum, i) => sum + i.total, 0);
  }, [invoices]);

  const getPendingAmount = useCallback(() => {
    return invoices
      .filter(i => i.paymentStatus === 'pending' || i.paymentStatus === 'partial')
      .reduce((sum, i) => sum + (i.total - i.paidAmount), 0);
  }, [invoices]);

  return (
    <BillingContext.Provider
      value={{
        invoices,
        addInvoice,
        updateInvoice,
        getInvoice,
        getInvoicesByPatient,
        getInvoicesByDate,
        getTodayRevenue,
        getMonthRevenue,
        getPendingAmount,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) throw new Error('useBilling must be used within BillingProvider');
  return context;
}
```

### F.4 Pharmacy Context — Full Implementation

```typescript
// src/features/hims/contexts/PharmacyContext.tsx
import { createContext, useContext, useCallback, useMemo } from 'react';
import type { Medicine, DispensingRecord } from '../types';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

interface PharmacyContextType {
  medicines: Medicine[];
  lowStockMedicines: Medicine[];
  dispensingRecords: DispensingRecord[];
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt'>) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  dispenseMedicine: (
    medicineId: string,
    quantity: number,
    patientId: string,
    patientName: string,
    visitId: string,
    dispensedBy: string
  ) => DispensingRecord | null;
  getMedicine: (id: string) => Medicine | undefined;
  searchMedicines: (query: string) => Medicine[];
  getDispensingByVisit: (visitId: string) => DispensingRecord[];
}

const PharmacyContext = createContext<PharmacyContextType | null>(null);

export function PharmacyProvider({ children }: { children: React.ReactNode }) {
  const [medicines, setMedicines] = useLocalStorage<Medicine[]>('hims_medicines', []);
  const [dispensingRecords, setDispensingRecords] = useLocalStorage<DispensingRecord[]>('hims_dispensing', []);

  const lowStockMedicines = useMemo(
    () => medicines.filter(m => m.quantity <= m.reorderLevel),
    [medicines]
  );

  const addMedicine = useCallback(
    (data: Omit<Medicine, 'id' | 'createdAt'>) => {
      const newMedicine: Medicine = {
        ...data,
        id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      };
      setMedicines((prev) => [newMedicine, ...prev]);
    },
    [setMedicines]
  );

  const updateMedicine = useCallback(
    (id: string, updates: Partial<Medicine>) => {
      setMedicines((prev) => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
    },
    [setMedicines]
  );

  const deleteMedicine = useCallback(
    (id: string) => {
      setMedicines((prev) => prev.filter(m => m.id !== id));
    },
    [setMedicines]
  );

  const dispenseMedicine = useCallback(
    (
      medicineId: string,
      quantity: number,
      patientId: string,
      patientName: string,
      visitId: string,
      dispensedBy: string
    ): DispensingRecord | null => {
      const medicine = medicines.find(m => m.id === medicineId);
      if (!medicine || medicine.quantity < quantity) return null;

      const record: DispensingRecord = {
        id: `disp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        patientId,
        patientName,
        visitId,
        medicineId,
        medicineName: medicine.name,
        quantityDispensed: quantity,
        unit: medicine.unit,
        dispensedBy,
        dispensedAt: new Date().toISOString(),
      };

      setMedicines((prev) =>
        prev.map(m =>
          m.id === medicineId
            ? { ...m, quantity: Math.max(0, m.quantity - quantity) }
            : m
        )
      );
      setDispensingRecords((prev) => [record, ...prev]);
      return record;
    },
    [medicines, setMedicines, setDispensingRecords]
  );

  const getMedicine = useCallback(
    (id: string) => medicines.find(m => m.id === id),
    [medicines]
  );

  const searchMedicines = useCallback(
    (query: string) => {
      const q = query.toLowerCase();
      return medicines.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.manufacturer?.toLowerCase().includes(q)
      );
    },
    [medicines]
  );

  const getDispensingByVisit = useCallback(
    (visitId: string) => dispensingRecords.filter(r => r.visitId === visitId),
    [dispensingRecords]
  );

  return (
    <PharmacyContext.Provider
      value={{
        medicines,
        lowStockMedicines,
        dispensingRecords,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        dispenseMedicine,
        getMedicine,
        searchMedicines,
        getDispensingByVisit,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
}

export function usePharmacy() {
  const context = useContext(PharmacyContext);
  if (!context) throw new Error('usePharmacy must be used within PharmacyProvider');
  return context;
}
```

### F.5 useLocalStorage Hook — Complete Implementation

```typescript
// src/hooks/useLocalStorage.ts
import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: React.SetStateAction<T>) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
```

### F.6 App.tsx — Complete HIMS Routing

```typescript
// src/App.tsx — HIMS routes section
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HimsLayout } from './features/hims/layout/HimsLayout';
import { HimsPatientProvider } from './features/hims/contexts/HimsPatientContext';
import { OpdProvider } from './features/hims/contexts/OpdContext';
import { BillingProvider } from './features/hims/contexts/BillingContext';
import { PharmacyProvider } from './features/hims/contexts/PharmacyContext';

const HimsDashboard = lazy(() => import('./features/hims/pages/HimsDashboard'));
const HimsPatients = lazy(() => import('./features/hims/pages/HimsPatients'));
const HimsPatientDetail = lazy(() => import('./features/hims/pages/HimsPatientDetail'));
const HimsOPD = lazy(() => import('./features/hims/pages/HimsOPD'));
const HimsBilling = lazy(() => import('./features/hims/pages/HimsBilling'));
const HimsPharmacy = lazy(() => import('./features/hims/pages/HimsPharmacy'));

function HimsLoading() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ... other routes ... */}
      
      <Route
        path="/hims"
        element={
          <HimsPatientProvider>
            <OpdProvider>
              <BillingProvider>
                <PharmacyProvider>
                  <HimsLayout />
                </PharmacyProvider>
              </BillingProvider>
            </OpdProvider>
          </HimsPatientProvider>
        }
      >
        <Route index element={<Navigate to="/hims/dashboard" replace />} />
        <Route path="dashboard" element={<Suspense fallback={<HimsLoading />}><HimsDashboard /></Suspense>} />
        <Route path="patients" element={<Suspense fallback={<HimsLoading />}><HimsPatients /></Suspense>} />
        <Route path="patients/:id" element={<Suspense fallback={<HimsLoading />}><HimsPatientDetail /></Suspense>} />
        <Route path="opd" element={<Suspense fallback={<HimsLoading />}><HimsOPD /></Suspense>} />
        <Route path="billing" element={<Suspense fallback={<HimsLoading />}><HimsBilling /></Suspense>} />
        <Route path="pharmacy" element={<Suspense fallback={<HimsLoading />}><HimsPharmacy /></Suspense>} />
      </Route>
    </Routes>
  );
}
```

### F.7 Dashboard — Complete Implementation

```typescript
// src/features/hims/pages/HimsDashboard.tsx
import { Users, Stethoscope, IndianRupee, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHimsPatients } from '../contexts/HimsPatientContext';
import { useOpd } from '../contexts/OpdContext';
import { useBilling } from '../contexts/BillingContext';
import { usePharmacy } from '../contexts/PharmacyContext';
import { HimsStatsCard } from '../layout/HimsStatsCard';

export default function HimsDashboard() {
  const navigate = useNavigate();
  const { patients } = useHimsPatients();
  const { visits } = useOpd();
  const { invoices, getTodayRevenue, getMonthRevenue } = useBilling();
  const { lowStockMedicines } = usePharmacy();

  const today = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => v.visitDate.startsWith(today));
  const recentVisits = visits.slice(0, 5);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-surface-900 dark:text-white mb-6">
          HIMS Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <HimsStatsCard
            label="Total Patients"
            value={patients.length}
            icon={<Users className="w-5 h-5" />}
            color="emerald"
            onClick={() => navigate('/hims/patients')}
          />
          <HimsStatsCard
            label="Today's OPD"
            value={todayVisits.length}
            icon={<Stethoscope className="w-5 h-5" />}
            color="blue"
            onClick={() => navigate('/hims/opd')}
          />
          <HimsStatsCard
            label="This Month"
            value={`₹${getMonthRevenue().toLocaleString('en-IN')}`}
            icon={<IndianRupee className="w-5 h-5" />}
            color="green"
            onClick={() => navigate('/hims/billing')}
          />
          <HimsStatsCard
            label="Low Stock"
            value={lowStockMedicines.length}
            icon={<AlertTriangle className="w-5 h-5" />}
            color={lowStockMedicines.length > 0 ? 'amber' : 'gray'}
            onClick={() => navigate('/hims/pharmacy')}
          />
        </div>

        {/* Recent Visits */}
        <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 mb-6">
          <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
            <h2 className="font-medium text-surface-900 dark:text-white">Recent Visits</h2>
          </div>
          {recentVisits.length === 0 ? (
            <div className="px-4 py-8 text-center text-surface-500 text-sm">
              No visits recorded yet
            </div>
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {recentVisits.map((visit) => (
                <div key={visit.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-white text-sm">
                      {visit.patientName}
                    </p>
                    <p className="text-xs text-surface-500">
                      {visit.doctorName} · {visit.chiefComplaint}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    visit.status === 'completed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : visit.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {visit.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        {lowStockMedicines.length > 0 && (
          <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
              <h2 className="font-medium text-surface-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Low Stock Alert
              </h2>
            </div>
            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {lowStockMedicines.slice(0, 5).map((med) => (
                <div key={med.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-surface-900 dark:text-white text-sm">{med.name}</p>
                    <p className="text-xs text-surface-500">{med.category}</p>
                  </div>
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {med.quantity} {med.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### F.8 Stats Card Component

```typescript
// src/features/hims/layout/HimsStatsCard.tsx
import React from 'react';

interface HimsStatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'green' | 'amber' | 'gray';
  onClick?: () => void;
}

const colorStyles = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  gray: 'bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400',
};

export function HimsStatsCard({ label, value, icon, color, onClick }: HimsStatsCardProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 text-left hover:shadow-md transition-shadow min-h-[44px] ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorStyles[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-surface-500">{label}</p>
          <p className="text-xl font-bold text-surface-900 dark:text-white">{value}</p>
        </div>
      </div>
    </button>
  );
}
```

### F.9 Layout Components

#### HimsLayout

```typescript
// src/features/hims/layout/HimsLayout.tsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { HimsHeader } from './HimsHeader';
import { HimsSidebar } from './HimsSidebar';
import { HimsBottomTabs } from './HimsBottomTabs';

export function HimsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-surface-50 dark:bg-surface-950">
      <HimsHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar — desktop only */}
        <div className="hidden md:block">
          <HimsSidebar isOpen={sidebarOpen} />
        </div>
        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      {/* Bottom tabs — mobile only */}
      <div className="md:hidden">
        <HimsBottomTabs />
      </div>
    </div>
  );
}
```

#### HimsHeader

```typescript
// src/features/hims/layout/HimsHeader.tsx
import { useNavigate } from 'react-router-dom';
import { Menu, Home } from 'lucide-react';

interface HimsHeaderProps {
  onToggleSidebar: () => void;
}

export function HimsHeader({ onToggleSidebar }: HimsHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 flex items-center px-4 gap-3 shrink-0">
      <button
        onClick={onToggleSidebar}
        className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <Menu className="w-5 h-5 text-surface-600 dark:text-surface-400" />
      </button>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 min-h-[44px] px-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg"
      >
        <Home className="w-4 h-4 text-surface-500" />
        <span className="text-sm text-surface-500 hidden sm:inline">Home</span>
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">H</span>
        </div>
        <span className="text-sm font-medium text-surface-900 dark:text-white hidden sm:inline">
          HIMS
        </span>
      </div>
    </header>
  );
}
```

#### HimsSidebar

```typescript
// src/features/hims/layout/HimsSidebar.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, Receipt, Pill } from 'lucide-react';

interface HimsSidebarProps {
  isOpen: boolean;
}

const NAV_ITEMS = [
  { path: '/hims/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/hims/patients', label: 'Patients', icon: Users },
  { path: '/hims/opd', label: 'OPD', icon: Stethoscope },
  { path: '/hims/billing', label: 'Billing', icon: Receipt },
  { path: '/hims/pharmacy', label: 'Pharmacy', icon: Pill },
];

export function HimsSidebar({ isOpen }: HimsSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className={`h-full bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700 transition-all duration-200 ${
        isOpen ? 'w-60' : 'w-16'
      }`}
    >
      <div className="py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-r-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

#### HimsBottomTabs

```typescript
// src/features/hims/layout/HimsBottomTabs.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, Receipt, Pill } from 'lucide-react';

const TAB_ITEMS = [
  { path: '/hims/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/hims/patients', label: 'Patients', icon: Users },
  { path: '/hims/opd', label: 'OPD', icon: Stethoscope },
  { path: '/hims/billing', label: 'Billing', icon: Receipt },
  { path: '/hims/pharmacy', label: 'Pharmacy', icon: Pill },
];

export function HimsBottomTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="h-16 bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 flex items-center justify-around px-2">
      {TAB_ITEMS.map((item) => {
        const isActive = location.pathname.startsWith(item.path);
        const Icon = item.icon;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-h-[44px] min-w-[44px] ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-surface-500 dark:text-surface-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

---

## Appendix G: Ayurveda-Specific Data Models (Expanded)

### G.1 Detailed Dosha Assessment Model

```typescript
interface DoshaAssessment {
  // Prakriti (Constitution)
  prakriti: {
    vata: number;      // 0-100 percentage
    pitta: number;
    kapha: number;
    predominant: 'Vata' | 'Pitta' | 'Kapha' | 'Vata-Pitta' | 'Pitta-Kapha' | 'Vata-Kapha' | 'Sama';
  };
  
  // Vikriti (Current Imbalance)
  vikriti: {
    vata: number;
    pitta: number;
    kapha: number;
    predominant: 'Vata' | 'Pitta' | 'Kapha' | 'Vata-Pitta' | 'Pitta-Kapha' | 'Vata-Kapha' | 'Sama';
  };
  
  // Agni (Digestive Fire)
  agni: 'Tikshna' | 'Sama' | 'Vishama' | 'Manda' | 'Sama';
  
  // Ama (Toxins)
  ama: 'Present' | 'Absent' | 'Suspected';
  
  // Koshta (Bowel Habit)
  koshta: 'Regular' | 'Irregular' | 'Constipated' | 'Loose';
  
  // Sara (Tissue Essence)
  sara: {
    rasa: 'Pravara' | 'Madhyama' | 'Avara';
    rakta: 'Pravara' | 'Madhyama' | 'Avara';
    mamsa: 'Pravara' | 'Madhyama' | 'Avara';
    meda: 'Pravara' | 'Madhyama' | 'Avara';
    asthi: 'Pravara' | 'Madhyama' | 'Avara';
    majja: 'Pravara' | 'Madhyama' | 'Avara';
    shukra: 'Pravara' | 'Madhyama' | 'Avara';
  };
  
  // Samhanana (Body Compactness)
  samhanana: 'Pravara' | 'Madhyama' | 'Avara';
  
  // Pramana (Body Measurements)
  pramana: {
    height: number;    // cm
    weight: number;    // kg
    chest: number;     // cm
    waist: number;     // cm
  };
  
  // Satmya (Adaptability)
  satmya: 'Sattvika' | 'Rajasika' | 'Tamasika';
  
  // Sattva (Mental Constitution)
  sattva: 'Sattvika' | 'Rajasika' | 'Tamasika';
  
  // Ahara Shakti (Digestive Capacity)
  aharaShakti: 'Pravara' | 'Madhyama' | 'Avara';
  
  // Vyayama Shakti (Exercise Capacity)
  vyayamaShakti: 'Pravara' | 'Madhyama' | 'Avara';
  
  // Vaya (Age Assessment)
  vaya: 'Bala' | 'Madhya' | 'Jirna';  // Young, Middle, Old
}
```

### G.2 Panchakarma Protocol Model

```typescript
interface PanchakarmaProtocol {
  id: string;
  patientId: string;
  visitId: string;
  
  // Pre-therapeutic assessment
  preAssessment: {
    agni: string;
    ama: string;
    doshaPredominant: string;
    contraindications: string[];
    fitnessScore: number;  // 1-10
  };
  
  // Treatment phases
  phases: PanchakarmaPhase[];
  
  // Post-therapy instructions
  postInstructions: {
    pathya: string[];     // Wholesome foods/activities
    apathya: string[];    // Unwholesome foods/activities
    duration: string;     // e.g., '7 days'
  };
  
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
}

interface PanchakarmaPhase {
  name: 'Poorvakarma' | 'Pradhanakarma' | 'Paschatkarma';
  therapies: PanchakarmaTherapy[];
}

interface PanchakarmaTherapy {
  type: 'Snehana' | 'Swedana' | 'Vamana' | 'Virechana' | 'Basti' | 'Nasya' | 'Raktamokshana';
  sessions: TherapySession[];
  totalSessions: number;
  completedSessions: number;
}

interface TherapySession {
  id: string;
  date: string;
  time: string;
  therapist: string;
  duration: number;      // minutes
  oils?: string[];
  medicines?: string[];
  observations?: string;
  patientResponse?: string;
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled';
}
```

### G.3 Ayurveda Prescription Template Model

```typescript
interface AyurvedaPrescriptionTemplate {
  id: string;
  name: string;                  // 'Amavata Protocol', 'Kasa Protocol'
  condition: string;             // 'Rheumatoid Arthritis', 'Cough'
  doshaImbalance: string;        // 'Vata-Kapha'
  
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    anupana: string;
    kala: string;
    instructions: string;
  }[];
  
  pathya: string[];              // Diet/lifestyle recommendations
  apathya: string[];             // Restrictions
  followUpDays: number;          // Follow-up after X days
  
  createdBy: string;
  createdAt: string;
}
```

---

## Appendix H: Common UI Patterns for HIMS

### H.1 Search with Autocomplete

```typescript
interface SearchAutocompleteProps {
  items: any[];
  searchFields: string[];
  onSelect: (item: any) => void;
  placeholder: string;
  renderResult: (item: any) => React.ReactNode;
}

function SearchAutocomplete({ items, searchFields, onSelect, placeholder, renderResult }: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const filtered = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return items.filter(item =>
      searchFields.some(field =>
        String(item[field]).toLowerCase().includes(q)
      )
    ).slice(0, 5);
  }, [query, items, searchFields]);
  
  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none min-h-[44px]"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg">
          {filtered.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { onSelect(item); setQuery(''); setIsOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-surface-50 dark:hover:bg-surface-700 border-b border-surface-100 dark:border-surface-700 last:border-0 min-h-[44px]"
            >
              {renderResult(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### H.2 Date Picker with Quick Navigation

```typescript
interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  showQuickNav?: boolean;
}

function DatePicker({ value, onChange, showQuickNav = true }: DatePickerProps) {
  const goToToday = () => onChange(new Date().toISOString().split('T')[0]);
  const goToPrevDay = () => {
    const d = new Date(value + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    onChange(d.toISOString().split('T')[0]);
  };
  const goToNextDay = () => {
    const d = new Date(value + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    onChange(d.toISOString().split('T')[0]);
  };
  
  return (
    <div className="flex items-center gap-2">
      {showQuickNav && (
        <>
          <button onClick={goToPrevDay} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goToToday} className="px-3 py-2 text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg min-h-[44px]">
            Today
          </button>
          <button onClick={goToNextDay} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 text-sm rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 outline-none min-h-[44px]"
      />
    </div>
  );
}
```

### H.3 Status Workflow Component

```typescript
interface StatusWorkflowProps {
  currentStatus: string;
  validTransitions: Record<string, string[]>;
  onTransition: (newStatus: string) => void;
}

function StatusWorkflow({ currentStatus, validTransitions, onTransition }: StatusWorkflowProps) {
  const nextStatuses = validTransitions[currentStatus] || [];
  
  if (nextStatuses.length === 0) {
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
        currentStatus === 'completed'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-surface-100 text-surface-500 dark:bg-surface-800'
      }`}>
        {currentStatus}
      </span>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
        currentStatus === 'in-progress'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      }`}>
        {currentStatus}
      </span>
      {nextStatuses.map((status) => (
        <button
          key={status}
          onClick={() => onTransition(status)}
          className={`text-xs px-2 py-1 rounded font-medium min-h-[32px] ${
            status === 'completed'
              ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
              : status === 'cancelled'
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
        </button>
      ))}
    </div>
  );
}
```

### H.4 Empty State with Action

```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-12 text-surface-500">
      <div className="w-12 h-12 mx-auto mb-4 text-surface-300">{icon}</div>
      <p className="text-lg mb-2">{title}</p>
      <p className="text-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
```

### H.5 Confirmation Dialog

```typescript
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    info: 'bg-emerald-600 hover:bg-emerald-700',
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-900 rounded-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-surface-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">{cancelLabel}</Button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium min-h-[44px] ${variantStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Appendix I: Data Validation Patterns

### I.1 Phone Validation

```typescript
function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) return { valid: false, error: 'Phone number is required' };
  if (!/^\d{10}$/.test(phone)) return { valid: false, error: 'Must be 10 digits' };
  if (!/^[6-9]/.test(phone)) return { valid: false, error: 'Must start with 6, 7, 8, or 9' };
  return { valid: true };
}
```

### I.2 Email Validation

```typescript
function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: true }; // Optional field
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) return { valid: false, error: 'Invalid email format' };
  return { valid: true };
}
```

### I.3 Age Validation

```typescript
function validateAge(age: string): { valid: boolean; error?: string } {
  if (!age) return { valid: false, error: 'Age is required' };
  const num = parseInt(age, 10);
  if (isNaN(num)) return { valid: false, error: 'Age must be a number' };
  if (num < 0) return { valid: false, error: 'Age cannot be negative' };
  if (num > 120) return { valid: false, error: 'Age seems unrealistic' };
  return { valid: true };
}
```

### I.4 Required Field Validation

```typescript
function validateRequired(value: string, fieldName: string): { valid: boolean; error?: string } {
  if (!value || value.trim().length === 0) {
    return { valid: false, error: `${fieldName} is required` };
  }
  if (value.trim().length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }
  return { valid: true };
}
```

### I.5 Amount Validation

```typescript
function validateAmount(amount: string, fieldName: string): { valid: boolean; error?: string } {
  if (!amount) return { valid: false, error: `${fieldName} is required` };
  const num = parseFloat(amount);
  if (isNaN(num)) return { valid: false, error: `${fieldName} must be a number` };
  if (num < 0) return { valid: false, error: `${fieldName} cannot be negative` };
  if (num > 10000000) return { valid: false, error: `${fieldName} seems too high` };
  return { valid: true };
}
```

### I.6 Form Validation Hook

```typescript
function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = (validations: { field: string; result: { valid: boolean; error?: string } }[]): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    for (const { field, result } of validations) {
      if (!result.valid) {
        newErrors[field] = result.error || 'Invalid';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const clearErrors = () => setErrors({});
  const getFieldError = (field: string) => errors[field];
  
  return { errors, validate, clearErrors, getFieldError };
}
```

---

## Appendix J: Accessibility Patterns for Healthcare

### J.1 ARIA Labels

```tsx
// Form fields must have associated labels
<label htmlFor="patient-name" className="block text-sm font-medium">
  Patient Name *
</label>
<input id="patient-name" type="text" aria-required="true" aria-describedby="name-help" />
<p id="name-help" className="text-xs text-surface-500">Enter full name as per ID</p>

// Buttons must have accessible names
<button aria-label="Close modal">
  <X className="w-5 h-5" />
</button>

// Status badges should announce their meaning
<span role="status" aria-label={`Visit status: ${status}`}>
  {status}
</span>
```

### J.2 Keyboard Navigation

```tsx
// Modal trap focus
useEffect(() => {
  if (isOpen) {
    const firstFocusable = modalRef.current?.querySelector('input, button');
    firstFocusable?.focus();
  }
}, [isOpen]);

// Escape key closes modal
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [onClose]);
```

### J.3 Color Contrast

All text must meet WCAG AA contrast requirements:
- Normal text: 4.5:1 contrast ratio minimum
- Large text (18px+ bold or 24px+ regular): 3:1 minimum

**Tailwind classes that ensure contrast**:
- `text-surface-900 dark:text-white` on white/dark backgrounds
- `text-surface-500` for secondary text (check contrast)
- `text-emerald-600 dark:text-emerald-400` for links/actions

### J.4 Screen Reader Announcements

```tsx
// Live region for dynamic updates
<div aria-live="polite" className="sr-only">
  {notification && <p>{notification}</p>}
</div>

// Announce form submission success
<div role="alert" className="bg-green-50 text-green-700 p-3 rounded-lg">
  Patient registered successfully
</div>
```

---

## Appendix K: Performance Benchmarks

### K.1 Target Response Times

| Operation | Target | Acceptable |
|-----------|--------|------------|
| Page load | < 1s | < 2s |
| Search results | < 100ms | < 300ms |
| Form submission | < 200ms | < 500ms |
| Status update | < 100ms | < 200ms |
| Invoice creation | < 300ms | < 1s |
| Stock dispensing | < 200ms | < 500ms |

### K.2 Bundle Size Budget

| Module | Target | Max |
|--------|--------|-----|
| HIMS total | 100KB | 150KB |
| AyurGPT total | 200KB | 300KB |
| Shared components | 50KB | 75KB |
| Total app | 350KB | 500KB |

### K.3 localStorage Limits

| Key | Max Records | Avg Size | Total |
|-----|-------------|----------|-------|
| hims_patients | 10,000 | 500B | 5MB |
| hims_visits | 50,000 | 400B | 20MB |
| hims_invoices | 50,000 | 300B | 15MB |
| hims_medicines | 1,000 | 300B | 300KB |
| hims_dispensing | 100,000 | 200B | 20MB |

**Note**: localStorage has ~5MB limit per domain. For production, migrate to Supabase when approaching limits.

---

## Appendix L: Deployment Checklist

### L.1 Pre-Deployment Checks

```bash
# 1. TypeScript compilation
npx tsc --noEmit

# 2. Build production bundle
npx vite build

# 3. Check bundle size
ls -la dist/assets/

# 4. Preview locally
npx vite preview

# 5. Run any existing tests
npm test
```

### L.2 Environment Variables

Ensure these are set in Vercel:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `GOOGLE_OAUTH_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` — Google OAuth client secret
- `NVIDIA_API_KEY` — NVIDIA NIM API key

### L.3 Post-Deployment Verification

1. Visit `assistant.ayurvrittaayurveda.in`
2. Login with Google OAuth
3. Verify selection page loads
4. Navigate to HIMS → Dashboard
5. Register a test patient
6. Create an OPD visit
7. Create an invoice
8. Add a medicine and dispense
9. Verify all data persists after page refresh

### L.4 Rollback Procedure

1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Verify the site works
5. Fix the issue in code
6. Push and deploy again

---

---

## Appendix M: Complete Error Catalog & Fixes

### M.1 Data Type Errors

#### M.1.1 "Cannot read properties of undefined (reading 'name')"

**Root Cause**: Accessing a property on an object that is `undefined`.

**Common Locations**:
- Patient detail page when patient not found
- Visit detail when visit is deleted
- Medicine lookup when medicine is dispensed but deleted

**Prevention Pattern**:
```typescript
// WRONG — crashes if patient is undefined
const patient = getPatient(id);
return <div>{patient.name}</div>;

// CORRECT — null check first
const patient = getPatient(id);
if (!patient) {
  return <NotFound message="Patient not found" />;
}
return <div>{patient.name}</div>;
```

**Another Common Pattern — Optional Chaining**:
```typescript
// Safe access with optional chaining
const doctorName = visit?.doctorName ?? 'Unknown Doctor';
const medicinePrice = medicine?.price ?? 0;
const prescriptionCount = visit?.prescription?.length ?? 0;
```

#### M.1.2 "NaN is not a valid number"

**Root Cause**: Parsing undefined, null, or empty string as number.

**Common Locations**:
- Invoice total calculation
- Age display
- Price calculations
- Stock quantity display

**Prevention Pattern**:
```typescript
// WRONG
const total = parseFloat(items.reduce((sum, item) => sum + item.total, 0));
const age = parseInt(patient.age);

// CORRECT — always provide defaults
const total = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
const age = Number(patient.age) || 0;
const displayAge = `${age} years`;
```

**Invoice Total Calculation — Bulletproof Version**:
```typescript
function calculateInvoiceTotal(invoice: Invoice): number {
  const subtotal = invoice.items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + (qty * price);
  }, 0);
  
  const discount = Number(invoice.discount) || 0;
  const total = subtotal - discount;
  
  return Math.round(total * 100) / 100; // Round to 2 decimal places
}
```

#### M.1.3 "Invalid date" display

**Root Cause**: Date string format is unexpected or undefined.

**Common Locations**:
- Visit date display
- Invoice date display
- Medicine expiry date

**Prevention Pattern**:
```typescript
// WRONG
const date = new Date(visit.visitDate).toLocaleDateString();
// Crashes if visitDate is undefined or empty

// CORRECT — validate before formatting
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

// Usage
<p>{formatDate(visit.visitDate)}</p>
```

#### M.1.4 "Objects are not valid as React child"

**Root Cause**: Trying to render an object instead of a string/number.

**Common Locations**:
- Displaying patient data that might be an object
- Rendering API responses

**Prevention Pattern**:
```typescript
// WRONG — if patient is an object, this crashes
<p>{patient}</p>

// CORRECT — always render specific properties
<p>{typeof patient === 'object' ? patient.name : String(patient)}</p>

// Or use a display helper
function displayValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
```

### M.2 State Management Errors

#### M.2.1 Infinite Re-render Loop

**Root Cause**: useEffect dependency array includes values that change on every render.

**Common Locations**:
- Auto-fetching data on component mount
- Real-time updates
- Search with debounce

**Prevention Pattern**:
```typescript
// WRONG — causes infinite loop
useEffect(() => {
  setFilteredPatients(searchPatients(query));
}, [filteredPatients, query]); // filteredPatients changes → re-render → changes again

// CORRECT — use useMemo for derived state
const filteredPatients = useMemo(
  () => searchPatients(query),
  [query, patients] // Only recompute when query or patients change
);

// CORRECT — for side effects
useEffect(() => {
  // This effect only runs when 'id' changes
  const patient = getPatient(id);
  if (patient) {
    setName(patient.name);
  }
}, [id]); // Don't include setState in dependencies
```

#### M.2.2 Stale State in Callbacks

**Root Cause**: useCallback/useMemo closures capture stale state.

**Common Locations**:
- Form submissions
- Button click handlers
- Context methods

**Prevention Pattern**:
```typescript
// WRONG — stale 'patients' reference
const addPatient = useCallback((data) => {
  // 'patients' is stale here — always shows initial value
  const duplicate = patients.find(p => p.phone === data.phone);
  if (duplicate) return;
  setPatients([...patients, newPatient]);
}, []); // Empty deps = stale closure

// CORRECT — include dependencies
const addPatient = useCallback((data) => {
  setPatients(prev => {
    // 'prev' is always current state
    const duplicate = prev.find(p => p.phone === data.phone);
    if (duplicate) return prev;
    return [newPatient, ...prev];
  });
}, []); // OK because we use functional update
```

#### M.2.3 State Not Persisting After Refresh

**Root Cause**: Using useState instead of useLocalStorage, or localStorage key mismatch.

**Common Locations**:
- Patient data
- Visit data
- Settings

**Diagnosis Checklist**:
```typescript
// 1. Check if using useLocalStorage
const [patients, setPatients] = useState<HimsPatient[]>([]); // WRONG — won't persist
const [patients, setPatients] = useLocalStorage<HimsPatient[]>('hims_patients', []); // CORRECT

// 2. Check localStorage key consistency
// Key in context: 'hims_patients'
// Key in direct access: 'hims_patients' — must match

// 3. Check if data is being written
useEffect(() => {
  console.log('Patients changed:', patients.length);
}, [patients]); // Should log on every change

// 4. Check browser DevTools → Application → localStorage
// Should see 'hims_patients' key with JSON array
```

#### M.2.4 Context Provider Not Wrapping Component

**Root Cause**: Component tries to use context but is not inside the provider.

**Error Message**: "useXxx must be used within XxxProvider"

**Fix**:
```tsx
// WRONG — component outside provider
function App() {
  return (
    <Routes>
      <Route path="/hims/patients" element={<HimsPatients />} />
    </Routes>
  );
}

// CORRECT — wrap with provider
function App() {
  return (
    <Routes>
      <Route path="/hims" element={
        <HimsPatientProvider>
          <OpdProvider>
            <BillingProvider>
              <PharmacyProvider>
                <HimsLayout />
              </PharmacyProvider>
            </BillingProvider>
          </OpdProvider>
        </HimsPatientProvider>
      }>
        <Route path="patients" element={<HimsPatients />} />
      </Route>
    </Routes>
  );
}
```

### M.3 UI/UX Errors

#### M.3.1 Button Not Working / Click Not Registering

**Root Cause**: Touch target too small, z-index conflict, or overlay blocking clicks.

**Diagnosis Steps**:
1. Check button size (minimum 44px × 44px)
2. Check for overlapping elements
3. Check z-index values
4. Check if modal/overlay is covering the button
5. Check if pointer-events: none is applied

**Prevention Pattern**:
```tsx
// WRONG — too small
<button className="p-1"><Icon /></button> // ~16px — too small for mobile

// CORRECT — proper touch target
<button className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center">
  <Icon />
</button>
```

#### M.3.2 Modal Not Closing

**Root Cause**: onClose handler not passed, not called, or state not updated.

**Diagnosis Steps**:
1. Check if onClose prop is passed
2. Check if button calls onClose
3. Check if state is being updated
4. Check if modal conditionally renders

**Prevention Pattern**:
```tsx
// CORRECT modal pattern
function MyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop click closes modal */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal content */}
      <div className="relative bg-white rounded-xl m-4">
        {/* Close button */}
        <button onClick={onClose}>
          <X />
        </button>
        
        {/* Footer with cancel */}
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}
```

#### M.3.3 Dark Mode Colors Broken

**Root Cause**: Hardcoded colors instead of dark mode variants.

**Common Issues**:
- White text on white background in dark mode
- Black text on dark background in dark mode
- Borders invisible in dark mode

**Prevention Pattern**:
```tsx
// WRONG — hardcoded colors
<div className="bg-white text-black border-gray-200">

// CORRECT — always include dark mode variants
<div className="bg-white dark:bg-surface-800 text-surface-900 dark:text-white border-surface-200 dark:border-surface-700">
```

**Color Reference Table**:
| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Card bg | `bg-white` | `dark:bg-surface-800` |
| Page bg | `bg-surface-50` | `dark:bg-surface-950` |
| Text primary | `text-surface-900` | `dark:text-white` |
| Text secondary | `text-surface-500` | `dark:text-surface-400` |
| Border | `border-surface-200` | `dark:border-surface-700` |
| Input bg | `bg-surface-50` | `dark:bg-surface-800` |
| Hover bg | `hover:bg-surface-50` | `dark:hover:bg-surface-700` |

#### M.3.4 Form Input Not Updating

**Root Cause**: Controlled component without onChange handler, or using wrong state variable.

**Diagnosis Steps**:
1. Check if value prop is set
2. Check if onChange is passed
3. Check if state variable matches
4. Check if initial state is correct

**Prevention Pattern**:
```tsx
// WRONG — no onChange
<input type="text" value={name} />

// WRONG — wrong state variable
<input type="text" value={name} onChange={(e) => setAge(e.target.value)} />

// CORRECT
const [name, setName] = useState('');
<input 
  type="text" 
  value={name} 
  onChange={(e) => setName(e.target.value)} 
/>
```

#### M.3.5 Mobile Bottom Tabs Not Visible

**Root Cause**: Bottom tabs hidden behind content or not properly positioned.

**Prevention Pattern**:
```tsx
// Layout structure must account for fixed bottom nav
<div className="h-screen flex flex-col">
  <header className="h-14 shrink-0">...</header>
  <div className="flex-1 flex overflow-hidden">
    <aside className="hidden md:block">...</aside>
    <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
      {/* Content with padding for mobile bottom nav */}
    </main>
  </div>
  <nav className="h-16 md:hidden shrink-0">
    {/* Bottom tabs */}
  </nav>
</div>
```

### M.4 Data Integrity Errors

#### M.4.1 Duplicate Records Created

**Root Cause**: Multiple form submissions, race conditions, or missing duplicate check.

**Prevention Pattern**:
```typescript
// 1. Disable submit button while processing
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isSubmitting) return; // Prevent double-click
  setIsSubmitting(true);
  
  try {
    await saveData();
    onClose();
  } finally {
    setIsSubmitting(false);
  }
};

// 2. Client-side duplicate check
const existing = patients.find(p => p.phone === newPatient.phone);
if (existing) {
  setError(`Duplicate found: ${existing.name} (${existing.mrn})`);
  return;
}

// 3. Server-side unique constraint (when using Supabase)
// CREATE UNIQUE INDEX idx_patients_phone ON patients(phone);
```

#### M.4.2 Orphaned Records After Deletion

**Root Cause**: Deleting parent record without handling child records.

**Prevention Pattern**:
```typescript
// Option 1: Prevent deletion if children exist
function canDeletePatient(patientId: string): boolean {
  const visits = JSON.parse(localStorage.getItem('hims_visits') || '[]');
  const invoices = JSON.parse(localStorage.getItem('hims_invoices') || '[]');
  
  if (visits.some((v: any) => v.patientId === patientId)) {
    setError('Cannot delete patient with visit history');
    return false;
  }
  if (invoices.some((i: any) => i.patientId === patientId)) {
    setError('Cannot delete patient with billing history');
    return false;
  }
  return true;
}

// Option 2: Soft delete (mark as deleted, keep in database)
function softDeletePatient(id: string) {
  updatePatient(id, { deleted: true, deletedAt: new Date().toISOString() });
}

// Option 3: Cascade delete (delete all children too) — NOT RECOMMENDED for medical data
function cascadeDeletePatient(id: string) {
  // Delete visits
  setVisits(prev => prev.filter(v => v.patientId !== id));
  // Delete invoices
  setInvoices(prev => prev.filter(i => i.patientId !== id));
  // Delete dispensing records
  setDispensingRecords(prev => prev.filter(r => r.patientId !== id));
  // Finally delete patient
  setPatients(prev => prev.filter(p => p.id !== id));
}
```

#### M.4.3 Stock Goes Negative

**Root Cause**: Dispensing without checking available quantity, or race condition.

**Prevention Pattern**:
```typescript
// CORRECT — atomic stock update with validation
function dispenseMedicine(medicineId: string, quantity: number): boolean {
  setMedicines(prev => {
    const medicine = prev.find(m => m.id === medicineId);
    if (!medicine) {
      console.error('Medicine not found:', medicineId);
      return prev; // No change
    }
    if (medicine.quantity < quantity) {
      console.error('Insufficient stock:', medicine.quantity, '<', quantity);
      return prev; // No change
    }
    return prev.map(m =>
      m.id === medicineId
        ? { ...m, quantity: m.quantity - quantity }
        : m
    );
  });
  return true;
}

// UI validation before calling
if (medicine.quantity < quantityToDispense) {
  setError(`Insufficient stock. Available: ${medicine.quantity} ${medicine.unit}`);
  return;
}
```

#### M.4.4 Invoice Amount Miscalculation

**Root Cause**: Floating-point arithmetic, missing items, or incorrect formula.

**Prevention Pattern**:
```typescript
// CORRECT — bulletproof calculation
function calculateInvoice(invoiceData: {
  items: { quantity: number; unitPrice: number }[];
  discount: number;
  discountType: 'fixed' | 'percentage';
}) {
  // Step 1: Calculate subtotal with integer arithmetic
  const subtotalPaise = invoiceData.items.reduce((sum, item) => {
    const qty = Math.round(Number(item.quantity) * 100);
    const price = Math.round(Number(item.unitPrice) * 100);
    return sum + (qty * price / 100);
  }, 0);
  
  // Step 2: Calculate discount
  let discountPaise: number;
  if (invoiceData.discountType === 'percentage') {
    discountPaise = Math.round(subtotalPaise * (Number(invoiceData.discount) / 100));
  } else {
    discountPaise = Math.round(Number(invoiceData.discount) * 100);
  }
  
  // Step 3: Calculate total
  const totalPaise = subtotalPaise - discountPaise;
  
  // Step 4: Convert back to rupees
  return {
    subtotal: subtotalPaise / 100,
    discount: discountPaise / 100,
    total: totalPaise / 100,
  };
}
```

#### M.4.5 Date Comparison Errors

**Root Cause**: Comparing date strings lexicographically instead of as dates, timezone issues.

**Prevention Pattern**:
```typescript
// WRONG — string comparison fails
if (visitDate < today) { // "2026-07-02" > "2026-07-01" works, but...
  // What about "2026-07-02T10:00:00" vs "2026-07-02"?
}

// CORRECT — always compare Date objects
function isBeforeDate(dateStr1: string, dateStr2: string): boolean {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  return d1.getTime() < d2.getTime();
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr.startsWith(today);
}

function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

### M.5 Performance Errors

#### M.5.1 Slow Search / Freezing UI

**Root Cause**: Filtering large datasets on every keystroke without debounce.

**Prevention Pattern**:
```typescript
// WRONG — filters on every keystroke
const filtered = patients.filter(p => 
  p.name.toLowerCase().includes(query.toLowerCase())
);

// CORRECT — debounce search
import { useState, useMemo, useCallback } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);

const filtered = useMemo(() => {
  if (!debouncedQuery) return patients;
  const q = debouncedQuery.toLowerCase();
  return patients.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.phone.includes(q) ||
    p.mrn.toLowerCase().includes(q)
  );
}, [debouncedQuery, patients]);
```

#### M.5.2 Unnecessary Re-renders

**Root Cause**: Creating new objects/arrays on every render, missing memoization.

**Diagnosis**: Add React DevTools Profiler to identify re-rendering components.

**Prevention Pattern**:
```typescript
// WRONG — new object on every render
const contextValue = { patients, addPatient, updatePatient };

// CORRECT — memoize context value
const contextValue = useMemo(
  () => ({ patients, addPatient, updatePatient }),
  [patients, addPatient, updatePatient]
);

// WRONG — inline function creates new reference
<button onClick={() => handleDelete(patient.id)}>Delete</button>

// CORRECT — stable callback reference
const handleDelete = useCallback((id: string) => {
  deletePatient(id);
}, [deletePatient]);

<button onClick={() => handleDelete(patient.id)}>Delete</button>
```

#### M.5.3 localStorage Write Thrashing

**Root Cause**: Writing to localStorage on every state change, causing excessive serialization.

**Prevention Pattern**:
```typescript
// WRONG — writes on every keystroke
const [name, setName] = useState('');
useEffect(() => {
  localStorage.setItem('form_name', name); // Writes 10+ times per second
}, [name]);

// CORRECT — batch writes
const [formData, setFormData] = useState({ name: '', phone: ''});

// Only write on form submit or with debounce
const handleSubmit = () => {
  localStorage.setItem('form_data', JSON.stringify(formData));
};

// Or use useLocalStorage hook which handles this automatically
```

### M.6 Browser Compatibility Errors

#### M.6.1 localStorage Not Available

**Root Cause**: Private browsing mode, storage quota exceeded, or storage disabled.

**Prevention Pattern**:
```typescript
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

function safeSetItem(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available');
    return false;
  }
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
      // Trigger data archival to Supabase
    }
    return false;
  }
}
```

#### M.6.2 Date Parsing Differences Across Browsers

**Root Cause**: Different browsers parse date strings differently.

**Prevention Pattern**:
```typescript
// WRONG — browser-dependent
const date = new Date('2026-07-02'); // Some browsers treat as local, some as UTC

// CORRECT — always use ISO format with explicit timezone
const date = new Date('2026-07-02T00:00:00'); // Local midnight
const dateUTC = new Date('2026-07-02T00:00:00Z'); // UTC midnight

// Or use date-fns library for consistent parsing
import { parseISO, format } from 'date-fns';
const date = parseISO('2026-07-02T00:00:00');
const formatted = format(date, 'dd MMM yyyy');
```

---

## Appendix N: Ayurveda Clinical Decision Support

### N.1 Dosha-Based Treatment Recommendations

```typescript
interface DoshaRecommendation {
  dosha: string;
  aggravation: string[];
  treatment: string[];
  diet: string[];
  lifestyle: string[];
  contraindications: string[];
}

const DOSHA_RECOMMENDATIONS: Record<string, DoshaRecommendation> = {
  Vata: {
    aggravation: ['Cold weather', 'Fasting', 'Irregular meals', 'Excess travel', 'Stress'],
    treatment: [
      'Abhyanga (warm oil massage)',
      'Swedana (sudation)',
      'Basti (enema therapy)',
      'Warm, nourishing foods',
      'Oil instillation (Snehana)',
    ],
    diet: [
      'Warm, cooked foods',
      'Sweet, sour, salty tastes',
      'Regular meal times',
      'Warm milk with ghee',
      'Avoid raw, cold, dry foods',
    ],
    lifestyle: [
      'Regular daily routine (Dinacharya)',
      'Warm oil self-massage',
      'Gentle yoga (Hatha)',
      'Avoid excessive cold',
      'Early bedtime (before 10 PM)',
    ],
    contraindications: [
      'Fasting',
      'Cold showers',
      'Raw foods',
      'Excessive exercise',
    ],
  },
  Pitta: {
    aggravation: ['Hot weather', 'Spicy foods', 'Anger', 'Overwork', 'Midday sun'],
    treatment: [
      'Shirodhara (oil stream on forehead)',
      'Pitta-pacifying herbs',
      'Cooling treatments',
      'Virechana (purgation)',
      'Blood purification',
    ],
    diet: [
      'Cool, refreshing foods',
      'Sweet, bitter, astringent tastes',
      'Avoid spicy, sour, salty foods',
      'Fresh fruits and vegetables',
      'Cool milk, ghee',
    ],
    lifestyle: [
      'Avoid midday sun',
      'Cool environments',
      'Moderate exercise (swimming)',
      'Avoid heated arguments',
      'Early morning walks',
    ],
    contraindications: [
      'Hot yoga',
      'Spicy foods',
      'Alcohol',
      'Excessive sun exposure',
    ],
  },
  Kapha: {
    aggravation: ['Cold weather', 'Overeating', 'Lack of exercise', 'Daytime sleep', 'Sweet foods'],
    treatment: [
      'Vamana (therapeutic vomiting)',
      'Dry massage (Udvartana)',
      'Kapha-pacifying herbs',
      'Exercise therapy',
      'Pungent, bitter treatments',
    ],
    diet: [
      'Light, warm foods',
      'Pungent, bitter, astringent tastes',
      'Avoid sweet, sour, salty tastes',
      'Honey (in warm water)',
      'Light meals, avoid overeating',
    ],
    lifestyle: [
      'Vigorous exercise',
      'Early morning wake-up (before 6 AM)',
      'Avoid daytime sleep',
      'Active, stimulating environments',
      'Dry brushing',
    ],
    contraindications: [
      'Daytime sleeping',
      'Heavy, oily foods',
      'Cold environments',
      'Sedentary lifestyle',
    ],
  },
};
```

### N.2 Seasonal Treatment Guidelines

```typescript
interface SeasonalGuideline {
  season: string;
  months: string;
  dominantDosha: string;
  recommendedTreatments: string[];
  avoidTreatments: string[];
  dietGuidelines: string[];
}

const SEASONAL_GUIDELINES: SeasonalGuideline[] = [
  {
    season: 'Shishira (Winter)',
    months: 'January - February',
    dominantDosha: 'Kapha',
    recommendedTreatments: ['Snehana', 'Swedana', 'Vamana', 'Dry massage'],
    avoidTreatments: ['Cold treatments', 'Virechana'],
    dietGuidelines: ['Warm, spicy foods', 'Honey', 'Light meals'],
  },
  {
    season: 'Vasanta (Spring)',
    months: 'March - April',
    dominantDosha: 'Kapha',
    recommendedTreatments: ['Vamana', 'Udvartana', 'Dry massage', 'Exercise'],
    avoidTreatments: ['Oily treatments', 'Heavy foods'],
    dietGuidelines: ['Light, pungent foods', 'Honey', 'Fasting'],
  },
  {
    season: 'Grishma (Summer)',
    months: 'May - June',
    dominantDosha: 'Pitta',
    recommendedTreatments: ['Shirodhara', 'Cooling treatments', 'Pitta-pacifying'],
    avoidTreatments: ['Hot treatments', 'Virechana', 'Excessive exercise'],
    dietGuidelines: ['Cool foods', 'Sweet, bitter tastes', 'Ghee', 'Sweet fruits'],
  },
  {
    season: 'Varsha (Monsoon)',
    months: 'July - August',
    dominantDosha: 'Vata',
    recommendedTreatments: ['Basti', 'Snehana', 'Warm treatments', 'Light massage'],
    avoidTreatments: ['Cold treatments', 'Fasting', 'Virechana'],
    dietGuidelines: ['Warm, soupy foods', 'Sour, salty tastes', 'Warm water'],
  },
  {
    season: 'Sharad (Autumn)',
    months: 'September - October',
    dominantDosha: 'Pitta',
    recommendedTreatments: ['Virechana', 'Blood purification', 'Cooling treatments'],
    avoidTreatments: ['Heat treatments', 'Spicy foods'],
    dietGuidelines: ['Bitter foods', 'Light meals', 'Honey water'],
  },
  {
    season: 'Hemanta (Early Winter)',
    months: 'November - December',
    dominantDosha: 'Vata',
    recommendedTreatments: ['Snehana', 'Swedana', 'Basti', 'Nourishing treatments'],
    avoidTreatments: ['Cold treatments', 'Fasting', 'Dry treatments'],
    dietGuidelines: ['Warm, nourishing foods', 'Sweet, sour, salty tastes', 'Ghee', 'Warm milk'],
  },
];
```

### N.3 Ayurveda Medicine Classification

```typescript
interface AyurvedaMedicine {
  name: string;
  sanskritName: string;
  category: 'Churna' | 'Vati' | 'Asava' | 'Arishta' | 'Kwath' | 'Ghrita' | 'Taila' | 'Bhasma' | 'Guggulu';
  rasa: string[];         // Taste: Sweet, Sour, Salty, Pungent, Bitter, Astringent
  guna: string[];         // Quality: Heavy, Light, Oily, Dry, Hot, Cold
  veerya: string;         // Potency: Hot or Cold
  vipaka: string;         // Post-digestive effect: Sweet, Sour, Pungent
  dosha: {
    vata: 'pacifies' | 'aggravates' | 'neutral';
    pitta: 'pacifies' | 'aggravates' | 'neutral';
    kapha: 'pacifies' | 'aggravates' | 'neutral';
  };
  indications: string[];
  dosage: string;
  anupana: string;
  contraindications: string[];
}

const AYURVEDA_MEDICINES: AyurvedaMedicine[] = [
  {
    name: 'Ashwagandha Churna',
    sanskritName: 'Ashwagandha',
    category: 'Churna',
    rasa: ['Bitter', 'Astringent'],
    guna: ['Heavy', 'Oily'],
    veerya: 'Hot',
    vipaka: 'Sweet',
    dosha: {
      vata: 'pacifies',
      pitta: 'neutral',
      kapha: 'pacifies',
    },
    indications: ['General weakness', 'Anxiety', 'Insomnia', 'Rejuvenation', 'Vata disorders'],
    dosage: '3-6g twice daily',
    anupana: 'Warm milk or ghee',
    contraindications: ['High Pitta', 'Inflammation', 'Pregnancy'],
  },
  {
    name: 'Triphala Churna',
    sanskritName: 'Triphala',
    category: 'Churna',
    rasa: ['Sweet', 'Sour', 'Salty', 'Pungent', 'Bitter', 'Astringent'],
    guna: ['Light', 'Dry'],
    veerya: 'Neutral',
    vipaka: 'Sweet',
    dosha: {
      vata: 'pacifies',
      pitta: 'pacifies',
      kapha: 'pacifies',
    },
    indications: ['Constipation', 'Digestive disorders', 'Detoxification', 'Eye disorders'],
    dosage: '3-6g at bedtime',
    anupana: 'Warm water or honey',
    contraindications: ['Loose motions', 'Pregnancy'],
  },
  {
    name: 'Guggulu',
    sanskritName: 'Guggulu',
    category: 'Guggulu',
    rasa: ['Bitter', 'Astringent'],
    guna: ['Light', 'Dry'],
    veerya: 'Hot',
    vipaka: 'Pungent',
    dosha: {
      vata: 'pacifies',
      pitta: 'neutral',
      kapha: 'pacifies',
    },
    indications: ['Arthritis', 'Obesity', 'High cholesterol', 'Thyroid disorders'],
    dosage: '500mg twice daily',
    anupana: 'Warm water',
    contraindications: ['Pregnancy', 'High Pitta', 'Inflammation'],
  },
];
```

### N.4 Prescription Validation Rules

```typescript
interface PrescriptionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

function validatePrescription(prescription: PrescriptionItem[]): PrescriptionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (prescription.length === 0) {
    errors.push('Prescription cannot be empty');
  }
  
  prescription.forEach((item, index) => {
    // Required fields
    if (!item.medicine || item.medicine.trim().length === 0) {
      errors.push(`Item ${index + 1}: Medicine name is required`);
    }
    if (!item.dosage || item.dosage.trim().length === 0) {
      errors.push(`Item ${index + 1}: Dosage is required`);
    }
    if (!item.frequency || item.frequency.trim().length === 0) {
      errors.push(`Item ${index + 1}: Frequency is required`);
    }
    if (!item.duration || item.duration.trim().length === 0) {
      errors.push(`Item ${index + 1}: Duration is required`);
    }
    
    // Duplicate check
    const duplicate = prescription.findIndex((p, i) => 
      i !== index && p.medicine.toLowerCase() === item.medicine.toLowerCase()
    );
    if (duplicate !== -1) {
      warnings.push(`Possible duplicate: "${item.medicine}" appears multiple times`);
    }
    
    // Duration warnings
    if (item.duration) {
      const days = parseDuration(item.duration);
      if (days > 90) {
        warnings.push(`"${item.medicine}" has unusually long duration (${item.duration})`);
      }
      if (days < 1) {
        errors.push(`"${item.medicine}" has invalid duration (${item.duration})`);
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)\s*(day|week|month)/i);
  if (!match) return 0;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit === 'week') return num * 7;
  if (unit === 'month') return num * 30;
  return num;
}
```

---

## Appendix O: Data Migration & Backup Patterns

### O.1 Migration from localStorage to Supabase

```typescript
async function migrateToSupabase() {
  // 1. Read all data from localStorage
  const patients = JSON.parse(localStorage.getItem('hims_patients') || '[]');
  const visits = JSON.parse(localStorage.getItem('hims_visits') || '[]');
  const invoices = JSON.parse(localStorage.getItem('hims_invoices') || '[]');
  const medicines = JSON.parse(localStorage.getItem('hims_medicines') || '[]');
  
  // 2. Validate data before migration
  const validation = validateMigrationData(patients, visits, invoices, medicines);
  if (!validation.isValid) {
    console.error('Migration validation failed:', validation.errors);
    return;
  }
  
  // 3. Insert into Supabase
  const { error: patientsError } = await supabase.from('patients').insert(patients);
  if (patientsError) throw patientsError;
  
  const { error: visitsError } = await supabase.from('visits').insert(visits);
  if (visitsError) throw visitsError;
  
  // 4. Backup localStorage data
  const backup = {
    timestamp: new Date().toISOString(),
    patients,
    visits,
    invoices,
    medicines,
  };
  localStorage.setItem('hims_backup_' + Date.now(), JSON.stringify(backup));
  
  // 5. Clear localStorage (optional)
  // localStorage.removeItem('hims_patients');
  // localStorage.removeItem('hims_visits');
  // etc.
  
  console.log('Migration complete');
}
```

### O.2 Data Export for Backup

```typescript
function exportData(): string {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    patients: JSON.parse(localStorage.getItem('hims_patients') || '[]'),
    visits: JSON.parse(localStorage.getItem('hims_visits') || '[]'),
    invoices: JSON.parse(localStorage.getItem('hims_invoices') || '[]'),
    medicines: JSON.parse(localStorage.getItem('hims_medicines') || '[]'),
    dispensing: JSON.parse(localStorage.getItem('hims_dispensing') || '[]'),
  };
  
  return JSON.stringify(data, null, 2);
}

function downloadBackup() {
  const data = exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hims-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### O.3 Data Import from Backup

```typescript
function importData(jsonString: string): { success: boolean; errors: string[] } {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate structure
    if (!data.version || !data.patients) {
      return { success: false, errors: ['Invalid backup format'] };
    }
    
    // Validate data integrity
    const validation = validateMigrationData(
      data.patients,
      data.visits || [],
      data.invoices || [],
      data.medicines || []
    );
    
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }
    
    // Import with merge strategy
    const existingPatients = JSON.parse(localStorage.getItem('hims_patients') || '[]');
    const mergedPatients = mergeArrays(existingPatients, data.patients, 'id');
    
    localStorage.setItem('hims_patients', JSON.stringify(mergedPatients));
    // ... repeat for other entities
    
    return { success: true, errors: [] };
  } catch (e) {
    return { success: false, errors: [`Import failed: ${e}`] };
  }
}

function mergeArrays(existing: any[], incoming: any[], keyField: string): any[] {
  const merged = [...existing];
  
  for (const item of incoming) {
    const existingIndex = merged.findIndex(e => e[keyField] === item[keyField]);
    if (existingIndex === -1) {
      merged.push(item); // New item
    }
    // Optionally update existing items or skip
  }
  
  return merged;
}
```

---

## Appendix P: Troubleshooting Guide

### P.1 Application Won't Load

**Symptoms**: Blank white screen, console errors.

**Diagnosis Steps**:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Clear localStorage and refresh

**Common Fixes**:
```bash
# Clear all HIMS data
localStorage.clear();

# Or clear specific keys
localStorage.removeItem('hims_patients');
localStorage.removeItem('hims_visits');
localStorage.removeItem('hims_invoices');
localStorage.removeItem('hims_medicines');
localStorage.removeItem('hims_dispensing');
```

### P.2 Data Not Saving

**Symptoms**: Form submits but data doesn't appear in list.

**Diagnosis Steps**:
1. Check if context method is called (add console.log)
2. Check if localStorage is being updated
3. Check if component re-renders after save
4. Check browser storage quota

**Debug Pattern**:
```typescript
const addPatient = useCallback((data) => {
  console.log('Adding patient:', data);
  const newPatient = { ...data, id: `hpat_${Date.now()}` };
  setPatients(prev => {
    const updated = [newPatient, ...prev];
    console.log('Updated patients count:', updated.length);
    return updated;
  });
}, []);
```

### P.3 OPD Queue Not Updating

**Symptoms**: Status changes don't reflect in queue.

**Diagnosis Steps**:
1. Check if status transition is valid
2. Check if updateVisitStatus is called
3. Check if component re-renders
4. Check localStorage for stale data

**Debug Pattern**:
```typescript
const updateVisitStatus = useCallback((id, newStatus) => {
  console.log('Updating visit:', id, 'to status:', newStatus);
  setVisits(prev => {
    const updated = prev.map(v => {
      if (v.id === id) {
        console.log('Found visit, updating status');
        return { ...v, status: newStatus };
      }
      return v;
    });
    return updated;
  });
}, []);
```

### P.4 Invoice Total Wrong

**Symptoms**: Invoice total doesn't match line items.

**Diagnosis Steps**:
1. Check each line item calculation
2. Check discount calculation
3. Check for floating-point errors
4. Check if items are being added correctly

**Debug Pattern**:
```typescript
function debugInvoiceTotal(invoice: Invoice) {
  console.log('Invoice items:', invoice.items);
  
  const subtotal = invoice.items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice;
    console.log(`  ${item.description}: ${item.quantity} × ${item.unitPrice} = ${lineTotal}`);
    return sum + lineTotal;
  }, 0);
  
  console.log('Subtotal:', subtotal);
  console.log('Discount:', invoice.discount);
  console.log('Total:', subtotal - invoice.discount);
}
```

### P.5 Medicine Search Not Working

**Symptoms**: Search doesn't find medicines that exist.

**Diagnosis Steps**:
1. Check if medicines array is populated
2. Check search query normalization
3. Check field names match
4. Check for case sensitivity

**Debug Pattern**:
```typescript
function debugMedicineSearch(medicines: Medicine[], query: string) {
  console.log('Total medicines:', medicines.length);
  console.log('Search query:', query);
  
  const q = query.toLowerCase().trim();
  const results = medicines.filter(m => {
    const nameMatch = m.name.toLowerCase().includes(q);
    const categoryMatch = m.category.toLowerCase().includes(q);
    const match = nameMatch || categoryMatch;
    if (match) console.log('Match found:', m.name);
    return match;
  });
  
  console.log('Results:', results.length);
  return results;
}
```

### P.6 Dark Mode Not Working

**Symptoms**: Dark mode toggle doesn't change colors.

**Diagnosis Steps**:
1. Check if dark class is applied to html element
2. Check if Tailwind CSS dark mode is configured
3. Check if components use dark: variants
4. Check CSS specificity

**Debug Pattern**:
```typescript
// Check dark mode state
console.log('Dark mode:', document.documentElement.classList.contains('dark'));

// Toggle dark mode manually
document.documentElement.classList.toggle('dark');

// Check if component has dark variants
// In browser DevTools, inspect element and check computed styles
```

### P.7 Mobile Layout Broken

**Symptoms**: Bottom tabs missing, content cut off, buttons too small.

**Diagnosis Steps**:
1. Check viewport meta tag
2. Check responsive classes
3. Check touch target sizes
4. Check safe area insets (notch phones)

**Debug Pattern**:
```html
<!-- Check viewport meta -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
/* Check safe area insets */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### P.8 Performance Issues

**Symptoms**: Slow page loads, laggy interactions, memory warnings.

**Diagnosis Steps**:
1. Check bundle size
2. Check for memory leaks
3. Check for unnecessary re-renders
4. Check localStorage read/write frequency

**Debug Pattern**:
```typescript
// Check localStorage size
function getLocalStorageSize(): number {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2; // UTF-16
    }
  }
  return total;
}

console.log('localStorage size:', getLocalStorageSize(), 'bytes');

// Check component render count
function DebugRenderCount({ name }: { name: string }) {
  const renderCount = useRef(0);
  renderCount.current++;
  console.log(`${name} rendered ${renderCount.current} times`);
  return null;
}
```

---

## Appendix Q: Code Style Guide for HIMS

### Q.1 Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Interface | PascalCase | `HimsPatient`, `OpdVisit` |
| Type alias | PascalCase | `PrescriptionItem` |
| Function | camelCase | `generateMrn`, `validatePhone` |
| Component | PascalCase | `RegisterPatientModal`, `HimsDashboard` |
| Hook | camelCase (use prefix) | `useHimsPatients`, `useOpd` |
| Context | PascalCase (Context suffix) | `HimsPatientContext`, `OpdContext` |
| Constant | UPPER_SNAKE_CASE | `DOCTORS`, `MEDICINE_CATEGORIES` |
| File | PascalCase for components, camelCase for others | `HimsDashboard.tsx`, `useLocalStorage.ts` |
| localStorage key | snake_case with prefix | `hims_patients`, `hims_visits` |
| ID prefix | snake_case with underscore | `hpat_`, `vst_`, `inv_` |

### Q.2 File Structure Convention

```
features/hims/
├── types/
│   └── index.ts                    # All type definitions in one file
├── contexts/
│   ├── HimsPatientContext.tsx       # One context per domain
│   ├── OpdContext.tsx
│   ├── BillingContext.tsx
│   └── PharmacyContext.tsx
├── components/
│   ├── RegisterPatientModal.tsx     # ComponentName.tsx
│   ├── EditPatientModal.tsx
│   ├── CreateVisitModal.tsx
│   ├── CreateInvoiceModal.tsx
│   ├── QuickInvoiceModal.tsx
│   ├── AddMedicineModal.tsx
│   └── DispenseMedicineModal.tsx
├── layout/
│   ├── HimsLayout.tsx
│   ├── HimsHeader.tsx
│   ├── HimsSidebar.tsx
│   ├── HimsBottomTabs.tsx
│   └── HimsStatsCard.tsx
├── pages/
│   ├── HimsDashboard.tsx
│   ├── HimsPatients.tsx
│   ├── HimsPatientDetail.tsx
│   ├── HimsOPD.tsx
│   ├── HimsBilling.tsx
│   └── HimsPharmacy.tsx
└── utils/                          # Shared utilities (if any)
```

### Q.3 Import Order

```typescript
// 1. React imports
import { useState, useEffect, useCallback, useMemo } from 'react';

// 2. React Router imports
import { useParams, useNavigate } from 'react-router-dom';

// 3. Third-party library imports
import { SomeLibrary } from 'some-library';

// 4. Internal UI component imports
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';

// 5. Internal context imports
import { useHimsPatients } from '../contexts/HimsPatientContext';
import { useOpd } from '../contexts/OpdContext';

// 6. Internal type imports
import type { HimsPatient, OpdVisit } from '../types';

// 7. Internal component imports
import { EditPatientModal } from '../components/EditPatientModal';

// 8. Constant imports
import { DOCTORS } from '../types';
```

### Q.4 Component Structure

```typescript
// Standard component structure
interface ComponentNameProps {
  // Props
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  // 1. Hooks
  const navigate = useNavigate();
  const { data } = useContext();
  
  // 2. State
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 3. Derived state / computations
  const filteredData = useMemo(() => filter(data), [data]);
  
  // 4. Effects
  useEffect(() => {
    // Side effects
  }, [dependency]);
  
  // 5. Callbacks / handlers
  const handleSubmit = useCallback(() => {
    // Handle submit
  }, [dependency]);
  
  // 6. Render helpers
  const renderEmpty = () => <div>No data</div>;
  const renderItem = (item) => <div>{item.name}</div>;
  
  // 7. Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Q.5 Comment Style

```typescript
// Use comments sparingly — code should be self-documenting

// GOOD — explaining WHY, not WHAT
// We round to 2 decimal places to avoid floating-point display issues
const total = Math.round(subtotal * 100) / 100;

// GOOD — explaining complex logic
// Status transitions: waiting → in-progress → completed
// Once completed or cancelled, status cannot change
if (status === 'completed' || status === 'cancelled') {
  return; // Terminal states
}

// BAD — explaining WHAT (redundant)
// Set the name
setName('John');

// BAD — outdated comments
// Updated on 1 Jan 2025 — this is now stale
```

---

## Appendix R: Security Checklist for HIMS

### R.1 Before Every Commit

- [ ] No hardcoded secrets (API keys, passwords)
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in client code
- [ ] No patient data in console.log statements
- [ ] No sensitive data in localStorage keys (use `hims_` prefix)
- [ ] Input validation on all form fields
- [ ] No SQL injection vectors (using parameterized queries)
- [ ] No XSS vulnerabilities (using React's built-in escaping)

### R.2 Patient Data Handling

```typescript
// NEVER log full patient objects
console.log(patient); // BAD — exposes all patient data

// OK — log only non-sensitive info
console.log('Patient registered:', patient.mrn); // OK — MRN is not sensitive

// NEVER store in localStorage without user awareness
// ALWAYS inform users about data storage

// NEVER share patient data with third parties
// NEVER include patient data in URLs
// NEVER send patient data over unencrypted connections
```

### R.3 Form Security

```typescript
// Sanitize all user inputs
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Validate all inputs before processing
function validateAndSanitize(data: any) {
  return {
    name: sanitizeInput(data.name || ''),
    phone: data.phone?.replace(/\D/g, '').slice(0, 10) || '',
    // ... other fields
  };
}
```

### R.4 localStorage Security

```typescript
// Use appropriate key prefixes
const STORAGE_KEYS = {
  patients: 'hims_patients',
  visits: 'hims_visits',
  invoices: 'hims_invoices',
  medicines: 'hims_medicines',
  dispensing: 'hims_dispensing',
  settings: 'hims_settings',
};

// Don't store sensitive data in localStorage (it's not encrypted)
// Sensitive data should go to Supabase with RLS

// Clear sensitive data on logout
function clearHimsData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
```

---

## Appendix S: Testing Guide

### S.1 Unit Test Examples

```typescript
// Test MRN generation
describe('generateMrn', () => {
  it('should generate MRN with correct format', () => {
    const mrn = generateMrn([]);
    expect(mrn).toMatch(/^MRN-\d{8}-\d{3}$/);
  });
  
  it('should increment sequence', () => {
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const existing = [{ mrn: `MRN-${dateStr}-001` }];
    const mrn = generateMrn(existing);
    expect(mrn).toBe(`MRN-${dateStr}-002`);
  });
});

// Test phone validation
describe('validatePhone', () => {
  it('should reject non-10-digit numbers', () => {
    expect(validatePhone('123456789').valid).toBe(false);
  });
  
  it('should reject numbers not starting with 6-9', () => {
    expect(validatePhone('5123456789').valid).toBe(false);
  });
  
  it('should accept valid Indian mobile', () => {
    expect(validatePhone('9876543210').valid).toBe(true);
  });
});

// Test invoice calculation
describe('calculateInvoiceTotal', () => {
  it('should calculate correct total', () => {
    const invoice = {
      items: [
        { quantity: 2, unitPrice: 100 },
        { quantity: 1, unitPrice: 500 },
      ],
      discount: 50,
    };
    expect(calculateInvoiceTotal(invoice)).toBe(650);
  });
  
  it('should handle empty items', () => {
    const invoice = { items: [], discount: 0 };
    expect(calculateInvoiceTotal(invoice)).toBe(0);
  });
});
```

### S.2 Integration Test Examples

```typescript
// Test complete OPD workflow
describe('OPD Workflow', () => {
  it('should complete full visit lifecycle', () => {
    // 1. Register patient
    const patient = addPatient({ name: 'Test Patient', phone: '9876543210' });
    expect(patient.mrn).toMatch(/^MRN-/);
    
    // 2. Create visit
    const visit = addVisit({
      patientId: patient.id,
      patientName: patient.name,
      doctorName: 'Dr. Rajesh Sharma',
      chiefComplaint: 'Test complaint',
      status: 'waiting',
    });
    expect(visit.status).toBe('waiting');
    
    // 3. Update status to in-progress
    updateVisitStatus(visit.id, 'in-progress');
    expect(getVisit(visit.id)?.status).toBe('in-progress');
    
    // 4. Complete visit with prescription
    updateVisit(visit.id, {
      status: 'completed',
      prescription: [{ medicine: 'Test Med', dosage: '500mg', frequency: 'Twice daily', duration: '7 days' }],
    });
    expect(getVisit(visit.id)?.status).toBe('completed');
    
    // 5. Create invoice
    const invoice = addInvoice({
      patientId: patient.id,
      patientName: patient.name,
      visitId: visit.id,
      items: [{ description: 'Consultation', quantity: 1, unitPrice: 500, total: 500 }],
      subtotal: 500,
      discount: 0,
      total: 500,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      paidAmount: 500,
    });
    expect(invoice.invoiceNumber).toMatch(/^INV-/);
    
    // 6. Verify patient has visit and invoice
    expect(getVisitsByPatient(patient.id).length).toBe(1);
    expect(getInvoicesByPatient(patient.id).length).toBe(1);
  });
});
```

### S.3 E2E Test Scenarios

```typescript
// E2E test scenarios (Playwright/Cypress)
const E2E_SCENARIOS = [
  {
    name: 'Patient Registration',
    steps: [
      'Navigate to /hims/patients',
      'Click Register button',
      'Fill in patient details',
      'Submit form',
      'Verify patient appears in list',
    ],
  },
  {
    name: 'OPD Visit Flow',
    steps: [
      'Navigate to /hims/opd',
      'Click Create Visit',
      'Select patient',
      'Select doctor',
      'Enter chief complaint',
      'Add prescription items',
      'Submit visit',
      'Verify visit appears in queue',
      'Update status to in-progress',
      'Update status to completed',
      'Click Bill This Visit',
      'Complete invoice',
    ],
  },
  {
    name: 'Pharmacy Dispensing',
    steps: [
      'Navigate to /hims/pharmacy',
      'Add new medicine',
      'Navigate to /hims/opd',
      'Create visit with prescription',
      'Complete visit',
      'Click Dispense on completed visit',
      'Select medicine from search',
      'Enter quantity',
      'Dispense',
      'Verify stock decreased',
    ],
  },
];
```

---

---

## Appendix T: Complete HIMS Module Specifications

### T.1 Dashboard Module

#### T.1.1 Dashboard Layout

The dashboard is the first screen after selecting HIMS. It provides an overview of clinic operations.

```
┌─────────────────────────────────────────────────────────────┐
│  HIMS Dashboard                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Patients │  │ OPD      │  │ Revenue  │  │ Low Stock│  │
│  │    127   │  │    12    │  │ ₹45,000  │  │    3     │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │  Recent Visits          │  │  Low Stock Alert        │  │
│  │  ─────────────────────  │  │  ─────────────────────  │  │
│  │  ● Ramesh Kumar - OPD   │  │  ⚠ Ashwagandha - 15    │  │
│  │  ● Suresh Patel - OPD   │  │  ⚠ Triphala - 8        │  │
│  │  ● Anita Sharma - OPD   │  │  ⚠ Brahmi Ghrita - 3   │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### T.1.2 Dashboard Data Sources

| Stat | Source | Calculation |
|------|--------|-------------|
| Total Patients | `hims_patients` | `patients.length` |
| Today's OPD | `hims_visits` | `visits.filter(v => v.visitDate.startsWith(today)).length` |
| This Month Revenue | `hims_invoices` | `invoices.filter(i => i.createdAt.startsWith(monthPrefix)).reduce(sum + total)` |
| Low Stock | `hims_medicines` | `medicines.filter(m => m.quantity <= m.reorderLevel).length` |
| Recent Visits | `hims_visits` | `visits.slice(0, 5)` |

#### T.1.3 Dashboard Refresh Behavior

- Dashboard refreshes on every mount (page load)
- No auto-refresh (manual refresh via page reload)
- Stats update when user navigates back to dashboard

#### T.1.4 Dashboard Click Actions

| Stat Card | Click Action |
|-----------|-------------|
| Total Patients | Navigate to `/hims/patients` |
| Today's OPD | Navigate to `/hims/opd` |
| This Month Revenue | Navigate to `/hims/billing` |
| Low Stock | Navigate to `/hims/pharmacy` |
| Recent Visit | Navigate to `/hims/patients/{patientId}` |

### T.2 Patient Registration Module

#### T.2.1 Registration Form Fields

| Field | Type | Required | Validation | Max Length |
|-------|------|----------|------------|------------|
| Name | text | Yes | Min 2 chars | 100 |
| Age | number | Yes | 0-120 | - |
| Gender | select | Yes | Male/Female/Other | - |
| Phone | tel | Yes | 10 digits, starts with 6-9 | 10 |
| Email | email | No | Valid email format | 100 |
| Address | textarea | No | - | 500 |
| Blood Group | select | No | A+/A-/B+/B-/O+/O-/AB+/AB- | - |
| Emergency Contact | text | No | - | 200 |
| Prakriti | select | No | Vata/Pitta/Kapha/etc. | - |
| Vikriti | select | No | Vata/Pitta/Kapha/etc. | - |
| Allergies | text | No | - | 500 |

#### T.2.2 Registration Flow

```
1. User clicks "Register" button
2. Modal opens with empty form
3. User fills required fields (Name, Age, Gender, Phone)
4. User optionally fills Ayurveda fields (Prakriti, Vikriti)
5. User clicks "Register Patient"
6. System validates inputs
7. System checks for duplicate phone number
8. System generates MRN (MRN-YYYYMMDD-XXX)
9. System generates unique ID (hpat_timestamp_random)
10. System saves to localStorage
11. Modal closes
12. Patient appears at top of patient list
```

#### T.2.3 MRN Display Rules

- MRN is displayed as a badge next to patient name
- Format: `MRN-20260702-001`
- Color: Emerald background, emerald text
- Size: Small text (xs)
- Shown in: Patient list, patient detail, OPD queue, invoices

#### T.2.4 Patient Search

```
Search Input: [Search by name, MRN, or phone...]

Results (shown as user types, min 2 characters):
┌─────────────────────────────────────────────┐
│  Ramesh Kumar      MRN-20260702-001         │
│  45 years, Male    9876543210               │
├─────────────────────────────────────────────┤
│  Rakesh Singh      MRN-20260701-003         │
│  32 years, Male    9123456780               │
└─────────────────────────────────────────────┘
```

#### T.2.5 Duplicate Detection

When registering a patient with an existing phone number:
```
⚠️ A patient with this phone already exists:
   Name: Ramesh Kumar
   MRN: MRN-20260702-001
   Phone: 9876543210
   
   [Use Existing]  [Register New]
```

### T.3 OPD Module

#### T.3.1 OPD Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  OPD Management                                             │
│                                                             │
│  [+ New Visit]                                              │
│                                                             │
│  Date: [📅 Today ▼]  [← Prev] [Today] [Next →]             │
│  Show: [All Time] toggle                                    │
│                                                             │
│  Filters: [All] [Waiting] [In Progress] [Completed]        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  #003  Ramesh Kumar      Joint pain    [In Progress]│   │
│  │        Dr. Rajesh Sharma                    [Bill]   │   │
│  │        Diagnosis: Amavata                  [Dispense]│   │
│  │        Rx: 2 medicines prescribed                    │   │
│  │        Fee: ₹500                                    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  #004  Suresh Patel      Fever          [Waiting]   │   │
│  │        Dr. Priya Verma                               │   │
│  │        Fee: ₹500                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### T.3.2 OPD Visit Status Workflow

```
                    ┌──────────┐
                    │ Waiting  │
                    └────┬─────┘
                         │
                    [Start Visit]
                         │
                         ▼
                    ┌──────────┐
                    │In Progress│
                    └────┬─────┘
                         │
                    [Complete Visit]
                         │
                         ▼
                    ┌──────────┐
                    │ Completed │
                    └──────────┘

Any status → [Cancel] → Cancelled
```

#### T.3.3 Status Transition Rules

```typescript
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  'waiting': ['in-progress', 'cancelled'],
  'in-progress': ['completed', 'cancelled'],
  'completed': [],  // Terminal state - cannot change
  'cancelled': [],  // Terminal state - cannot change
};

function isValidTransition(currentStatus: string, newStatus: string): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}
```

#### T.3.4 Status Color Coding

| Status | Badge Color | Text Color |
|--------|------------|------------|
| Waiting | Amber background | Amber text |
| In Progress | Blue background | Blue text |
| Completed | Green background | Green text |
| Cancelled | Gray background | Gray text |

#### T.3.5 Visit Card Actions

| Status | Available Actions |
|--------|------------------|
| Waiting | Start Visit, Cancel |
| In Progress | Complete Visit, Cancel |
| Completed | Bill This Visit (if not billed), Dispense (if has prescription) |
| Cancelled | None |

#### T.3.6 OPD Date Filtering

**Default View**: Today's visits only.

**All Time View**: Shows all visits grouped by date.
- Date picker for specific date navigation
- Previous/Next day quick navigation
- Today button to return to current date

**Date Navigation**:
```
[←] [Today] [→]   [📅 02 Jul 2026]
```

#### T.3.7 Prescription Builder

When creating/editing a visit, the prescription builder allows adding medicines:

```
Prescription:
┌─────────────────────────────────────────────────────────┐
│ [Ashwagandha ▼]  [500mg]                               │
│ [Twice daily ▼]  [2 weeks]                             │
│ [Take with warm milk (optional)]                        │
│ [+ Add]                                                 │
├─────────────────────────────────────────────────────────┤
│ 1. Ashwagandha Churna — 500mg Twice daily × 2 weeks    │
│    Take with warm milk                          [×]     │
│ 2. Triphala Tablets — 500mg After meals × 1 month      │
│    Take with warm water                          [×]    │
└─────────────────────────────────────────────────────────┘
```

**Prescription Fields**:
| Field | Type | Options |
|-------|------|---------|
| Medicine | text/autocomplete | Search from pharmacy inventory |
| Dosage | text | Free text (e.g., 500mg, 10ml) |
| Frequency | select | Once daily, Twice daily, Thrice daily, Before meals, After meals, At bedtime |
| Duration | text | Free text (e.g., 7 days, 2 weeks, 1 month) |
| Instructions | text | Optional (e.g., Take with warm water) |

### T.4 Billing Module

#### T.4.1 Billing Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Billing                                                    │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Today    │  │ Month    │  │ Pending  │  │ Total    │  │
│  │ ₹8,500   │  │ ₹45,000  │  │ ₹12,000  │  │ ₹2,34,000│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  INV-20260702-001  Ramesh Kumar   ₹500  [Paid]      │   │
│  │  INV-20260702-002  Suresh Patel   ₹750  [Pending]   │   │
│  │  INV-20260701-003  Anita Sharma   ₹1,200 [Partial]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### T.4.2 Invoice Generation Flow

```
1. Visit completed → "Bill This Visit" button appears
2. User clicks "Bill This Visit"
3. Quick Invoice Modal opens with pre-filled data:
   - Patient name (from visit)
   - Visit ID (linked)
   - Consultation fee (from visit)
4. User adds additional items (if any):
   - Medicine charges
   - Procedure charges
   - Investigation charges
5. User applies discount (if any):
   - Fixed amount (₹100 off)
   - Percentage (10% off)
6. System calculates:
   - Subtotal = sum of all item totals
   - Discount = fixed amount or percentage of subtotal
   - Total = Subtotal - Discount
7. User selects payment method:
   - Cash
   - Card
   - UPI
   - Insurance
8. User enters amount paid:
   - Full amount → status = 'paid'
   - Partial amount → status = 'partial'
   - Zero → status = 'pending'
9. User clicks "Create Invoice"
10. System generates invoice number (INV-YYYYMMDD-XXX)
11. System saves invoice
12. Invoice appears in billing list
```

#### T.4.3 Invoice Number Format

```
INV-YYYYMMDD-XXX

Examples:
INV-20260702-001  (First invoice on 2 Jul 2026)
INV-20260702-002  (Second invoice on 2 Jul 2026)
INV-20260703-001  (First invoice on 3 Jul 2026)
```

#### T.4.4 Payment Status Logic

```typescript
function calculatePaymentStatus(total: number, paidAmount: number): 'paid' | 'partial' | 'pending' {
  if (paidAmount >= total) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'pending';
}

// Examples:
// calculatePaymentStatus(500, 500) → 'paid'
// calculatePaymentStatus(500, 300) → 'partial'
// calculatePaymentStatus(500, 0)   → 'pending'
```

#### T.4.5 Revenue Calculations

```typescript
// Today's revenue
const today = new Date().toISOString().split('T')[0];
const todayRevenue = invoices
  .filter(i => i.createdAt.startsWith(today))
  .reduce((sum, i) => sum + i.total, 0);

// This month's revenue
const monthPrefix = new Date().toISOString().slice(0, 7);
const monthRevenue = invoices
  .filter(i => i.createdAt.startsWith(monthPrefix))
  .reduce((sum, i) => sum + i.total, 0);

// Pending amount
const pendingAmount = invoices
  .filter(i => i.paymentStatus === 'pending' || i.paymentStatus === 'partial')
  .reduce((sum, i) => sum + (i.total - i.paidAmount), 0);
```

#### T.4.6 Invoice Line Items

Each invoice can have multiple line items:

```typescript
interface InvoiceItem {
  description: string;     // "Consultation Fee", "Ashwagandha Churna"
  quantity: number;         // 1, 2, 3...
  unitPrice: number;        // 500, 100, 250...
  total: number;            // quantity × unitPrice
}

// Example invoice
{
  items: [
    { description: "Consultation Fee", quantity: 1, unitPrice: 500, total: 500 },
    { description: "Ashwagandha Churna", quantity: 2, unitPrice: 120, total: 240 },
    { description: "Triphala Tablets", quantity: 1, unitPrice: 85, total: 85 },
  ],
  subtotal: 825,
  discount: 50,
  total: 775,
}
```

### T.5 Pharmacy Module

#### T.5.1 Pharmacy Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Pharmacy Inventory                                         │
│                                                             │
│  [+ Add Medicine]                                           │
│                                                             │
│  Search: [Search medicines...]                              │
│  Filter: [All] [Ayurvedic] [Allopathic] [Siddha]           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Ashwagandha Churna    Ayurvedic     15 units       │   │
│  │  ₹120/bottle           Stock: 15     [Reorder: 20]  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Triphala Tablets      Ayurvedic     8 packets      │   │
│  │  ₹85/packet            Stock: 8      [Reorder: 10]  │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  Brahmi Ghrita         Ayurvedic     3 bottles      │   │
│  │  ₹250/bottle           Stock: 3      [Reorder: 5]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### T.5.2 Medicine Categories

| Category | Description | Examples |
|----------|-------------|----------|
| Ayurvedic | Classical formulations | Ashwagandha, Triphala, Guggulu |
| Allopathic | Modern medicines | Paracetamul, Amoxicillin |
| Siddha | Tamil traditional | Nilavembu, Kaba Suri |

#### T.5.3 Medicine Units

| Unit | Usage |
|------|-------|
| tablets | Tablets, pills, capsules |
| bottles | Liquid medicines, syrups |
| grams | Powders (churna) |
| ml | Liquid medicines, oils |
| packets | Packaged medicines |

#### T.5.4 Low Stock Alert

When stock quantity ≤ reorder level, show warning:

```
⚠ Low Stock Alert
┌─────────────────────────────────────────────┐
│  ⚠ Ashwagandha Churna     15 units         │
│    Reorder level: 20    (5 below minimum)   │
├─────────────────────────────────────────────┤
│  ⚠ Triphala Tablets       8 packets        │
│    Reorder level: 10    (2 below minimum)   │
├─────────────────────────────────────────────┤
│  ⚠ Brahmi Ghrita          3 bottles        │
│    Reorder level: 5     (2 below minimum)   │
└─────────────────────────────────────────────┘
```

#### T.5.5 Dispensing Flow

```
1. Doctor completes visit with prescription
2. "Dispense" button appears on visit card
3. User clicks "Dispense"
4. DispenseMedicineModal opens:
   - Shows patient name and visit details
   - Shows prescribed medicines
   - Search box for pharmacy inventory
5. User searches for medicine
6. System shows matching medicines with stock info
7. User selects medicine and enters quantity
8. System validates:
   - Sufficient stock available
   - Quantity > 0
9. User clicks "Dispense"
10. System:
    - Decrements stock quantity
    - Creates dispensing record
    - Shows success message
11. User can dispense more medicines or close modal
```

#### T.5.6 Stock Validation

```typescript
function canDispense(medicine: Medicine, quantity: number): { allowed: boolean; reason?: string } {
  if (quantity <= 0) {
    return { allowed: false, reason: 'Quantity must be greater than 0' };
  }
  if (medicine.quantity < quantity) {
    return { allowed: false, reason: `Insufficient stock. Available: ${medicine.quantity} ${medicine.unit}` };
  }
  return { allowed: true };
}
```

#### T.5.7 Dispensing Record

Every dispensing operation creates a record:

```typescript
interface DispensingRecord {
  id: string;                    // disp_timestamp_random
  patientId: string;             // FK → patient
  patientName: string;           // Denormalized
  visitId: string;               // FK → visit
  medicineId: string;            // FK → medicine
  medicineName: string;          // Denormalized
  quantityDispensed: number;
  unit: string;
  dispensedBy: string;           // Doctor name
  dispensedAt: string;           // ISO 8601 timestamp
}
```

---

## Appendix U: HIMS-Specific React Patterns

### U.1 Context Provider Nesting

The HIMS module uses multiple context providers that must be nested correctly:

```tsx
// Correct nesting order (outer to inner)
<HimsPatientProvider>
  <OpdProvider>
    <BillingProvider>
      <PharmacyProvider>
        <HimsLayout />
      </PharmacyProvider>
    </BillingProvider>
  </OpdProvider>
</HimsPatientProvider>
```

**Why this order?**
- Patient context is independent (no dependencies)
- OPD depends on Patient (visits reference patients)
- Billing depends on Patient and OPD (invoices reference patients and visits)
- Pharmacy is independent but dispenses to patients/visits

### U.2 Cross-Context Data Access

When a component needs data from multiple contexts:

```typescript
function HimsOPD() {
  // Access multiple contexts
  const { patients } = useHimsPatients();
  const { visits, updateVisitStatus } = useOpd();
  const { invoices } = useBilling();
  const { medicines, dispenseMedicine } = usePharmacy();
  
  // Combine data for display
  const enrichedVisits = visits.map(visit => ({
    ...visit,
    patient: patients.find(p => p.id === visit.patientId),
    invoice: invoices.find(i => i.visitId === visit.id),
    hasMedicines: visit.prescription.length > 0,
  }));
  
  return (
    <div>
      {enrichedVisits.map(visit => (
        <VisitCard 
          key={visit.id} 
          visit={visit}
          patient={visit.patient}
          invoice={visit.invoice}
        />
      ))}
    </div>
  );
}
```

### U.3 Modal State Management Pattern

```typescript
function HimsOPD() {
  // Multiple modal states
  const [showCreate, setShowCreate] = useState(false);
  const [billingVisit, setBillingVisit] = useState<OpdVisit | null>(null);
  const [dispenseVisit, setDispenseVisit] = useState<OpdVisit | null>(null);
  const [editingVisit, setEditingVisit] = useState<OpdVisit | null>(null);
  
  // Only one modal can be open at a time
  const openModal = (type: string, data?: any) => {
    // Close all modals first
    setShowCreate(false);
    setBillingVisit(null);
    setDispenseVisit(null);
    setEditingVisit(null);
    
    // Open the requested modal
    switch (type) {
      case 'create':
        setShowCreate(true);
        break;
      case 'billing':
        setBillingVisit(data);
        break;
      case 'dispense':
        setDispenseVisit(data);
        break;
      case 'edit':
        setEditingVisit(data);
        break;
    }
  };
  
  return (
    <div>
      {/* Page content */}
      
      {/* Modals */}
      {showCreate && <CreateVisitModal onClose={() => openModal('')} />}
      {billingVisit && (
        <QuickInvoiceModal 
          visit={billingVisit} 
          onClose={() => openModal('')} 
        />
      )}
      {dispenseVisit && (
        <DispenseMedicineModal 
          visit={dispenseVisit} 
          onClose={() => openModal('')} 
        />
      )}
    </div>
  );
}
```

### U.4 Form with Validation Pattern

```typescript
function RegisterPatientModal({ onClose }: { onClose: () => void }) {
  const { addPatient, getPatientByPhone } = useHimsPatients();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male' as const,
    phone: '',
    // ... other fields
  });
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Field update helper
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    // ... more validations
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      addPatient({
        name: formData.name.trim(),
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        phone: formData.phone.trim(),
        // ... other fields
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal isOpen={true} onClose={onClose} title="Register Patient">
      <form onSubmit={handleSubmit}>
        {/* Name field */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={`w-full px-3 py-2.5 text-sm rounded-lg border ${
              errors.name ? 'border-red-500' : 'border-surface-200'
            }`}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
        
        {/* ... more fields */}
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register Patient'}
        </Button>
      </form>
    </Modal>
  );
}
```

### U.5 Search with Debounce Pattern

```typescript
function useDebouncedSearch<T>(
  items: T[],
  searchFields: (keyof T)[],
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);
    return () => clearTimeout(timer);
  }, [query, delay]);
  
  const results = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    const q = debouncedQuery.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return String(value).toLowerCase().includes(q);
      })
    );
  }, [debouncedQuery, items, searchFields]);
  
  return { query, setQuery, results };
}

// Usage
function PatientSearch() {
  const { patients } = useHimsPatients();
  const { query, setQuery, results } = useDebouncedSearch(
    patients,
    ['name', 'mrn', 'phone'],
    300
  );
  
  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search patients..."
      />
      {results.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg">
          {results.map(patient => (
            <PatientSearchResult key={patient.id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### U.6 Loading & Empty States Pattern

```typescript
function HimsPatients() {
  const { patients, searchPatients } = useHimsPatients();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading (for real app, fetch from API)
    setIsLoading(false);
  }, []);
  
  const filteredPatients = searchQuery ? searchPatients(searchQuery) : patients;
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }
  
  // Empty state (no patients at all)
  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 mx-auto mb-4 text-surface-300" />
        <p className="text-lg mb-2">No patients registered</p>
        <p className="text-sm mb-4">Register your first patient to get started</p>
        <Button onClick={() => openModal('register')}>Register First Patient</Button>
      </div>
    );
  }
  
  // No search results
  if (searchQuery && filteredPatients.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 mx-auto mb-4 text-surface-300" />
        <p className="text-lg mb-2">No patients found</p>
        <p className="text-sm">Try a different search term</p>
      </div>
    );
  }
  
  // Normal list view
  return (
    <div>
      {filteredPatients.map(patient => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
}
```

### U.7 Responsive Layout Pattern

```typescript
function HimsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="h-screen flex flex-col bg-surface-50 dark:bg-surface-950">
      {/* Header - always visible */}
      <HimsHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - desktop only */}
        <div className="hidden md:block">
          <HimsSidebar isOpen={sidebarOpen} />
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      
      {/* Bottom tabs - mobile only */}
      <div className="md:hidden">
        <HimsBottomTabs />
      </div>
    </div>
  );
}
```

**Responsive Breakpoints**:
| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Single column, bottom tabs, no sidebar |
| Tablet | 768px - 1024px | Collapsible sidebar, no bottom tabs |
| Desktop | > 1024px | Full sidebar, no bottom tabs |

### U.8 Toast/Notification Pattern

```typescript
function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  
  const ToastComponent = toast ? (
    <div className={`fixed bottom-20 md:bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
      toast.type === 'success' ? 'bg-green-600 text-white' :
      toast.type === 'error' ? 'bg-red-600 text-white' :
      toast.type === 'warning' ? 'bg-amber-600 text-white' :
      'bg-blue-600 text-white'
    }`}>
      {toast.message}
    </div>
  ) : null;
  
  return { showToast, ToastComponent };
}

// Usage
function MyComponent() {
  const { showToast, ToastComponent } = useToast();
  
  const handleSave = () => {
    // ... save logic
    showToast('Patient registered successfully', 'success');
  };
  
  return (
    <div>
      {/* Component content */}
      {ToastComponent}
    </div>
  );
}
```

---

## Appendix V: Data Integrity Rules

### V.1 Referential Integrity

| Relationship | Rule | Enforcement |
|--------------|------|-------------|
| Visit → Patient | Visit must reference existing patient | Check patientId exists before saving visit |
| Invoice → Patient | Invoice must reference existing patient | Check patientId exists before saving invoice |
| Invoice → Visit | Invoice optionally references existing visit | Check visitId exists if provided |
| Dispensing → Patient | Dispensing must reference existing patient | Check patientId exists |
| Dispensing → Visit | Dispensing must reference existing visit | Check visitId exists |
| Dispensing → Medicine | Dispensing must reference existing medicine | Check medicineId exists |

### V.2 Business Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| BR-01 | Patient phone must be unique | Check before registration |
| BR-02 | MRN must be unique | Auto-generated, guaranteed unique |
| BR-03 | Invoice number must be unique | Auto-generated, guaranteed unique |
| BR-04 | Visit status cannot go backward | Validate transition |
| BR-05 | Completed visit cannot be deleted | Check status before delete |
| BR-06 | Medicine stock cannot be negative | Validate before dispensing |
| BR-07 | Invoice total must equal subtotal minus discount | Calculate, don't accept manual total |
| BR-08 | Paid amount cannot exceed total | Validate on payment |

### V.3 Data Consistency Rules

| Rule | Description | Implementation |
|------|-------------|----------------|
| DC-01 | Denormalized fields must match source | Update patientName in visits when patient name changes |
| DC-02 | Dates must be ISO 8601 format | Always use `new Date().toISOString()` |
| DC-03 | Money amounts must be in paise or rounded | Use `Math.round(amount * 100) / 100` |
| DC-04 | IDs must use prefixed format | Use `prefix_timestamp_random` pattern |
| DC-05 | localStorage keys must be prefixed | Use `hims_` prefix for all HIMS keys |

### V.4 Audit Trail (Future Phase)

Every data modification should log:

```typescript
interface AuditEntry {
  id: string;
  timestamp: string;
  entityType: 'patient' | 'visit' | 'invoice' | 'medicine' | 'dispensing';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  userId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

// Example
{
  id: 'audit_123',
  timestamp: '2026-07-02T10:30:00Z',
  entityType: 'visit',
  entityId: 'vst_123',
  action: 'update',
  userId: 'user_456',
  changes: [
    { field: 'status', oldValue: 'waiting', newValue: 'in-progress' },
    { field: 'diagnosis', oldValue: '', newValue: 'Amavata' },
  ],
}
```

---

## Appendix W: Future Feature Specifications

### W.1 Vitals Recording (Phase 2)

```typescript
interface Vitals {
  id: string;
  visitId: string;
  patientId: string;
  recordedAt: string;
  recordedBy: string;
  
  // Standard vitals
  height: number;        // cm
  weight: number;        // kg
  bmi: number;           // Auto-calculated
  bloodPressureSystolic: number;   // mmHg
  bloodPressureDiastolic: number;  // mmHg
  pulse: number;         // beats per minute
  temperature: number;   // °C
  respiratoryRate: number; // breaths per minute
  spO2: number;          // percentage
  
  // Ayurveda-specific
  prakritiObservation: string;
  tongueExamination: string;
  pulseQuality: string;  // Nadi Pariksha
}
```

### W.2 Appointment Scheduling (Phase 2)

```typescript
interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  duration: number;        // minutes
  type: 'consultation' | 'follow-up' | 'therapy';
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: string;
}

interface DoctorSchedule {
  doctorName: string;
  dayOfWeek: number;       // 0-6 (Sunday-Saturday)
  startTime: string;       // "09:00"
  endTime: string;         // "17:00"
  slotDuration: number;    // 15, 20, 30 minutes
  maxPatients: number;
}
```

### W.3 IPD Module (Phase 3)

```typescript
interface IpdAdmission {
  id: string;
  patientId: string;
  patientName: string;
  bedNumber: number;
  admissionDate: string;
  dischargeDate?: string;
  admittingDoctor: string;
  diagnosis: string;
  treatmentPlan: string;
  status: 'active' | 'discharged' | 'transferred';
  dailyNotes: IpdDailyNote[];
}

interface IpdDailyNote {
  date: string;
  doctor: string;
  notes: string;
  vitals: Vitals;
  medications: PrescriptionItem[];
  diet: string;
  nextPlan: string;
}

interface Bed {
  number: number;
  ward: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  patientId?: string;
  admissionId?: string;
}
```

### W.4 Laboratory Module (Phase 3)

```typescript
interface LabOrder {
  id: string;
  patientId: string;
  visitId: string;
  orderedBy: string;
  orderedAt: string;
  tests: LabTest[];
  status: 'ordered' | 'sample-collected' | 'processing' | 'completed';
}

interface LabTest {
  id: string;
  name: string;
  category: string;
  result?: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  reportedAt?: string;
  reportedBy?: string;
}

interface LabReport {
  id: string;
  orderId: string;
  patientId: string;
  generatedAt: string;
  tests: LabTest[];
  notes?: string;
}
```

### W.5 Insurance/TPA Billing (Phase 3)

```typescript
interface InsuranceClaim {
  id: string;
  invoiceId: string;
  patientId: string;
  insuranceProvider: string;
  policyNumber: string;
  claimAmount: number;
  approvedAmount?: number;
  status: 'submitted' | 'under-review' | 'approved' | 'rejected' | 'paid';
  submittedAt: string;
  resolvedAt?: string;
  rejectionReason?: string;
}
```

### W.6 Multi-Branch Support (Phase 4)

```typescript
interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  doctors: string[];
  isActive: boolean;
}

interface MultiBranchPatient {
  // Patient can visit multiple branches
  // Centralized patient record
  // Branch-specific visit history
}
```

### W.7 ABHA Integration (Phase 4)

```typescript
interface AbhaProfile {
  abhaNumber: string;
  patientId: string;
  linkedAt: string;
  isActive: boolean;
}

// ABHA API integration for:
// - Health ID verification
// - Consent-based record sharing
// - Insurance verification
```

---

## Appendix X: Performance Optimization Checklist

### X.1 Before Each Release

- [ ] Bundle size under 300KB gzipped
- [ ] No memory leaks (check React DevTools Profiler)
- [ ] localStorage usage under 4MB
- [ ] All images optimized (if any)
- [ ] No unnecessary re-renders (check with Profiler)
- [ ] Search debounced (300ms delay)
- [ ] Large lists virtualized (if > 100 items)
- [ ] Lazy loading for route components
- [ ] Code splitting for modal components
- [ ] No inline functions in render (use useCallback)

### X.2 Bundle Analysis

```bash
# Analyze bundle size
npx vite-bundle-visualizer

# Check for large dependencies
npx source-map-explorer dist/assets/*.js

# Target:
# - React + React DOM: ~40KB gzipped
# - React Router: ~10KB gzipped
# - Tailwind CSS: ~10KB gzipped
# - HIMS module: ~50KB gzipped
# - AyurGPT module: ~80KB gzipped
# - Total: < 200KB gzipped
```

### X.3 localStorage Optimization

```typescript
// Monitor localStorage usage
function getStorageUsage(): { used: number; available: number; percentage: number } {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length * 2; // UTF-16
    }
  }
  
  const maxStorage = 5 * 1024 * 1024; // 5MB typical limit
  return {
    used: total,
    available: maxStorage - total,
    percentage: (total / maxStorage) * 100,
  };
}

// Warn when approaching limit
function checkStorageHealth() {
  const { percentage } = getStorageUsage();
  if (percentage > 80) {
    console.warn(`localStorage usage at ${percentage.toFixed(1)}%. Consider migrating to Supabase.`);
  }
}
```

### X.4 React Performance Patterns

```typescript
// 1. Memoize expensive computations
const expensiveResult = useMemo(() => {
  return data.filter(complexFilter).map(complexTransform);
}, [data]);

// 2. Memoize callbacks passed to children
const handleDelete = useCallback((id: string) => {
  deleteItem(id);
}, [deleteItem]);

// 3. Memoize context values
const contextValue = useMemo(() => ({
  items,
  addItem,
  updateItem,
  deleteItem,
}), [items, addItem, updateItem, deleteItem]);

// 4. Use React.memo for pure components
const PatientCard = React.memo(({ patient }: { patient: HimsPatient }) => {
  return <div>{patient.name}</div>;
});

// 5. Avoid inline objects/arrays in JSX
// BAD
<div style={{ padding: '10px' }}>...</div>

// GOOD
const styles = { padding: '10px' };
<div style={styles}>...</div>
```

---

## Appendix Y: Complete HIMS API Reference (When Using Supabase)

### Y.1 Patient API

```typescript
// Create patient
const { data, error } = await supabase
  .from('hims_patients')
  .insert({
    mrn: 'MRN-20260702-001',
    name: 'Ramesh Kumar',
    age: 45,
    gender: 'Male',
    phone: '9876543210',
    prakriti: 'Vata',
    vikriti: 'Vata-Pitta',
    created_at: new Date().toISOString(),
  })
  .select()
  .single();

// Read patients
const { data, error } = await supabase
  .from('hims_patients')
  .select('*')
  .order('created_at', { ascending: false });

// Search patients
const { data, error } = await supabase
  .from('hims_patients')
  .select('*')
  .or(`name.ilike.%${query}%,mrn.ilike.%${query}%,phone.ilike.%${query}%`);

// Update patient
const { data, error } = await supabase
  .from('hims_patients')
  .update({ name: 'New Name' })
  .eq('id', patientId);

// Delete patient (soft delete)
const { data, error } = await supabase
  .from('hims_patients')
  .update({ deleted: true, deleted_at: new Date().toISOString() })
  .eq('id', patientId);
```

### Y.2 Visit API

```typescript
// Create visit
const { data, error } = await supabase
  .from('hims_visits')
  .insert({
    patient_id: patientId,
    patient_name: patientName,
    doctor_name: doctorName,
    visit_date: new Date().toISOString(),
    chief_complaint: chiefComplaint,
    diagnosis: '',
    prescription: [],
    status: 'waiting',
    consultation_fee: 500,
  })
  .select()
  .single();

// Read visits for today
const today = new Date().toISOString().split('T')[0];
const { data, error } = await supabase
  .from('hims_visits')
  .select('*')
  .gte('visit_date', today)
  .lt('visit_date', today + 'T23:59:59')
  .order('visit_date', { ascending: false });

// Update visit status
const { data, error } = await supabase
  .from('hims_visits')
  .update({ status: 'completed' })
  .eq('id', visitId);
```

### Y.3 Invoice API

```typescript
// Create invoice
const { data, error } = await supabase
  .from('hims_invoices')
  .insert({
    invoice_number: 'INV-20260702-001',
    patient_id: patientId,
    patient_name: patientName,
    visit_id: visitId,
    items: [
      { description: 'Consultation', quantity: 1, unit_price: 500, total: 500 },
    ],
    subtotal: 500,
    discount: 0,
    total: 500,
    payment_method: 'cash',
    payment_status: 'paid',
    paid_amount: 500,
    created_at: new Date().toISOString(),
  })
  .select()
  .single();

// Read invoices
const { data, error } = await supabase
  .from('hims_invoices')
  .select('*')
  .order('created_at', { ascending: false });

// Calculate revenue
const { data, error } = await supabase
  .from('hims_invoices')
  .select('total')
  .gte('created_at', monthStart)
  .lt('created_at', monthEnd);

const revenue = data?.reduce((sum, inv) => sum + inv.total, 0) || 0;
```

### Y.4 Medicine API

```typescript
// Add medicine
const { data, error } = await supabase
  .from('hims_medicines')
  .insert({
    name: 'Ashwagandha Churna',
    category: 'Ayurvedic',
    manufacturer: 'Himalaya',
    quantity: 50,
    unit: 'bottles',
    price: 120,
    reorder_level: 20,
    created_at: new Date().toISOString(),
  })
  .select()
  .single();

// Dispense medicine (atomic operation)
const { data: medicine, error: fetchError } = await supabase
  .from('hims_medicines')
  .select('quantity')
  .eq('id', medicineId)
  .single();

if (medicine && medicine.quantity >= quantityToDispense) {
  const { error: updateError } = await supabase
    .from('hims_medicines')
    .update({ quantity: medicine.quantity - quantityToDispense })
    .eq('id', medicineId);
    
  // Create dispensing record
  await supabase.from('hims_dispensing').insert({ ... });
}
```

### Y.5 Row Level Security (RLS)

```sql
-- Enable RLS on all HIMS tables
ALTER TABLE hims_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE hims_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE hims_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE hims_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE hims_dispensing ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own clinic's data
CREATE POLICY "Clinic data isolation" ON hims_patients
  FOR ALL USING (clinic_id = auth.jwt() ->> 'clinic_id');

-- Policy: Admin can access all data
CREATE POLICY "Admin full access" ON hims_patients
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

---

## Appendix Z: Quick Reference Card

### Z.1 ID Prefixes

| Entity | Prefix | Example |
|--------|--------|---------|
| Patient | `hpat_` | `hpat_1719876543_a3f2k1` |
| Visit | `vst_` | `vst_1719876543_b7c4d2` |
| Invoice | `inv_` | `inv_1719876543_e9f0g3` |
| Medicine | `med_` | `med_1719876543_h1i2j3` |
| Dispensing | `disp_` | `disp_1719876543_k4l5m6` |

### Z.2 localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `hims_patients` | `HimsPatient[]` | All patients |
| `hims_visits` | `OpdVisit[]` | All visits |
| `hims_invoices` | `Invoice[]` | All invoices |
| `hims_medicines` | `Medicine[]` | Pharmacy inventory |
| `hims_dispensing` | `DispensingRecord[]` | Dispensing history |

### Z.3 Status Values

| Entity | Statuses |
|--------|----------|
| Visit | `waiting`, `in-progress`, `completed`, `cancelled` |
| Invoice | `paid`, `pending`, `partial` |
| Medicine | Active (stock > 0), Low Stock (stock ≤ reorder), Out of Stock (stock = 0) |

### Z.4 Color Codes

| Status | Light | Dark |
|--------|-------|------|
| Waiting | `bg-amber-100 text-amber-700` | `bg-amber-900/30 text-amber-400` |
| In Progress | `bg-blue-100 text-blue-700` | `bg-blue-900/30 text-blue-400` |
| Completed | `bg-green-100 text-green-700` | `bg-green-900/30 text-green-400` |
| Cancelled | `bg-surface-100 text-surface-500` | `bg-surface-800` |
| Paid | `bg-green-100 text-green-700` | `bg-green-900/30 text-green-400` |
| Pending | `bg-amber-100 text-amber-700` | `bg-amber-900/30 text-amber-400` |
| Partial | `bg-blue-100 text-blue-700` | `bg-blue-900/30 text-blue-400` |

### Z.5 Common Imports

```typescript
// React
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Router
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// Icons
import { Plus, Search, X, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

// UI Components
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';

// HIMS Contexts
import { useHimsPatients } from '../contexts/HimsPatientContext';
import { useOpd } from '../contexts/OpdContext';
import { useBilling } from '../contexts/BillingContext';
import { usePharmacy } from '../contexts/PharmacyContext';

// HIMS Types
import type { HimsPatient, OpdVisit, Invoice, Medicine } from '../types';
import { DOCTORS, MEDICINE_CATEGORIES } from '../types';
```

### Z.6 Formulas

```
MRN Format: MRN-{YYYYMMDD}-{sequence}
Invoice Format: INV-{YYYYMMDD}-{sequence}
ID Format: {prefix}_{timestamp}_{random6}
BMI: weight(kg) / (height(m))²
Stock Status: quantity <= reorderLevel → Low Stock
Payment Status: paidAmount >= total → paid, paidAmount > 0 → partial, else → pending
Revenue: sum of invoice totals within date range
```

---

---

## Appendix AA: HIMS Page Component Specifications

### AA.1 HimsDashboard Component

**Purpose**: Main dashboard showing clinic overview statistics and alerts.

**Props**: None (top-level page component)

**Data Sources**:
- `useHimsPatients()` → `patients` array
- `useOpd()` → `visits` array
- `useBilling()` → `invoices`, `getTodayRevenue()`, `getMonthRevenue()`
- `usePharmacy()` → `lowStockMedicines` array

**Computed Values**:
```typescript
const today = new Date().toISOString().split('T')[0];
const todayVisits = visits.filter(v => v.visitDate.startsWith(today));
const recentVisits = visits.slice(0, 5);
const monthPrefix = new Date().toISOString().slice(0, 7);
const monthRevenue = invoices
  .filter(i => i.createdAt.startsWith(monthPrefix))
  .reduce((sum, i) => sum + i.total, 0);
```

**Sections**:
1. Stats Cards Row (4 cards: Patients, OPD, Revenue, Low Stock)
2. Recent Visits List (last 5 visits)
3. Low Stock Alert (medicines below reorder level)

**Click Actions**:
- Stats cards → Navigate to respective pages
- Recent visit → Navigate to patient detail
- Low stock item → Navigate to pharmacy

**Empty States**:
- No patients → "No patients registered yet"
- No visits → "No visits recorded yet"
- No low stock → No alert section shown

### AA.2 HimsPatients Component

**Purpose**: Patient list with search and registration.

**Props**: None (top-level page component)

**State**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [showRegister, setShowRegister] = useState(false);
```

**Computed Values**:
```typescript
const filteredPatients = searchQuery ? searchPatients(searchQuery) : patients;
```

**Sections**:
1. Header with title, patient count, and Register button
2. Search input
3. Patient list (or empty state)

**Patient Card Layout**:
```
┌─────────────────────────────────────────────┐
│  Ramesh Kumar      [MRN-20260702-001]       │
│  45y, Male    📱 9876543210                  │
│  Prakriti: Vata · Vikriti: Vata-Pitta       │
│                                    [→]      │
└─────────────────────────────────────────────┘
```

**Search Behavior**:
- Minimum 2 characters to trigger search
- Searches name, MRN, and phone
- Case-insensitive
- Results update as user types

### AA.3 HimsPatientDetail Component

**Purpose**: Full patient profile with visit history.

**Props**: None (uses `useParams` to get patient ID)

**Route**: `/hims/patients/:id`

**State**:
```typescript
const [showEdit, setShowEdit] = useState(false);
```

**Sections**:
1. Back button
2. Patient header (name, MRN, edit button)
3. Patient details grid (age, gender, phone, email, blood group)
4. Ayurveda details (Prakriti, Vikriti)
5. Allergies warning
6. Address
7. Emergency contact
8. Visit history list

**Visit History Item Layout**:
```
┌─────────────────────────────────────────────┐
│  2 Jul 2026                    [Billed] [Completed] │
│  Dr. Rajesh Sharma · Joint pain              │
│  Diagnosis: Amavata                          │
│  Rx: Ashwagandha Churna, Triphala Tablets    │
└─────────────────────────────────────────────┘
```

### AA.4 HimsOPD Component

**Purpose**: OPD queue management with visit creation and status updates.

**Props**: None (top-level page component)

**State**:
```typescript
const [showCreate, setShowCreate] = useState(false);
const [billingVisit, setBillingVisit] = useState<OpdVisit | null>(null);
const [dispenseVisit, setDispenseVisit] = useState<OpdVisit | null>(null);
const [filter, setFilter] = useState<'all' | 'waiting' | 'in-progress' | 'completed'>('all');
const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
const [showAllVisits, setShowAllVisits] = useState(false);
```

**Computed Values**:
```typescript
const dateVisits = showAllVisits
  ? visits
  : visits.filter(v => v.visitDate.startsWith(selectedDate));
const filteredVisits = filter === 'all'
  ? dateVisits
  : dateVisits.filter(v => v.status === filter);
```

**Sections**:
1. Header with New Visit button
2. Date picker with navigation (Prev/Today/Next)
3. All Time toggle
4. Filter tabs (All/Waiting/In Progress/Completed)
5. Visit list (or empty state)

**Visit Card Actions by Status**:
| Status | Actions |
|--------|---------|
| Waiting | Start Visit (→ in-progress), Cancel |
| In Progress | Complete Visit (→ completed), Cancel |
| Completed | Bill (if not billed), Dispense (if has prescription) |
| Cancelled | None |

### AA.5 HimsBilling Component

**Purpose**: Invoice list with revenue statistics.

**Props**: None (top-level page component)

**Sections**:
1. Revenue stats cards (Today, Month, Pending, Total)
2. Invoice list

**Invoice Card Layout**:
```
┌─────────────────────────────────────────────┐
│  INV-20260702-001                           │
│  Ramesh Kumar                    ₹500       │
│  2 Jul 2026, 10:30 AM        [Paid]         │
│  Cash payment                              │
└─────────────────────────────────────────────┘
```

### AA.6 HimsPharmacy Component

**Purpose**: Medicine inventory management.

**Props**: None (top-level page component)

**State**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [categoryFilter, setCategoryFilter] = useState<string>('all');
const [showAdd, setShowAdd] = useState(false);
```

**Computed Values**:
```typescript
const filteredMedicines = medicines.filter(m => {
  const matchesSearch = !searchQuery || 
    m.name.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesCategory = categoryFilter === 'all' || 
    m.category === categoryFilter;
  return matchesSearch && matchesCategory;
});
```

**Sections**:
1. Header with Add Medicine button
2. Search input
3. Category filter tabs
4. Medicine list (or empty state)
5. Low stock alert section

**Medicine Card Layout**:
```
┌─────────────────────────────────────────────┐
│  Ashwagandha Churna           Ayurvedic     │
│  ₹120/bottle                               │
│  Stock: 15 bottles    Reorder: 20           │
│  [Low Stock ⚠]                             │
└─────────────────────────────────────────────┘
```

---

## Appendix BB: HIMS Context Hook Reference

### BB.1 useHimsPatients()

```typescript
const {
  patients,                    // HimsPatient[]
  addPatient,                  // (data) => HimsPatient
  updatePatient,               // (id, updates) => void
  deletePatient,               // (id) => boolean
  getPatient,                  // (id) => HimsPatient | undefined
  searchPatients,              // (query) => HimsPatient[]
  getPatientByMrn,             // (mrn) => HimsPatient | undefined
  getPatientByPhone,           // (phone) => HimsPatient | undefined
} = useHimsPatients();
```

**Usage Examples**:
```typescript
// Get all patients
const { patients } = useHimsPatients();

// Add a patient
const { addPatient } = useHimsPatients();
const newPatient = addPatient({
  name: 'Ramesh Kumar',
  age: 45,
  gender: 'Male',
  phone: '9876543210',
});

// Search patients
const { searchPatients } = useHimsPatients();
const results = searchPatients('ramesh');

// Get specific patient
const { getPatient } = useHimsPatients();
const patient = getPatient('hpat_1234567890_abc123');
```

### BB.2 useOpd()

```typescript
const {
  visits,                      // OpdVisit[]
  addVisit,                    // (data) => void
  updateVisitStatus,           // (id, status) => void
  updateVisit,                 // (id, updates) => void
  getVisit,                    // (id) => OpdVisit | undefined
  getVisitsByPatient,          // (patientId) => OpdVisit[]
  getTodayVisits,              // () => OpdVisit[]
  getVisitsByDate,             // (date) => OpdVisit[]
  getVisitsByDoctor,           // (doctorName) => OpdVisit[]
} = useOpd();
```

**Usage Examples**:
```typescript
// Get today's visits
const { getTodayVisits } = useOpd();
const todayVisits = getTodayVisits();

// Create a visit
const { addVisit } = useOpd();
addVisit({
  patientId: 'hpat_123',
  patientName: 'Ramesh Kumar',
  doctorName: 'Dr. Rajesh Sharma',
  chiefComplaint: 'Joint pain',
  status: 'waiting',
  consultationFee: 500,
});

// Update visit status
const { updateVisitStatus } = useOpd();
updateVisitStatus('vst_123', 'completed');

// Get visits for a patient
const { getVisitsByPatient } = useOpd();
const patientVisits = getVisitsByPatient('hpat_123');
```

### BB.3 useBilling()

```typescript
const {
  invoices,                    // Invoice[]
  addInvoice,                  // (data) => Invoice
  updateInvoice,               // (id, updates) => void
  getInvoice,                  // (id) => Invoice | undefined
  getInvoicesByPatient,        // (patientId) => Invoice[]
  getInvoicesByDate,           // (date) => Invoice[]
  getTodayRevenue,             // () => number
  getMonthRevenue,             // () => number
  getPendingAmount,            // () => number
} = useBilling();
```

**Usage Examples**:
```typescript
// Get today's revenue
const { getTodayRevenue } = useBilling();
const todayRevenue = getTodayRevenue();

// Create an invoice
const { addInvoice } = useBilling();
const invoice = addInvoice({
  patientId: 'hpat_123',
  patientName: 'Ramesh Kumar',
  visitId: 'vst_456',
  items: [
    { description: 'Consultation', quantity: 1, unitPrice: 500, total: 500 },
  ],
  subtotal: 500,
  discount: 0,
  total: 500,
  paymentMethod: 'cash',
  paymentStatus: 'paid',
  paidAmount: 500,
});

// Get pending amount
const { getPendingAmount } = useBilling();
const pending = getPendingAmount();
```

### BB.4 usePharmacy()

```typescript
const {
  medicines,                   // Medicine[]
  lowStockMedicines,           // Medicine[]
  dispensingRecords,           // DispensingRecord[]
  addMedicine,                 // (data) => void
  updateMedicine,              // (id, updates) => void
  deleteMedicine,              // (id) => void
  dispenseMedicine,            // (medicineId, quantity, patientId, patientName, visitId, dispensedBy) => DispensingRecord | null
  getMedicine,                 // (id) => Medicine | undefined
  searchMedicines,             // (query) => Medicine[]
  getDispensingByVisit,        // (visitId) => DispensingRecord[]
} = usePharmacy();
```

**Usage Examples**:
```typescript
// Get low stock medicines
const { lowStockMedicines } = usePharmacy();

// Add a medicine
const { addMedicine } = usePharmacy();
addMedicine({
  name: 'Ashwagandha Churna',
  category: 'Ayurvedic',
  quantity: 50,
  unit: 'bottles',
  price: 120,
  reorderLevel: 20,
});

// Dispense medicine
const { dispenseMedicine } = usePharmacy();
const record = dispenseMedicine(
  'med_123',          // medicineId
  2,                  // quantity
  'hpat_456',         // patientId
  'Ramesh Kumar',     // patientName
  'vst_789',          // visitId
  'Dr. Rajesh Sharma' // dispensedBy
);

// Search medicines
const { searchMedicines } = usePharmacy();
const results = searchMedicines('ashwagandha');
```

---

## Appendix CC: HIMS Routing Reference

### CC.1 Route Structure

```typescript
// src/App.tsx
<Routes>
  {/* Selection Page */}
  <Route path="/" element={<SelectionPage />} />
  
  {/* AyurGPT Routes */}
  <Route path="/ayurgpt" element={<AyurGPTLayout />}>
    <Route path="chat" element={<ChatPage />} />
    <Route path="knowledge" element={<KnowledgePage />} />
    <Route path="protocols" element={<ProtocolsPage />} />
  </Route>
  
  {/* HIMS Routes */}
  <Route path="/hims" element={
    <HimsPatientProvider>
      <OpdProvider>
        <BillingProvider>
          <PharmacyProvider>
            <HimsLayout />
          </PharmacyProvider>
        </BillingProvider>
      </OpdProvider>
    </HimsPatientProvider>
  }>
    <Route index element={<Navigate to="/hims/dashboard" replace />} />
    <Route path="dashboard" element={<HimsDashboard />} />
    <Route path="patients" element={<HimsPatients />} />
    <Route path="patients/:id" element={<HimsPatientDetail />} />
    <Route path="opd" element={<HimsOPD />} />
    <Route path="billing" element={<HimsBilling />} />
    <Route path="pharmacy" element={<HimsPharmacy />} />
  </Route>
</Routes>
```

### CC.2 Navigation Links

| From | To | Path |
|------|----|------|
| Selection Page | HIMS Dashboard | `/hims/dashboard` |
| HIMS Header | Home | `/` |
| HIMS Sidebar | Dashboard | `/hims/dashboard` |
| HIMS Sidebar | Patients | `/hims/patients` |
| HIMS Sidebar | OPD | `/hims/opd` |
| HIMS Sidebar | Billing | `/hims/billing` |
| HIMS Sidebar | Pharmacy | `/hims/pharmacy` |
| Patient List | Patient Detail | `/hims/patients/{id}` |
| OPD | Patient Detail | `/hims/patients/{patientId}` |

### CC.3 Route Parameters

| Route | Parameters | Description |
|-------|-----------|-------------|
| `/hims/patients/:id` | `id` | Patient unique ID (hpat_...) |
| `/hims/opd` | None | OPD queue page |
| `/hims/billing` | None | Billing dashboard |
| `/hims/pharmacy` | None | Pharmacy inventory |

---

## Appendix DD: HIMS Error Messages Reference

### DD.1 Validation Error Messages

| Field | Error | Message |
|-------|-------|---------|
| Name | Empty | "Name is required" |
| Name | Too short | "Name must be at least 2 characters" |
| Age | Empty | "Age is required" |
| Age | Invalid | "Please enter a valid age (0-120)" |
| Phone | Empty | "Phone number is required" |
| Phone | Invalid format | "Please enter a valid 10-digit Indian mobile number" |
| Phone | Duplicate | "A patient with this phone already exists: {name} ({mrn})" |
| Email | Invalid format | "Please enter a valid email address" |
| Chief Complaint | Empty | "Chief complaint is required" |
| Chief Complaint | Too short | "Chief complaint must be at least 2 characters" |
| Medicine Name | Empty | "Medicine name is required" |
| Dosage | Empty | "Dosage is required" |
| Quantity | Zero | "Quantity must be greater than 0" |
| Quantity | Insufficient | "Insufficient stock. Available: {quantity} {unit}" |
| Discount | Negative | "Discount cannot be negative" |
| Amount | Invalid | "Please enter a valid amount" |

### DD.2 Success Messages

| Action | Message |
|--------|---------|
| Patient registered | "Patient registered successfully" |
| Patient updated | "Patient updated successfully" |
| Visit created | "Visit created successfully" |
| Visit status updated | "Visit status updated to {status}" |
| Invoice created | "Invoice created successfully" |
| Medicine added | "Medicine added successfully" |
| Medicine dispensed | "Medicine dispensed successfully" |

### DD.3 Warning Messages

| Situation | Message |
|-----------|---------|
| Duplicate phone | "A patient with this phone already exists" |
| Low stock | "Low stock alert: {medicine} has only {quantity} {unit} remaining" |
| Expiring soon | "{medicine} expires on {date}" |
| Unsaved changes | "You have unsaved changes. Are you sure you want to leave?" |
| Large discount | "Discount of {amount} seems high. Please confirm." |

### DD.4 Error Messages

| Situation | Message |
|-----------|---------|
| localStorage full | "Storage quota exceeded. Please contact support." |
| Invalid status transition | "Cannot change status from {from} to {to}" |
| Patient not found | "Patient not found" |
| Visit not found | "Visit not found" |
| Medicine not found | "Medicine not found" |
| Insufficient stock | "Insufficient stock for {medicine}" |
| Invalid invoice | "Invoice total must be greater than 0" |
| Network error | "Connection error. Please check your network." |

---

## Appendix EE: HIMS Accessibility Checklist

### EE.1 Keyboard Navigation

- [ ] All interactive elements reachable via Tab key
- [ ] Tab order follows logical reading order
- [ ] Focus visible on all focusable elements
- [ ] Modal traps focus when open
- [ ] Escape key closes modals
- [ ] Enter key submits forms
- [ ] Arrow keys navigate within lists

### EE.2 Screen Reader Support

- [ ] All images have alt text
- [ ] Form fields have associated labels
- [ ] Error messages announced via aria-live
- [ ] Status badges have descriptive text
- [ ] Dynamic content updates announced
- [ ] Page titles descriptive and unique

### EE.3 Color & Contrast

- [ ] Text meets 4.5:1 contrast ratio (normal text)
- [ ] Text meets 3:1 contrast ratio (large text)
- [ ] Interactive elements meet 3:1 contrast ratio
- [ ] Color is not the only way to convey information
- [ ] Status indicated by both color and text/icon

### EE.4 Touch Targets

- [ ] All buttons minimum 44px × 44px
- [ ] All links minimum 44px × 44px
- [ ] All form inputs minimum 44px height
- [ ] Adequate spacing between touch targets (8px minimum)

### EE.5 Form Accessibility

- [ ] Required fields marked with asterisk
- [ ] Error messages specific and helpful
- [ ] Inline validation after user interaction
- [ ] Form can be completed via keyboard
- [ ] Error summary provided on form submission

---

## Appendix FF: HIMS Security Checklist

### FF.1 Data Protection

- [ ] No sensitive data in URLs
- [ ] No sensitive data in console.log
- [ ] No sensitive data in localStorage (use Supabase for sensitive data)
- [ ] Patient data encrypted in transit (HTTPS)
- [ ] Patient data encrypted at rest (Supabase)

### FF.2 Authentication

- [ ] OAuth authentication (Google)
- [ ] Session timeout after inactivity
- [ ] No hardcoded credentials
- [ ] API keys not in client code

### FF.3 Authorization

- [ ] Role-based access control (future)
- [ ] Clinic data isolation (future)
- [ ] Audit logging (future)

### FF.4 Input Validation

- [ ] All user inputs validated
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (React escaping)
- [ ] CSRF protection (Supabase RLS)

### FF.5 Storage Security

- [ ] localStorage keys prefixed with `hims_`
- [ ] No sensitive data in localStorage
- [ ] Backup data encrypted
- [ ] Data deletion verified

---

## Appendix GG: HIMS Deployment Checklist

### GG.1 Pre-Deployment

- [ ] TypeScript compilation successful (`npx tsc --noEmit`)
- [ ] Build successful (`npx vite build`)
- [ ] Bundle size acceptable (< 300KB gzipped)
- [ ] No console errors in development
- [ ] All forms working correctly
- [ ] All modals opening/closing correctly
- [ ] Dark mode working
- [ ] Mobile responsive
- [ ] All status transitions working
- [ ] Invoice calculations correct
- [ ] Stock dispensing working
- [ ] localStorage persistence working

### GG.2 Environment Variables

- [ ] `VITE_SUPABASE_URL` set
- [ ] `VITE_SUPABASE_ANON_KEY` set
- [ ] `GOOGLE_OAUTH_CLIENT_ID` set
- [ ] `GOOGLE_OAUTH_CLIENT_SECRET` set
- [ ] `NVIDIA_API_KEY` set

### GG.3 Post-Deployment

- [ ] Site loads correctly
- [ ] Login works
- [ ] Selection page works
- [ ] HIMS dashboard loads
- [ ] Patient registration works
- [ ] OPD visit creation works
- [ ] Invoice creation works
- [ ] Pharmacy dispensing works
- [ ] Data persists after refresh
- [ ] Mobile layout works
- [ ] Dark mode works

### GG.4 Rollback Plan

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Verify site works
5. Fix issue in code
6. Push and deploy again

---

## Appendix HH: HIMS Performance Benchmarks

### HH.1 Target Response Times

| Operation | Target | Maximum |
|-----------|--------|---------|
| Page load | < 1s | < 2s |
| Search results | < 100ms | < 300ms |
| Form submission | < 200ms | < 500ms |
| Status update | < 100ms | < 200ms |
| Invoice creation | < 300ms | < 1s |
| Stock dispensing | < 200ms | < 500ms |
| Modal open/close | < 100ms | < 200ms |
| Navigation | < 200ms | < 500ms |

### HH.2 Bundle Size Budget

| Module | Target | Maximum |
|--------|--------|---------|
| React + React DOM | 40KB | 50KB |
| React Router | 10KB | 15KB |
| Tailwind CSS | 10KB | 15KB |
| HIMS module | 50KB | 75KB |
| AyurGPT module | 80KB | 100KB |
| Shared components | 20KB | 30KB |
| **Total** | **210KB** | **285KB** |

### HH.3 localStorage Usage

| Key | Max Records | Avg Record Size | Max Total |
|-----|-------------|-----------------|-----------|
| hims_patients | 10,000 | 500 bytes | 5MB |
| hims_visits | 50,000 | 400 bytes | 20MB |
| hims_invoices | 50,000 | 300 bytes | 15MB |
| hims_medicines | 1,000 | 300 bytes | 300KB |
| hims_dispensing | 100,000 | 200 bytes | 20MB |

**Total Maximum**: ~60MB (exceeds 5MB localStorage limit)

**Mitigation**: Migrate to Supabase when total approaches 4MB.

### HH.4 Memory Usage

| Component | Target | Maximum |
|-----------|--------|---------|
| Patient list (1000 items) | < 5MB | < 10MB |
| Visit list (5000 items) | < 10MB | < 20MB |
| Invoice list (5000 items) | < 5MB | < 10MB |
| Medicine list (500 items) | < 2MB | < 5MB |
| **Total** | **< 22MB** | **< 45MB** |

---

## Appendix II: HIMS Code Review Checklist

### II.1 Data Integrity

- [ ] All IDs use correct prefix format
- [ ] No sequential numeric IDs
- [ ] MRN generation follows format
- [ ] Invoice numbers follow format
- [ ] Required fields validated
- [ ] Optional fields have defaults
- [ ] No negative stock possible
- [ ] Invoice totals calculated correctly
- [ ] Status transitions valid
- [ ] No orphaned records created

### II.2 UI/UX

- [ ] Touch targets ≥ 44px
- [ ] Loading states shown
- [ ] Empty states shown
- [ ] Error messages clear
- [ ] Dark mode working
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Screen reader friendly

### II.3 State Management

- [ ] All context methods use useCallback
- [ ] Derived state uses useMemo
- [ ] localStorage keys prefixed correctly
- [ ] No direct state mutation
- [ ] Modal state resets on close
- [ ] Form state resets on submit

### II.4 Security

- [ ] No secrets in client code
- [ ] No sensitive data in logs
- [ ] Input validation present
- [ ] No XSS vulnerabilities
- [ ] No data leakage

### II.5 Performance

- [ ] No unnecessary re-renders
- [ ] Lists memoized if large
- [ ] Search debounced
- [ ] Images optimized (if any)
- [ ] Bundle size acceptable

### II.6 Code Quality

- [ ] TypeScript types correct
- [ ] No `any` types (unless necessary)
- [ ] Imports ordered correctly
- [ ] Component structure follows pattern
- [ ] Error handling present
- [ ] Comments explain why, not what

---

## Appendix JJ: HIMS Troubleshooting Quick Reference

### JJ.1 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Blank screen | JavaScript error | Check console, clear localStorage |
| Data not saving | Context not wrapping component | Ensure provider wraps component |
| Modal not closing | onClose not passed | Check modal props |
| Dark mode broken | Missing dark: classes | Add dark mode variants |
| Mobile layout broken | Missing responsive classes | Check viewport, add md: prefixes |
| Search not working | Query too short | Minimum 2 characters |
| Invoice total wrong | Floating-point error | Use Math.round |
| Stock negative | No validation | Check stock before dispensing |
| Status not changing | Invalid transition | Check VALID_STATUS_TRANSITIONS |
| localStorage full | Too much data | Migrate to Supabase |

### JJ.2 Debug Commands

```javascript
// Check localStorage
console.log('Patients:', JSON.parse(localStorage.getItem('hims_patients') || '[]').length);
console.log('Visits:', JSON.parse(localStorage.getItem('hims_visits') || '[]').length);
console.log('Invoices:', JSON.parse(localStorage.getItem('hims_invoices') || '[]').length);
console.log('Medicines:', JSON.parse(localStorage.getItem('hims_medicines') || '[]').length);

// Check localStorage size
let total = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    total += localStorage[key].length * 2;
  }
}
console.log('localStorage size:', total, 'bytes');

// Clear all HIMS data
['hims_patients', 'hims_visits', 'hims_invoices', 'hims_medicines', 'hims_dispensing']
  .forEach(key => localStorage.removeItem(key));
```

### JJ.3 Browser DevTools Tips

1. **Console**: Check for JavaScript errors
2. **Application → Local Storage**: View/modify stored data
3. **Application → Session Storage**: Check session data
4. **Network**: Check for failed requests
5. **Performance**: Profile slow operations
6. **React DevTools**: Inspect component tree, state, props

---

## Appendix KK: HIMS Future Roadmap

### KK.1 Phase 1 (Current) — MVP Enhancement

- [x] Edit Patient
- [x] Historical OPD View
- [x] Invoice from OPD
- [x] Dispense Medicine UI
- [x] Pharmacy → OPD Link
- [ ] Vitals Recording
- [ ] Print Prescriptions

### KK.2 Phase 2 — Core Features

- [ ] GST Billing
- [ ] Partial Payments
- [ ] Patient Timeline
- [ ] Expiry Alerts
- [ ] Appointment Scheduling
- [ ] Doctor Schedules

### KK.3 Phase 3 — Advanced Features

- [ ] IPD Module (Bed Management)
- [ ] Laboratory Module
- [ ] Insurance/TPA Billing
- [ ] Multi-branch Support
- [ ] Advanced Reporting

### KK.4 Phase 4 — Enterprise Features

- [ ] ABHA Integration
- [ ] FHIR Interoperability
- [ ] AI Clinical Decision Support
- [ ] Telemedicine
- [ ] NABH Compliance
- [ ] Mobile App (Patient-facing)

---

## Appendix LL: HIMS Glossary

| Term | Definition | Context |
|------|-----------|---------|
| ABHA | Ayushman Bharat Health Account | India's health ID system |
| ADT | Admission, Discharge, Transfer | Hospital operations |
| Agni | Digestive fire | Ayurveda |
| Ama | Metabolic toxins | Ayurveda |
| Anupana | Vehicle taken with medicine | Ayurveda prescription |
| Asava | Self-generated alcohol medicine | Ayurveda pharmacy |
| Arishta | Decoction-based alcohol medicine | Ayurveda pharmacy |
| Basti | Enema therapy | Panchakarma |
| Bhasma | Calcined preparation | Ayurveda pharmacy |
| BMI | Body Mass Index | Vitals |
| CGHS | Central Government Health Scheme | Indian insurance |
| Churna | Powdered medicine | Ayurveda pharmacy |
| Deepana | Digestive stimulant | Ayurveda treatment |
| Dosha | Bio-energetic force (V/P/K) | Ayurveda |
| EHR | Electronic Health Record | Health IT |
| EMR | Electronic Medical Record | Health IT |
| FEFO | First Expiry, First Out | Pharmacy |
| FIFO | First In, First Out | Inventory |
| FHIR | Fast Healthcare Interoperability Resources | Health IT |
| Ghrita | Medicated ghee | Ayurveda pharmacy |
| GST | Goods and Services Tax | Indian taxation |
| HIMS | Hospital Information Management System | Our system |
| HSN | Harmonized System of Nomenclature | GST |
| ICD | International Classification of Diseases | Medical coding |
| IPD | Inpatient Department | Hospital |
| Kapha | Water + Earth dosha | Ayurveda |
| Koshta | Bowel habit | Ayurveda |
| Kwath | Decoction | Ayurveda pharmacy |
| Lehya | Semisolid preparation | Ayurveda pharmacy |
| Matra | Dose quantity | Ayurveda |
| MRN | Medical Record Number | Patient ID |
| NABH | National Accreditation Board for Hospitals | Indian accreditation |
| Nasya | Nasal administration therapy | Panchakarma |
| OPD | Outpatient Department | Hospital |
| Pathya | Wholesome diet/lifestyle | Ayurveda |
| Panchakarma | Five purification therapies | Ayurveda treatment |
| Pitta | Fire + Water dosha | Ayurveda |
| Prakriti | Constitutional type | Ayurveda |
| Rasayana | Rejuvenation therapy | Ayurveda |
| RLS | Row Level Security | Database security |
| Roga Pariksha | Disease examination | Ayurveda |
| Rogi Pariksha | Patient examination | Ayurveda |
| SAC | Services Accounting Code | GST |
| Shodhana | Purification therapy | Ayurveda |
| Shamana | Palliative therapy | Ayurveda |
| Sneana | Oleation therapy | Panchakarma |
| Swedana | Sudation therapy | Panchakarma |
| Taila | Medicated oil | Ayurveda pharmacy |
| TPA | Third Party Administrator | Insurance |
| UHID | Unique Health Identification | Patient ID |
| Vati | Tablet/pill form | Ayurveda pharmacy |
| Vata | Air + Space dosha | Ayurveda |
| Vikriti | Current dosha imbalance | Ayurveda |
| Vyayama | Exercise | Ayurveda |

---

---

## Appendix MM: HIMS Complete Workflow Diagrams

### MM.1 Patient Registration Workflow

```
┌─────────────┐
│   Start     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Register" button                              │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  RegisterPatientModal opens                                  │
│  - Form fields: Name, Age, Gender, Phone (required)         │
│  - Optional: Email, Address, Blood Group, Emergency Contact  │
│  - Optional: Prakriti, Vikriti (Ayurveda)                   │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User fills form and clicks "Register Patient"              │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System validates inputs                                     │
│  - Name: min 2 characters                                   │
│  - Age: 0-120                                               │
│  - Phone: 10 digits, starts with 6-9                        │
│  - Email: valid format (if provided)                         │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├──── Validation fails ──── Show error message ──── Stop
       │
       ▼ Validation passes
┌─────────────────────────────────────────────────────────────┐
│  System checks for duplicate phone number                    │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├──── Duplicate found ──── Show warning ──── Stop
       │
       ▼ No duplicate
┌─────────────────────────────────────────────────────────────┐
│  System generates unique IDs                                │
│  - ID: hpat_{timestamp}_{random6}                           │
│  - MRN: MRN-{YYYYMMDD}-{sequence}                           │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System saves patient to localStorage                        │
│  Key: hims_patients                                          │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Modal closes                                                │
│  Patient appears at top of patient list                      │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│    End      │
└─────────────┘
```

### MM.2 OPD Visit Workflow

```
┌─────────────┐
│   Start     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Receptionist opens OPD page                                 │
│  Sees today's queue (or All Time view)                       │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User clicks "+ New Visit"                                   │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  CreateVisitModal opens                                      │
│  - Select patient (search by name/MRN/phone)                │
│  - Select doctor (dropdown)                                  │
│  - Enter chief complaint (required)                          │
│  - Enter diagnosis (optional)                                │
│  - Add prescription items (optional)                         │
│  - Set consultation fee (default ₹500)                       │
│  - Add clinical notes (optional)                             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Create Visit"                                  │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System validates inputs                                     │
│  - Patient: required                                         │
│  - Doctor: required                                          │
│  - Chief Complaint: required, min 2 chars                    │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├──── Validation fails ──── Show error ──── Stop
       │
       ▼ Validation passes
┌─────────────────────────────────────────────────────────────┐
│  System creates visit                                        │
│  - ID: vst_{timestamp}_{random6}                             │
│  - visitDate: current ISO timestamp                          │
│  - status: 'waiting'                                         │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Visit appears in OPD queue                                  │
│  Status badge: "waiting" (amber)                             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Doctor calls patient                                        │
│  User clicks "Start Visit"                                   │
│  Status changes: waiting → in-progress                       │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Doctor examines patient                                     │
│  Updates: diagnosis, prescription, notes                     │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Doctor completes consultation                               │
│  User clicks "Complete Visit"                                │
│  Status changes: in-progress → completed                     │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Visit marked as completed                                   │
│  "Bill This Visit" button appears (if not billed)            │
│  "Dispense" button appears (if has prescription)             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│    End      │
└─────────────┘
```

### MM.3 Billing Workflow

```
┌─────────────┐
│   Start     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Visit completed → "Bill This Visit" button visible          │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Bill This Visit"                               │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  QuickInvoiceModal opens with pre-filled data                │
│  - Patient name (from visit)                                 │
│  - Visit ID (linked)                                         │
│  - Consultation fee (from visit)                             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User reviews and adds additional items                      │
│  - Medicine charges                                          │
│  - Procedure charges                                         │
│  - Investigation charges                                     │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User applies discount (if any)                              │
│  - Fixed amount: ₹100 off                                   │
│  - Percentage: 10% off                                       │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System calculates total                                     │
│  - Subtotal = sum of all item totals                         │
│  - Discount = fixed amount or percentage of subtotal         │
│  - Total = Subtotal - Discount                               │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User selects payment method                                 │
│  - Cash                                                      │
│  - Card                                                      │
│  - UPI                                                       │
│  - Insurance                                                 │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User enters amount paid                                     │
│  - Full amount → status = 'paid'                             │
│  - Partial amount → status = 'partial'                       │
│  - Zero → status = 'pending'                                 │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Create Invoice"                                │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System generates invoice number                             │
│  Format: INV-{YYYYMMDD}-{sequence}                           │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System saves invoice to localStorage                        │
│  Key: hims_invoices                                          │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Modal closes                                                │
│  Invoice appears in billing list                             │
│  "Billed" badge appears on visit in OPD                      │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│    End      │
└─────────────┘
```

### MM.4 Pharmacy Dispensing Workflow

```
┌─────────────┐
│   Start     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Visit completed with prescription                           │
│  "Dispense" button appears on visit card                     │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Dispense"                                      │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  DispenseMedicineModal opens                                 │
│  - Shows patient name and visit details                      │
│  - Shows prescribed medicines list                           │
│  - Search box for pharmacy inventory                         │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User searches for medicine                                  │
│  System shows matching medicines with:                       │
│  - Name                                                      │
│  - Category                                                  │
│  - Price                                                     │
│  - Current stock                                             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User selects medicine and enters quantity                   │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System validates                                            │
│  - Quantity > 0                                              │
│  - Stock >= quantity                                         │
└──────┬──────────────────────────────────────────────────────┘
       │
       ├──── Validation fails ──── Show error ──── Stop
       │
       ▼ Validation passes
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Dispense"                                      │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System creates dispensing record                            │
│  - ID: disp_{timestamp}_{random6}                            │
│  - Links to patient, visit, medicine                         │
│  - Records quantity, who dispensed, timestamp                │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System decrements medicine stock                            │
│  new_quantity = old_quantity - quantity_dispensed             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Success message shown                                       │
│  Dispensed item appears in "Dispensed This Session" list     │
│  User can dispense more medicines or close modal             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│    End      │
└─────────────┘
```

### MM.5 Patient Search Workflow

```
┌─────────────┐
│   Start     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User types in search box                                    │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System waits 300ms (debounce)                               │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System normalizes query                                     │
│  - Convert to lowercase                                      │
│  - Trim whitespace                                           │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System searches patients                                    │
│  - Name: partial match (includes)                            │
│  - MRN: partial match (includes)                             │
│  - Phone: exact match (includes)                             │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  System returns matching patients                            │
│  Sorted by relevance (name match > MRN match > phone match)  │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  Results displayed in dropdown                               │
│  - Max 5 results shown                                       │
│  - Each shows: Name, MRN, Age, Gender, Phone                 │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  User clicks a result                                        │
│  - Patient selected                                          │
│  - Search box cleared                                        │
│  - Dropdown closed                                           │
└──────┬──────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│    End      │
└─────────────┘
```

---

## Appendix NN: HIMS Component Props Reference

### NN.1 Modal Components

```typescript
// RegisterPatientModal
interface RegisterPatientModalProps {
  onClose: () => void;
}

// EditPatientModal
interface EditPatientModalProps {
  patient: HimsPatient;
  onClose: () => void;
}

// CreateVisitModal
interface CreateVisitModalProps {
  onClose: () => void;
}

// QuickInvoiceModal
interface QuickInvoiceModalProps {
  visit: OpdVisit;
  onClose: () => void;
}

// CreateInvoiceModal
interface CreateInvoiceModalProps {
  patientId?: string;
  patientName?: string;
  visitId?: string;
  onClose: () => void;
}

// AddMedicineModal
interface AddMedicineModalProps {
  onClose: () => void;
}

// DispenseMedicineModal
interface DispenseMedicineModalProps {
  visit: OpdVisit;
  onClose: () => void;
}
```

### NN.2 Layout Components

```typescript
// HimsLayout
interface HimsLayoutProps {
  // No props - uses Outlet from react-router
}

// HimsHeader
interface HimsHeaderProps {
  onToggleSidebar: () => void;
}

// HimsSidebar
interface HimsSidebarProps {
  isOpen: boolean;
}

// HimsBottomTabs
interface HimsBottomTabsProps {
  // No props - uses useLocation for active state
}

// HimsStatsCard
interface HimsStatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'green' | 'amber' | 'gray';
  onClick?: () => void;
}
```

### NN.3 Page Components

```typescript
// All page components have no props
// They use hooks to access context and router

// HimsDashboard
// - useHimsPatients()
// - useOpd()
// - useBilling()
// - usePharmacy()

// HimsPatients
// - useHimsPatients()
// - useNavigate()

// HimsPatientDetail
// - useParams() → id
// - useNavigate()
// - useHimsPatients()
// - useOpd()
// - useBilling()

// HimsOPD
// - useOpd()
// - useBilling()
// - usePharmacy()

// HimsBilling
// - useBilling()

// HimsPharmacy
// - usePharmacy()
```

---

## Appendix OO: HIMS Context API Reference

### OO.1 HimsPatientContext

```typescript
interface HimsPatientContextType {
  // State
  patients: HimsPatient[];
  
  // Actions
  addPatient: (data: Omit<HimsPatient, 'id' | 'mrn' | 'createdAt'>) => HimsPatient;
  updatePatient: (id: string, updates: Partial<HimsPatient>) => void;
  deletePatient: (id: string) => boolean;
  
  // Selectors
  getPatient: (id: string) => HimsPatient | undefined;
  searchPatients: (query: string) => HimsPatient[];
  getPatientByMrn: (mrn: string) => HimsPatient | undefined;
  getPatientByPhone: (phone: string) => HimsPatient | undefined;
}
```

### OO.2 OpdContext

```typescript
interface OpdContextType {
  // State
  visits: OpdVisit[];
  
  // Actions
  addVisit: (data: Omit<OpdVisit, 'id' | 'visitDate'>) => void;
  updateVisitStatus: (id: string, status: OpdVisit['status']) => void;
  updateVisit: (id: string, updates: Partial<OpdVisit>) => void;
  
  // Selectors
  getVisit: (id: string) => OpdVisit | undefined;
  getVisitsByPatient: (patientId: string) => OpdVisit[];
  getTodayVisits: () => OpdVisit[];
  getVisitsByDate: (date: string) => OpdVisit[];
  getVisitsByDoctor: (doctorName: string) => OpdVisit[];
}
```

### OO.3 BillingContext

```typescript
interface BillingContextType {
  // State
  invoices: Invoice[];
  
  // Actions
  addInvoice: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  
  // Selectors
  getInvoice: (id: string) => Invoice | undefined;
  getInvoicesByPatient: (patientId: string) => Invoice[];
  getInvoicesByDate: (date: string) => Invoice[];
  getTodayRevenue: () => number;
  getMonthRevenue: () => number;
  getPendingAmount: () => number;
}
```

### OO.4 PharmacyContext

```typescript
interface PharmacyContextType {
  // State
  medicines: Medicine[];
  lowStockMedicines: Medicine[];
  dispensingRecords: DispensingRecord[];
  
  // Actions
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt'>) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  dispenseMedicine: (
    medicineId: string,
    quantity: number,
    patientId: string,
    patientName: string,
    visitId: string,
    dispensedBy: string
  ) => DispensingRecord | null;
  
  // Selectors
  getMedicine: (id: string) => Medicine | undefined;
  searchMedicines: (query: string) => Medicine[];
  getDispensingByVisit: (visitId: string) => DispensingRecord[];
}
```

---

## Appendix PP: HIMS Type Definitions Reference

### PP.1 HimsPatient

```typescript
interface HimsPatient {
  id: string;                    // hpat_{timestamp}_{random6}
  mrn: string;                   // MRN-{YYYYMMDD}-{sequence}
  name: string;                  // Full name
  age: number;                   // Age in years (0-120)
  gender: 'Male' | 'Female' | 'Other';
  phone: string;                 // 10-digit Indian mobile (6-9 prefix)
  email?: string;                // Optional email
  address?: string;              // Optional address
  bloodGroup?: string;           // Optional: A+, B+, O+, AB+, etc.
  prakriti?: string;             // Optional: Ayurvedic constitution
  vikriti?: string;              // Optional: Current dosha imbalance
  allergies?: string;            // Optional: Known allergies
  emergencyContact?: string;     // Optional: Emergency contact info
  createdAt: string;             // ISO 8601 timestamp
}
```

### PP.2 OpdVisit

```typescript
interface OpdVisit {
  id: string;                    // vst_{timestamp}_{random6}
  patientId: string;             // FK → HimsPatient.id
  patientName: string;           // Denormalized for display
  doctorName: string;            // From DOCTORS constant
  visitDate: string;             // ISO 8601 timestamp
  chiefComplaint: string;        // Free text (min 2 chars)
  diagnosis: string;             // Free text (can be empty initially)
  prescription: PrescriptionItem[];
  notes?: string;                // Optional clinical notes
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  consultationFee: number;       // In INR (default 500)
}
```

### PP.3 PrescriptionItem

```typescript
interface PrescriptionItem {
  medicine: string;              // Medicine name (free text)
  dosage: string;                // e.g., "500mg", "10ml"
  frequency: string;             // e.g., "Twice daily", "After meals"
  duration: string;              // e.g., "7 days", "2 weeks"
  instructions?: string;         // Optional: "Take with warm water"
}
```

### PP.4 Invoice

```typescript
interface Invoice {
  id: string;                    // inv_{timestamp}_{random6}
  invoiceNumber: string;         // INV-{YYYYMMDD}-{sequence}
  patientId: string;             // FK → HimsPatient.id
  patientName: string;           // Denormalized
  visitId?: string;              // FK → OpdVisit.id (optional)
  items: InvoiceItem[];
  subtotal: number;              // Sum of item totals
  discount: number;              // Fixed amount or percentage
  total: number;                 // subtotal - discount
  paymentMethod: 'cash' | 'card' | 'upi' | 'insurance';
  paymentStatus: 'paid' | 'pending' | 'partial';
  paidAmount: number;            // Amount already paid
  createdAt: string;             // ISO 8601 timestamp
}
```

### PP.5 InvoiceItem

```typescript
interface InvoiceItem {
  description: string;           // Service/medicine description
  quantity: number;              // Must be > 0
  unitPrice: number;             // In INR
  total: number;                 // quantity × unitPrice
}
```

### PP.6 Medicine

```typescript
interface Medicine {
  id: string;                    // med_{timestamp}_{random6}
  name: string;                  // Medicine name
  category: 'Ayurvedic' | 'Allopathic' | 'Siddha';
  manufacturer?: string;         // Optional manufacturer
  batchNumber?: string;          // Optional batch number
  expiryDate?: string;           // Optional: YYYY-MM-DD
  quantity: number;              // Current stock (must be >= 0)
  unit: string;                  // 'tablets' | 'bottles' | 'grams' | 'ml' | 'packets'
  price: number;                 // Selling price in INR
  costPrice?: number;            // Optional purchase cost
  reorderLevel: number;          // Alert when stock <= this
  createdAt: string;             // ISO 8601 timestamp
}
```

### PP.7 DispensingRecord

```typescript
interface DispensingRecord {
  id: string;                    // disp_{timestamp}_{random6}
  patientId: string;             // FK → HimsPatient.id
  patientName: string;           // Denormalized
  visitId: string;               // FK → OpdVisit.id
  medicineId: string;            // FK → Medicine.id
  medicineName: string;          // Denormalized
  quantityDispensed: number;     // Must be > 0
  unit: string;                  // From medicine
  dispensedBy: string;           // Doctor name
  dispensedAt: string;           // ISO 8601 timestamp
}
```

### PP.8 Constants

```typescript
const DOCTORS = [
  'Dr. Rajesh Sharma',
  'Dr. Priya Verma',
  'Dr. Amit Patel',
  'Dr. Sunita Gupta',
];

const MEDICINE_CATEGORIES = ['Ayurvedic', 'Allopathic', 'Siddha'] as const;

const MEDICINE_UNITS = ['tablets', 'bottles', 'grams', 'ml', 'packets'] as const;

const OPD_STATUS = ['waiting', 'in-progress', 'completed', 'cancelled'] as const;

const PAYMENT_METHODS = ['cash', 'card', 'upi', 'insurance'] as const;

const PAYMENT_STATUSES = ['paid', 'pending', 'partial'] as const;
```

---

## Appendix QQ: HIMS localStorage Schema

### QQ.1 Schema Definition

```typescript
// localStorage key-value pairs
interface HimsStorageSchema {
  // Patient data
  'hims_patients': HimsPatient[];
  
  // OPD visit data
  'hims_visits': OpdVisit[];
  
  // Invoice data
  'hims_invoices': Invoice[];
  
  // Medicine inventory
  'hims_medicines': Medicine[];
  
  // Dispensing history
  'hims_dispensing': DispensingRecord[];
}
```

### QQ.2 Data Format Examples

```json
// hims_patients
[
  {
    "id": "hpat_1719876543_a3f2k1",
    "mrn": "MRN-20260702-001",
    "name": "Ramesh Kumar",
    "age": 45,
    "gender": "Male",
    "phone": "9876543210",
    "email": "ramesh@example.com",
    "address": "123 Main St, Mumbai",
    "bloodGroup": "B+",
    "prakriti": "Vata",
    "vikriti": "Vata-Pitta",
    "allergies": "Penicillin",
    "emergencyContact": "Suresh Kumar - 9123456780",
    "createdAt": "2026-07-02T10:30:00.000Z"
  }
]

// hims_visits
[
  {
    "id": "vst_1719876543_b7c4d2",
    "patientId": "hpat_1719876543_a3f2k1",
    "patientName": "Ramesh Kumar",
    "doctorName": "Dr. Rajesh Sharma",
    "visitDate": "2026-07-02T10:30:00.000Z",
    "chiefComplaint": "Joint pain for 2 months",
    "diagnosis": "Amavata (Rheumatoid Arthritis)",
    "prescription": [
      {
        "medicine": "Ashwagandha Churna",
        "dosage": "500mg",
        "frequency": "Twice daily",
        "duration": "2 months",
        "instructions": "Take with warm milk"
      }
    ],
    "notes": "Vata-Kapha imbalance",
    "status": "completed",
    "consultationFee": 500
  }
]

// hims_invoices
[
  {
    "id": "inv_1719876543_e9f0g3",
    "invoiceNumber": "INV-20260702-001",
    "patientId": "hpat_1719876543_a3f2k1",
    "patientName": "Ramesh Kumar",
    "visitId": "vst_1719876543_b7c4d2",
    "items": [
      {
        "description": "Consultation Fee",
        "quantity": 1,
        "unitPrice": 500,
        "total": 500
      }
    ],
    "subtotal": 500,
    "discount": 0,
    "total": 500,
    "paymentMethod": "cash",
    "paymentStatus": "paid",
    "paidAmount": 500,
    "createdAt": "2026-07-02T11:00:00.000Z"
  }
]

// hims_medicines
[
  {
    "id": "med_1719876543_h1i2j3",
    "name": "Ashwagandha Churna",
    "category": "Ayurvedic",
    "manufacturer": "Himalaya",
    "quantity": 50,
    "unit": "bottles",
    "price": 120,
    "costPrice": 80,
    "reorderLevel": 20,
    "createdAt": "2026-07-01T09:00:00.000Z"
  }
]

// hims_dispensing
[
  {
    "id": "disp_1719876543_k4l5m6",
    "patientId": "hpat_1719876543_a3f2k1",
    "patientName": "Ramesh Kumar",
    "visitId": "vst_1719876543_b7c4d2",
    "medicineId": "med_1719876543_h1i2j3",
    "medicineName": "Ashwagandha Churna",
    "quantityDispensed": 2,
    "unit": "bottles",
    "dispensedBy": "Dr. Rajesh Sharma",
    "dispensedAt": "2026-07-02T11:30:00.000Z"
  }
]
```

### QQ.3 Migration Notes

When migrating from localStorage to Supabase:

1. **Schema Mapping**: localStorage keys → Supabase tables
   - `hims_patients` → `hims_patients` table
   - `hims_visits` → `hims_visits` table
   - `hims_invoices` → `hims_invoices` table
   - `hims_medicines` → `hims_medicines` table
   - `hims_dispensing` → `hims_dispensing` table

2. **Field Mapping**: camelCase → snake_case
   - `patientId` → `patient_id`
   - `visitDate` → `visit_date`
   - `createdAt` → `created_at`

3. **ID Preservation**: Keep existing IDs during migration

4. **Data Validation**: Validate all records before migration

5. **Backup**: Create backup before migration

---

## Appendix RR: HIMS Constants Reference

### RR.1 DOCTORS

```typescript
const DOCTORS = [
  'Dr. Rajesh Sharma',
  'Dr. Priya Verma',
  'Dr. Amit Patel',
  'Dr. Sunita Gupta',
];
```

**Usage**: Doctor selection dropdown in visit creation, display in visit cards.

### RR.2 MEDICINE_CATEGORIES

```typescript
const MEDICINE_CATEGORIES = ['Ayurvedic', 'Allopathic', 'Siddha'] as const;
```

**Usage**: Category filter in pharmacy, category selection in medicine form.

### RR.3 MEDICINE_UNITS

```typescript
const MEDICINE_UNITS = ['tablets', 'bottles', 'grams', 'ml', 'packets'] as const;
```

**Usage**: Unit selection in medicine form, display in stock information.

### RR.4 OPD_STATUS

```typescript
const OPD_STATUS = ['waiting', 'in-progress', 'completed', 'cancelled'] as const;
```

**Usage**: Status badges, status filters, status transitions.

### RR.5 PAYMENT_METHODS

```typescript
const PAYMENT_METHODS = ['cash', 'card', 'upi', 'insurance'] as const;
```

**Usage**: Payment method selection in invoice form.

### RR.6 PAYMENT_STATUSES

```typescript
const PAYMENT_STATUSES = ['paid', 'pending', 'partial'] as const;
```

**Usage**: Payment status badges, payment tracking.

### RR.7 BLOOD_GROUPS

```typescript
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;
```

**Usage**: Blood group selection in patient registration.

### RR.8 PRAKRITI_TYPES

```typescript
const PRAKRITI_TYPES = [
  'Vata', 'Pitta', 'Kapha',
  'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha',
  'Sama',
] as const;
```

**Usage**: Prakriti selection in patient registration and assessment.

### RR.9 FREQUENCY_OPTIONS

```typescript
const FREQUENCY_OPTIONS = [
  'Once daily',
  'Twice daily',
  'Thrice daily',
  'Four times daily',
  'Before meals',
  'After meals',
  'At bedtime',
  'As needed',
] as const;
```

**Usage**: Frequency selection in prescription builder.

### RR.10 ANUPANA_OPTIONS

```typescript
const ANUPANA_OPTIONS = [
  'Warm water',
  'Cold water',
  'Milk',
  'Ghee',
  'Honey',
  'Buttermilk',
  'Sugar candy water',
  'Salt warm water',
  'Empty stomach',
] as const;
```

**Usage**: Anupana selection in Ayurveda prescription (future).

---

## Appendix SS: HIMS UI Component Library

### SS.1 Button Component

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

// Variants
// primary: bg-emerald-600 text-white
// secondary: bg-surface-100 text-surface-700
// danger: bg-red-600 text-white
// ghost: bg-transparent text-surface-600

// Sizes
// sm: px-3 py-1.5 text-sm
// md: px-4 py-2.5 text-sm
// lg: px-6 py-3 text-base
```

### SS.2 Input Component

```typescript
interface InputProps {
  label?: string;
  type?: 'text' | 'number' | 'email' | 'tel' | 'password' | 'date';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

// Layout
// <div className="space-y-1.5">
//   <label>{label}</label>
//   <input />
//   {error && <p>{error}</p>}
// </div>
```

### SS.3 Modal Component

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-xl';
}

// Layout
// <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
//   <div className="bg-white dark:bg-surface-900 rounded-xl w-full {maxWidth} max-h-[90vh] overflow-y-auto">
//     <div className="flex items-center justify-between p-4 border-b">
//       <h2>{title}</h2>
//       <button onClick={onClose}><X /></button>
//     </div>
//     <div className="p-4">{children}</div>
//   </div>
// </div>
```

### SS.4 Select Component

```typescript
interface SelectProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}
```

### SS.5 Textarea Component

```typescript
interface TextareaProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}
```

---

## Appendix TT: HIMS Color System

### TT.1 Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Emerald 500 | #10b981 | Primary actions, links |
| Emerald 600 | #059669 | Button backgrounds |
| Emerald 700 | #047857 | Button hover states |

### TT.2 Status Colors

| Status | Background | Text | Usage |
|--------|-----------|------|-------|
| Waiting | Amber 100 | Amber 700 | Visit status badge |
| In Progress | Blue 100 | Blue 700 | Visit status badge |
| Completed | Green 100 | Green 700 | Visit status badge |
| Cancelled | Surface 100 | Surface 500 | Visit status badge |
| Paid | Green 100 | Green 700 | Payment status badge |
| Pending | Amber 100 | Amber 700 | Payment status badge |
| Partial | Blue 100 | Blue 700 | Payment status badge |

### TT.3 Surface Colors

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Page background | Surface 50 | Surface 950 |
| Card background | White | Surface 800 |
| Input background | Surface 50 | Surface 800 |
| Border | Surface 200 | Surface 700 |
| Text primary | Surface 900 | White |
| Text secondary | Surface 500 | Surface 400 |
| Text muted | Surface 400 | Surface 500 |

### TT.4 Interactive States

| State | Color |
|-------|-------|
| Hover | Surface 50 (light), Surface 700 (dark) |
| Focus ring | Emerald 500 |
| Disabled | Surface 200 (light), Surface 700 (dark) |
| Active | Emerald 100 (light), Emerald 900/30 (dark) |

---

## Appendix UU: HIMS Responsive Design Rules

### UU.1 Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| Mobile | < 768px | Single column, bottom tabs |
| Tablet | 768px - 1024px | Collapsible sidebar |
| Desktop | > 1024px | Full sidebar |

### UU.2 Mobile Rules

- Bottom navigation tabs visible
- Sidebar hidden
- Touch targets minimum 44px
- Forms stack vertically
- Cards full width
- Modals full width with padding

### UU.3 Tablet Rules

- Sidebar collapsible (icon-only or full)
- Bottom tabs hidden
- Content fills remaining space
- Cards can be 2-column grid
- Modals centered with max-width

### UU.4 Desktop Rules

- Sidebar always visible (collapsible)
- Bottom tabs hidden
- Content fills remaining space
- Cards can be 3-4 column grid
- Modals centered with max-width

### UU.5 Touch Target Sizes

| Element | Minimum Size |
|---------|-------------|
| Buttons | 44px × 44px |
| Links | 44px × 44px |
| Form inputs | 44px height |
| Checkboxes | 44px × 44px |
| Radio buttons | 44px × 44px |
| Dropdowns | 44px height |

---

## Appendix VV: HIMS Dark Mode Rules

### VV.1 Color Mapping

| Element | Light | Dark |
|---------|-------|------|
| Page bg | `bg-surface-50` | `bg-surface-950` |
| Card bg | `bg-white` | `bg-surface-800` |
| Input bg | `bg-surface-50` | `bg-surface-800` |
| Border | `border-surface-200` | `border-surface-700` |
| Text primary | `text-surface-900` | `text-white` |
| Text secondary | `text-surface-500` | `text-surface-400` |
| Hover bg | `hover:bg-surface-50` | `hover:bg-surface-700` |
| Focus ring | `focus:ring-emerald-500` | `focus:ring-emerald-400` |

### VV.2 Status Badge Colors (Dark Mode)

| Status | Dark Mode Classes |
|--------|-------------------|
| Waiting | `bg-amber-900/30 text-amber-400` |
| In Progress | `bg-blue-900/30 text-blue-400` |
| Completed | `bg-green-900/30 text-green-400` |
| Cancelled | `bg-surface-800 text-surface-400` |

### VV.3 Common Dark Mode Patterns

```tsx
// Card
<div className="bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700">

// Input
<input className="bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white" />

// Text
<p className="text-surface-900 dark:text-white">Primary text</p>
<p className="text-surface-500 dark:text-surface-400">Secondary text</p>

// Hover
<button className="hover:bg-surface-50 dark:hover:bg-surface-700">
```

---

## Appendix K: Quick-Reference Developer Cheat Sheet

### localStorage Key Inventory

| Key | Type | Prefix | Module |
|-----|------|--------|--------|
| `hims_patients` | `HimsPatient[]` | `hims_` | Patients |
| `hims_visits` | `OpdVisit[]` | `hims_` | OPD |
| `hims_invoices` | `Invoice[]` | `hims_` | Billing |
| `hims_medicines` | `Medicine[]` | `hims_` | Pharmacy |
| `hims_dispensing` | `DispensingRecord[]` | `hims_` | Pharmacy |

### MRN Generation Rule

Format: `MRN-YYYYMMDD-XXX` where XXX is a zero-padded counter.
Example: `MRN-20260702-001`, `MRN-20260702-002`

### Invoice Number Generation Rule

Format: `INV-YYYYMMDD-XXX` where XXX is a zero-padded counter.
Example: `INV-20260702-001`, `INV-20260702-002`

### Dosha Color Mapping

| Dosha | Tailwind Classes |
|-------|-----------------|
| Vata | `bg-blue-100 text-blue-800` |
| Pitta | `bg-red-100 text-red-800` |
| Kapha | `bg-green-100 text-green-800` |
| Sama | `bg-purple-100 text-purple-800` |

### Status Color Mapping

| Status | Tailwind Classes |
|--------|-----------------|
| Waiting | `bg-yellow-100 text-yellow-800` |
| In-progress | `bg-blue-100 text-blue-800` |
| Completed | `bg-green-100 text-green-800` |
| Cancelled | `bg-red-100 text-red-800` |
| Paid | `bg-green-100 text-green-800` |
| Pending | `bg-yellow-100 text-yellow-800` |
| Partial | `bg-orange-100 text-orange-800` |

### HIMS Route Map

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | SelectionPage | AyurGPT / HIMS chooser |
| `/hims/dashboard` | HimsDashboard | Stats, alerts, revenue |
| `/hims/patients` | HimsPatients | Patient list + search |
| `/hims/patients/:id` | HimsPatientDetail | Full patient profile |
| `/hims/opd` | HimsOPD | OPD queue management |
| `/hims/billing` | HimsBilling | Invoice list + revenue |
| `/hims/pharmacy` | HimsPharmacy | Medicine inventory |
| `/ayurgpt/chat` | AiAssistantPage | AI chat |
| `/ayurgpt/prakriti` | PrakritiAssessmentPage | Prakriti assessment |
| `/ayurgpt/tongue` | TongueDiagnosisPage | Tongue analysis |

### Key Types Reference

```typescript
// Patient
interface HimsPatient {
  id: string; mrn: string;
  firstName: string; lastName: string;
  age: number; gender: 'male' | 'female' | 'other';
  phone: string; email: string;
  address: string; village: string;
  emergencyContact: string; emergencyPhone: string;
  prakriti: 'vata' | 'pitta' | 'kapha' | 'vata-pitta' | 'pitta-kapha' | 'vata-kapha' | 'sama';
  vikriti: string; currentDosha: string;
  allergies: string[]; chronicConditions: string[];
  registeredAt: string; lastVisit: string;
}

// OPD Visit
interface OpdVisit {
  id: string; patientId: string; patientName: string;
  date: string; time: string; chamber: string;
  doctor: string; status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  chiefComplaint: string; diagnosis: string;
  prescription: PrescriptionItem[];
  notes: string;
  createdAt: string; startedAt?: string; completedAt?: string;
}

// Invoice
interface Invoice {
  id: string; invoiceNumber: string; patientId: string;
  patientName: string; visitId?: string; date: string;
  items: InvoiceItem[]; subtotal: number; discount: number;
  total: number; status: 'pending' | 'paid' | 'partial' | 'cancelled';
  paymentMethod: 'cash' | 'upi' | 'card' | 'insurance' | 'credit';
  notes: string; createdAt: string;
}

// Medicine
interface Medicine {
  id: string; name: string; category: 'classical' | 'proprietory' | 'herb' | 'mineral';
  manufacturer: string; batchNumber: string; expiryDate: string;
  quantity: number; unit: string; price: number; costPrice: number;
  reorderLevel: number; location: string;
  createdAt: string; updatedAt: string;
}

// Dispensing Record
interface DispensingRecord {
  id: string; patientId: string; patientName: string;
  medicineId: string; medicineName: string;
  quantity: number; unit: string; price: number;
  prescribedBy: string; visitId: string;
  dispensedAt: string; dispensedBy: string;
  batchNumber: string; expiryDate: string;
}
```

### Context Hook Signatures

```typescript
// Patients
const { patients, addPatient, updatePatient, deletePatient, getPatient } = useHimsPatients();

// OPD
const { visits, addVisit, updateVisit, getVisitsByDate, todayVisits, activeVisits } = useHimsOpd();

// Billing
const { invoices, addInvoice, updateInvoice, revenue, todayRevenue } = useHimsBilling();

// Pharmacy
const { medicines, addMedicine, updateMedicine, dispenseMedicine, lowStockAlerts, expiryAlerts } = useHimsPharmacy();
```

### Common Patterns

```typescript
// Register patient → navigate to OPD
const patient = addPatient({ firstName: 'Ram', lastName: 'Kumar', ... });
navigate('/hims/opd');

// Create visit with prescription from pharmacy
const visit = addVisit({
  patientId, patientName: `${first} ${last}`,
  chamber: 'OPD-1', doctor: 'Dr. Rajesh Sharma',
  status: 'waiting', chiefComplaint: 'Joint pain',
  prescription: [
    { medicine: 'Yogaraj Guggulu', dosage: '2 tabs', frequency: 'BD', duration: '30 days' }
  ]
});

// Invoice from visit
addInvoice({
  visitId: visit.id, patientId: visit.patientId,
  items: [{ name: 'Consultation', quantity: 1, price: 500, total: 500 }],
  total: 500, paymentMethod: 'cash', status: 'paid'
});

// Dispense medicine
const record = dispenseMedicine(medicineId, 30, patientId, patientName, visitId, 'Dr. Rajesh');
```

---

## Appendix L: Deployment Checklist

### Pre-Deployment Verification

- [ ] TypeScript builds clean (`npm run build`)
- [ ] No `console.log` in production code
- [ ] All localStorage keys use `hims_` prefix
- [ ] Environment variables set in Vercel dashboard
- [ ] Redirect URLs configured (Supabase + Google Cloud)
- [ ] Route guards prevent unauthorized access
- [ ] Error boundaries wrap page components
- [ ] Mobile bottom tabs render at `< md` breakpoint
- [ ] All modals have Escape key handler
- [ ] Forms validate required fields

### Supabase Checklist (Future)

- [ ] RLS policies enabled on all tables
- [ ] Service role key NOT in client bundle
- [ ] Anon key limited to read/write own data
- [ ] Database backups scheduled
- [ ] Connection pooling configured
- [ ] Audit logging enabled for PHI

### Monitoring Setup

- [ ] Sentry or similar error tracking
- [ ] Uptime monitoring (e.g., UptimeRobot)
- [ ] Lighthouse score > 90 (Performance)
- [ ] Core Web Vitals within thresholds
- [ ] localStorage quota monitoring (>5MB warning)
- [ ] Error rate < 0.1% of sessions
- [ ] P95 latency < 2s for page loads
- [ ] Mobile crash rate < 1%
- [ ] Daily active user tracking
- [ ] Session recording for UX insights
- [ ] Alert thresholds configured for critical errors
- [ ] Post-deployment smoke test checklist

---

*Document Version: 7.0*
*Last Updated: 2 July 2026*
*Total Lines: 10,000+*
*Author: AyurGPT Development Team*
*For internal use only — not for distribution*
