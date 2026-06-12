# 🏗️ Frontend Build Priority — Gap Analysis & Execution Plan

> **Based on:** `docs/patient-flow.md` | **Audited:** June 2026
> **Status:** Backend APIs ready ✅ | Frontend pages partial ⚠️

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Frontend Inventory: What Exists vs What's Missing](#2-frontend-inventory)
3. [Backend Readiness Check](#3-backend-readiness-check)
4. [Priority Matrix](#4-priority-matrix)
5. [Phase 1: CycleDetail — The Critical Gap](#5-phase-1-cycledetail)
6. [Phase 2: Cycle Sub-Pages](#6-phase-2-cycle-sub-pages)
7. [Phase 3: Supporting Pages](#7-phase-3-supporting-pages)
8. [Phase 4: Enhancement & Polish](#8-phase-4-enhancement--polish)
9. [Implementation Order Summary](#9-implementation-order-summary)

---

## 1. Executive Summary

**The biggest gap is `CycleDetail`** — the page at `/cycles/:id` that shows a treatment cycle in full detail. It doesn't exist yet, but both `CycleCreate` and `PatientDetail` navigate to it, so clicking those links breaks.

The backend is surprisingly well-prepared: all services, controllers, validators, and routes exist for the full patient journey. The backend for the cycle getById endpoint already includes all sub-resources (follicle tracking, OPU, embryology, ET, pregnancy, cryo) via Prisma includes.

**Build order philosophy:**
1. Fix broken navigation first (CycleDetail)
2. Follow the patient journey order from the flow document
3. Build sub-pages of CycleDetail as separate tabs/components
4. Fill remaining gaps (investigation forms, billing forms, cryo views)

---

## 2. Frontend Inventory

### 2.1 Existing Pages ✅

| Route | Page | Status | Notes |
|-------|------|--------|-------|
| `/login` | `LoginPage` | ✅ Complete | Authentication |
| `/` | `HomePage` | ✅ Complete | Role-based routing |
| `/patients` | `PatientList` | ✅ Complete | Search, filters, dynamic branch/hearUsFrom |
| `/patients/new` | `PatientCreate` | ✅ Complete | Registration with LocationInput |
| `/patients/:id` | `PatientDetail` | ✅ Complete | 7-tab detail view |
| `/cycles` | `CycleList` | ✅ Complete | Filters, search, pagination |
| `/cycles/new` | `CycleCreate` | ✅ Complete | 2-step wizard (couple → params) |
| `/appointments` | `AppointmentList` | ✅ Complete | |
| `/appointments/new` | `AppointmentCreate` | ✅ Complete | |
| `/investigations` | `InvestigationList` | ✅ Complete | List view |
| `/cryo-inventory` | `CryoDashboard` | ✅ Complete | Dashboard overview |
| `/billing` | `InvoiceList` | ✅ Complete | List view |
| `/reports` | `ReportsDashboard` | ✅ Complete | |
| `/tasks` | `TaskList` | ✅ Complete | |
| `/admin` | `AdminDashboard` | ✅ Complete | |
| `/admin/roles` | `RoleManagement` | ✅ Complete | |
| `/admin/permissions` | `PermissionManagement` | ✅ Complete | |
| `/admin/staff` | `StaffManagement` | ✅ Complete | |
| `/admin/options` | `OptionsManagement` | ✅ Complete | |

### 2.2 Missing Pages ❌

| Route | Page | Severity | Why |
|-------|------|----------|-----|
| `/cycles/:id` | **CycleDetail** | 🔴 **CRITICAL** | CycleCreate & PatientDetail link here; no route exists |
| `/investigations/new` | InvestigationCreate | 🟡 Important | No way to order new investigations |
| `/investigations/:id` | InvestigationDetail | 🟡 Important | No way to view investigation results |
| `/billing/new` | InvoiceCreate | 🟡 Important | No way to create invoices |
| `/billing/:id` | InvoiceDetail | 🟡 Important | No way to view invoice details |
| `/cycles/:id/follicles` | FollicleTracking | 🟠 Medium | Sub-page after CycleDetail built |
| `/cycles/:id/opu` | OPUForm | 🟠 Medium | Sub-page after CycleDetail built |
| `/cycles/:id/embryology` | EmbryologyLab | 🟠 Medium | Sub-page after CycleDetail built |
| `/cycles/:id/et` | ETForm | 🟠 Medium | Sub-page after CycleDetail built |
| `/cycles/:id/pregnancy` | PregnancyTracking | 🟠 Medium | Sub-page after CycleDetail built |
| `/cryo/tanks/new` | TankCreate | 🟢 Low | Tank form |
| `/cryo/embryos` | PatientCryoList | 🟢 Low | Per-patient cryo view |
| `/admin/audit-logs` | AuditLogViewer | 🟢 Low | Admin panel |

---

## 3. Backend Readiness Check

Every module in the backend has complete CRUD. No backend gaps for the frontend pages listed above.

| Module | Service Methods | Controller | Validator | Routes | Ready |
|--------|----------------|------------|-----------|--------|-------|
| **Cycle** | `getCycleById` (with all includes), `create`, `update`, `updateStatus` | ✅ | ✅ | ✅ | ✅ |
| **FollicleTracking** | `getFollicleTrackings`, `createFollicleTracking` | ✅ | ✅ | ✅ (on cycle) | ✅ |
| **OPU** | `getOPURecord`, `createOPURecord`, `updateOPURecord` | ✅ | ✅ | ✅ (on cycle) | ✅ |
| **Semen** | `getSemenData`, `createSemenData` | ✅ | ✅ | ✅ (on cycle) | ✅ |
| **Embryology** | `getEmbryologyRecords`, `createEmbryologyRecord` | ✅ | ✅ | ✅ (on cycle) | ✅ |
| **Biopsy/NGS** | `getBiopsies`, `createBiopsy`, `getNGSResults`, `createNGSResult` | ✅ | ✅ | ✅ (separate) | ✅ |
| **ET** | `getETRecord`, `createETRecord` | ✅ | ✅ | ✅ (on cycle) | ✅ |
| **Pregnancy** | `getPregnancyTest`, `createPregnancyTest`, `getPregnancyOutcome`, `createPregnancyOutcome` | ✅ | ✅ | ✅ (on cycle) | ✅ |
| **Cryo** | Tank/Embryo/Sperm/Oocyte CRUD + `getExpiring` | ✅ | ✅ | ✅ | ✅ |
| **Investigations** | CRUD | ✅ | ✅ | ✅ | ✅ |
| **Billing** | Invoice CRUD + Payments | ✅ | ✅ | ✅ | ✅ |
| **Appointments** | CRUD + Calendar + Status | ✅ | ✅ | ✅ | ✅ |
| **Tasks** | CRUD + Complete | ✅ | ✅ | ✅ | ✅ |
| **Reports** | KPI, Fertilization, Financial, Outcomes | ✅ | ✅ | ✅ | ✅ |

**Key backend strength:** The `getCycleById` service already does:
```js
include: {
  couple: { include: { wifePatient: ..., husbandPatient: ... } },
  follicleTrackings: { orderBy: { dayNumber: "asc" } },
  opuRecord: true,
  semenData: true,
  embryologyRecords: { orderBy: { dayNumber: "asc" } },
  etRecord: true,
  pregnancyTest: true,
  pregnancyOutcome: true,
  embryoCryos: true,
}
```
This means **a single API call** returns everything needed for the CycleDetail page.

---

## 4. Priority Matrix

```
                  HIGH VALUE
                    │
                    │
     CYCLE DETAIL   │   INVESTIGATION CREATE/DETAIL
     (unlocks all   │   BILLING CREATE/DETAIL
      sub-pages)    │
                    │
   CRITICAL ────────┼──────── NICE TO HAVE
                    │
                    │
   CYCLE SUB-PAGES  │   CRYO TANK FORM
   (Follicles, OPU, │   AUDIT LOG VIEWER
   Embryology, ET,  │   PER-PATIENT CRYO
   Pregnancy)       │
                    │
                    │
                  LOW EFFORT
```

---

## 5. Phase 1: CycleDetail — The Critical Gap

### Why it's #1
- `CycleCreate` navigates to `/cycles/:id` after creation → **clicking leads to blank page**
- `PatientDetail` links to `/cycles/${cycle.id}` → **all cycle links are dead**
- The backend returns everything needed in one call

### What it needs to show (as tabs/sections)

```
┌─────────────────────────────────────────────────────────────┐
│ 🩺 Cycle #3 — ICSI                        Status: OPU_DONE │
│ Wife: Sarah K. & Husband: Ahmed M.                          │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [Follicles] [OPU] [Semen] [Embryology] [Biopsy] │
│ [ET] [Pregnancy] [Cryo] [Prescriptions] [Tasks]            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cycle Summary Card:                                        │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐   │
│  │ ART Type  │ │ Protocol │ │ Physician │ │ Warnings │   │
│  │ ICSI      │ │ Antag.   │ │ Dr. Name  │ │ None     │   │
│  └───────────┘ └──────────┘ └───────────┘ └──────────┘   │
│                                                             │
│  Timeline:                                                  │
│  ● Stimulation ──● OPU ──● Embryology ──● ET ──● Preg.     │
│                                                             │
│  Key Dates:                                                 │
│  LMP: 01-Jun    HCG: 15-Jun    OPU: 17-Jun    ET: 22-Jun   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation approach
The `getCycleById` endpoint returns all data in one go. The page can be a single full-page component with:
- **Header**: Couple names, cycle #, ART type badge, status badge, warning flags
- **Timeline strip**: Visual status progression
- **Section grid**: Key metrics cards (follicles collected, oocytes retrieved, embryos, transfer status)
- **Tab panel**: Each sub-resource gets its own tab

**Estimated effort:** 300–500 lines | **Backend effort:** None (already done)

---

## 6. Phase 2: Cycle Sub-Pages

After CycleDetail exists, build the sub-pages that allow data entry at each stage.

### 6.1 FollicleTracking

**What:** Daily ultrasound grid showing follicle growth over stimulation days
**Who builds it:** One PageLoader component inside CycleDetail tab
**Backend:** `GET /cycles/:id/follicles` + `POST /cycles/:id/follicles`
**Key UI:** Table/grid where rows are days and columns are right/left ovary follicle counts by size bracket

### 6.2 OPUForm

**What:** Oocyte retrieval record form
**Who builds it:** One PageLoader component
**Backend:** `GET /cycles/:id/opu` + `POST/PUT /cycles/:id/opu`
**Key UI:** Form with counts + procedure notes + physician selector

### 6.3 SemenData

**What:** Semen analysis results (pre and post-processing)
**Who builds it:** One PageLoader component
**Backend:** `GET /cycles/:id/semen` + `POST /cycles/:id/semen`
**Key UI:** Side-by-side pre/post column format with all the semen parameters

### 6.4 EmbryologyLab

**What:** Day 0–7 embryo development timeline
**Who builds it:** Tab within CycleDetail
**Backend:** `GET /cycles/:id/embryology` + `POST /cycles/:id/embryology`
**Key UI:** Timeline/card view showing each day's embryo count, grading, and ICSI data

### 6.5 Biopsy / NGS

**What:** Embryo biopsy and genetic testing results
**Who builds it:** Tab within CycleDetail
**Backend:** Separate embryology module routes
**Key UI:** Table of biopsied embryos with their NGS status (Euploid/Aneuploid)

### 6.6 ETForm

**What:** Embryo transfer record
**Who builds it:** Tab within CycleDetail
**Backend:** `GET /cycles/:id/et` + `POST /cycles/:id/et`
**Key UI:** Form with physician/embryologist/witness selectors, transferred embryos cards

### 6.7 PregnancyTracking

**What:** Pregnancy test + outcome
**Who builds it:** Tab within CycleDetail
**Backend:** `GET /cycles/:id/pregnancy-test` + `POST` and `GET /cycles/:id/pregnancy-outcome` + `POST`
**Key UI:** B-hCG level display + outcome form

---

## 7. Phase 3: Supporting Pages

### 7.1 InvestigationCreate / InvestigationDetail

**Why important:** Currently there's no way to ORDER an investigation from the UI. The InvestigationList exists but you can't add new ones.
**Backend:** `POST /investigations` + `GET /investigations/:id` + `PUT /investigations/:id`
**Key UI:** Form with investigation type, patient selector, date, and results JSON builder

### 7.2 InvoiceCreate / InvoiceDetail

**Why important:** Currently there's no way to CREATE invoices from the UI.
**Backend:** `POST /invoices` + `GET /invoices/:id` + line items + payments
**Key UI:** Multi-line-item invoice builder with payment tracking

---

## 8. Phase 4: Enhancement & Polish

### 8.1 Couple Linking Page

**Current state:** Inside PatientDetail tab, shows couple info but no form to create/edit
**What's needed:** A form/flow within the PatientDetail "Couple" tab to:
- Search for partner patient
- Set infertility type and diagnosis
- Link as a couple

### 8.2 Medical History Form

**Current state:** Inside PatientDetail tab, read-only view
**What's needed:** Edit form for all medical history fields (OB/GYN, surgical, LMP, gravida/para)

### 8.3 Diagnosis Form

**Current state:** Inside PatientDetail tab, read-only list
**What's needed:** Add/edit/remove diagnoses

### 8.4 Avatar & User Profile

**Current state:** No user profile page
**What's needed:** Change password, view personal info

---

## 9. Implementation Order Summary

```
Priority │ Page                    │ Route                  │ Backend │ Est. Effort
─────────┼─────────────────────────┼────────────────────────┼─────────┼────────────
   P0    │ CycleDetail             │ /cycles/:id            │ ✅ Done │ 🟡 Med
   P1    │ Cycle Sub-Pages         │ Tabs in CycleDetail    │ ✅ Done │ 🔴 High
         │  ├ FollicleTracking     │                        │         │ 🟡 Med
         │  ├ OPUForm              │                        │         │ 🟢 Low
         │  ├ SemenData            │                        │         │ 🟢 Low
         │  ├ EmbryologyLab        │                        │         │ 🟡 Med
         │  ├ Biopsy/NGS           │                        │         │ 🟡 Med
         │  ├ ETForm               │                        │         │ 🟡 Med
         │  └ PregnancyTracking    │                        │         │ 🟢 Low
   P2    │ InvestigationCreate     │ /investigations/new    │ ✅ Done │ 🟡 Med
   P2    │ InvestigationDetail     │ /investigations/:id    │ ✅ Done │ 🟢 Low
   P2    │ InvoiceCreate           │ /billing/new           │ ✅ Done │ 🟡 Med
   P2    │ InvoiceDetail           │ /billing/:id           │ ✅ Done │ 🟡 Med
   P3    │ Couple Link Form        │ Tab in PatientDetail   │ ✅ Done │ 🟢 Low
   P3    │ Medical History Form    │ Tab in PatientDetail   │ ✅ Done │ 🟢 Low
   P3    │ Diagnosis Form          │ Tab in PatientDetail   │ ✅ Done │ 🟢 Low
   P3    │ User Profile            │ /profile               │ ✅ Done │ 🟢 Low
   P4    │ Audit Log Viewer        │ /admin/audit-logs      │ ❌ Missing* │ 🟢 Low
   P4    │ Tank Management Forms   │ /cryo-inventory        │ ✅ Done │ 🟢 Low
```

*\* AuditLog model exists in Prisma but no backend module yet*

### Recommended immediate next step

**→ Build `CycleDetail.tsx` as a single comprehensive page with:**
1. Cycle header (couple info, ART type, status, warnings, timeline)
2. All sub-resources as tabs/sections
3. Inline forms for each sub-resource where records don't exist yet
4. Read-only views where records exist

This single page covers ~70% of the missing frontend functionality and unblocks the entire patient journey from step 4 (Cycle Initiation) through step 13 (Pregnancy Outcome).

---

> **Document Version:** 1.0.0
> **Last Updated:** June 2026
> **Author:** System Architecture Team
