# 🌿 Life's Spring Women Center — Fertility HMS

> **System:** First Fertility Hospital Management System (HMS)
> **Tech Stack:** React + TypeScript + Tailwind CSS (Frontend) | Node.js + Express + Prisma + PostgreSQL (Backend)
> **Version:** 1.0.0

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Roles & Permissions Matrix](#2-user-roles--permissions-matrix)
3. [Module Architecture](#3-module-architecture)
4. [Database Schema Design](#4-database-schema-design)
5. [API Routes & Controllers](#5-api-routes--controllers)
6. [Frontend Component Tree](#6-frontend-component-tree)
7. [Key Workflows & Data Flow](#7-key-workflows--data-flow)
8. [Security & Compliance](#8-security--compliance)

---

## 1. System Overview

### 1.1 Purpose
Life's Spring Women Center is a comprehensive, web-based Fertility Hospital Management System (HMS) designed to manage the complete patient lifecycle in a fertility clinic — from initial registration through treatment cycles, embryology lab, cryopreservation, billing, and outcome tracking.

### 1.2 Core Capabilities
- **Patient & Couple Management** — Dual-partner records with full medical history
- **ART Cycle Management** — Complete stimulation → OPU → ET → pregnancy tracking
- **Embryology Lab Management** — Day 0–7 embryo development, ICSI, biopsy, NGS
- **Cryo Inventory** — Embryo/Sperm/Oocyte storage with tank tracking & expiry
- **Scheduling** — Physician, clinic, and room resource booking
- **Billing & Invoicing** — Multi-currency invoices, payments, deposits, VAT
- **Reporting & KPIs** — Fertilization rates, OPU stats, cycle outcomes
- **Task Management** — Reminders, follow-ups, expiry notifications

### 1.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TS + Tailwind)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │   Auth   │ │  Patient │ │  Cycle   │ │  Billing       │  │
│  │   Pages  │ │  Modules │ │  Modules │ │  & Reports     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API (HTTP/JSON)
┌──────────────────────▼──────────────────────────────────────┐
│              Backend (Node.js + Express)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Auth MW │ │  Routes  │ │Controllers│ │  Validators    │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────────────────┐
│                    PostgreSQL Database                        │
│  Patients │ Cycles │ Embryology │ Cryo │ Billing │ Users    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. User Roles & Permissions Matrix

### 2.1 Role Definitions

| Role | Code | Department | Description |
|------|------|-----------|-------------|
| **System Admin** | `ADMIN` | IT/Admin | Full system access, user management, configuration |
| **Consultant Doctor** | `CONSULTANT` | Medical | Patient diagnosis, treatment plans, cycle oversight |
| **Fertility Specialist** | `SPECIALIST` | Medical | Stimulation protocols, OPU, ET procedures |
| **Nurse** | `NURSE` | Medical | Patient care, vitals, injections, follow-ups |
| **Embryologist** | `EMBRYOLOGIST` | Lab | ICSI, embryo culture, biopsy, cryo, grading |
| **Counsellor** | `COUNSELLOR` | Support | Patient counselling, psychological support |
| **Sonographer** | `SONOGRAPHER` | Diagnostic | Ultrasound scans, follicle tracking |
| **Lab Technician** | `LAB_TECH` | Lab | Semen analysis, hormonal assays, infection screening |
| **Billing Officer** | `BILLING` | Finance | Invoicing, payments, insurance processing |
| **Receptionist** | `RECEPTIONIST` | Admin | Appointment booking, patient registration |
| **Viewer (Read-Only)** | `VIEWER` | External | Read-only access for auditing/regulation |

### 2.2 Permission Matrix

| Module/Feature | ADMIN | CONSULTANT | SPECIALIST | NURSE | EMBRYOLOGIST | COUNSELLOR | SONOGRAPHER | LAB_TECH | BILLING | RECEPTIONIST | VIEWER |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Patient Management** | | | | | | | | | | | |
| Register Patient | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| View Patient Records | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Patient Details | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| View Medical History | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit Medical History | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Cycle Management** | | | | | | | | | | | |
| Create New Cycle | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Cycle Details | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Record Follicle Tracking | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Record OPU Details | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Embryology Lab** | | | | | | | | | | | |
| View Embryo Data | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Record Embryo Grading | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Record Biopsy/PGD Data | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Record NGS Results | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Cryo Inventory** | | | | | | | | | | | |
| View Cryo Records | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Add/Edit Cryo Records | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Investigations** | | | | | | | | | | | |
| View Lab Results | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Enter Lab Results | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View Semen Analysis | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Scheduling** | | | | | | | | | | | |
| Book Appointment | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| View Schedule | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Billing** | | | | | | | | | | | |
| Create Invoice | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Process Payment | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View Invoices | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Reports** | | | | | | | | | | | |
| View KPI Reports | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Tasks** | | | | | | | | | | | |
| Create Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View & Complete Tasks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **System Admin** | | | | | | | | | | | |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Configuration | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Module Architecture

### 3.1 Module Overview

Each backend module follows the pattern: `module/service/controller/routes/validator` — all colocated in a single directory.

```
lifes-spring/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (22 models, 16 enums)
│   │   ├── seed.js                # Sample data
│   │   └── migrations/
│   ├── src/
│   │   ├── server.js              # Express app entry — mounts 12 modules under /api/v1
│   │   ├── config/
│   │   │   └── db.js             # Prisma client config
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js # JWT verification middleware
│   │   │   ├── validateRequest.js # Zod schema validation middleware
│   │   │   ├── rbac.middleware.js # Role-based access control
│   │   │   └── errorHandler.js   # Global error handler + asyncHandler
│   │   ├── utils/
│   │   │   ├── AppError.js       # Custom error class
│   │   │   ├── logger.js         # Structured logging
│   │   │   ├── generateToken.js  # JWT token generation
│   │   │   └── permissions.js    # Role permission constants
│   │   └── modules/              # 🆕 Modular architecture — each module has:
│   │       ├── auth/             #   ├── *.routes.js
│   │       │   ├── auth.routes.js        #   ├── *.controller.js
│   │       │   ├── auth.controller.js    #   ├── *.service.js
│   │       │   ├── auth.service.js       #   └── *.validator.js
│   │       │   └── auth.validator.js     #
│   │       ├── user/                     # (same pattern)
│   │       │   ├── user.routes.js
│   │       │   ├── user.controller.js
│   │       │   ├── user.service.js
│   │       │   └── user.validator.js
│   │       ├── patient/
│   │       │   ├── patient.routes.js
│   │       │   ├── patient.controller.js
│   │       │   ├── patient.service.js
│   │       │   └── patient.validator.js
│   │       ├── couple/
│   │       │   ├── couple.routes.js
│   │       │   ├── couple.controller.js
│   │       │   ├── couple.service.js
│   │       │   └── couple.validator.js
│   │       ├── cycle/
│   │       │   ├── cycle.routes.js
│   │       │   ├── cycle.controller.js
│   │       │   ├── cycle.service.js
│   │       │   └── cycle.validator.js
│   │       ├── embryology/
│   │       │   ├── embryology.routes.js
│   │       │   ├── embryology.controller.js
│   │       │   ├── embryology.service.js
│   │       │   └── embryology.validator.js
│   │       ├── cryo/
│   │       │   ├── cryo.routes.js
│   │       │   ├── cryo.controller.js
│   │       │   ├── cryo.service.js
│   │       │   └── cryo.validator.js
│   │       ├── investigation/
│   │       │   ├── investigation.routes.js
│   │       │   ├── investigation.controller.js
│   │       │   ├── investigation.service.js
│   │       │   └── investigation.validator.js
│   │       ├── appointment/
│   │       │   ├── appointment.routes.js
│   │       │   ├── appointment.controller.js
│   │       │   ├── appointment.service.js
│   │       │   └── appointment.validator.js
│   │       ├── billing/
│   │       │   ├── billing.routes.js
│   │       │   ├── billing.controller.js
│   │       │   ├── billing.service.js
│   │       │   └── billing.validator.js
│   │       ├── report/
│   │       │   ├── report.routes.js
│   │       │   ├── report.controller.js
│   │       │   └── report.service.js
│   │       └── task/
│   │           ├── task.routes.js
│   │           ├── task.controller.js
│   │           ├── task.service.js
│   │           └── task.validator.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/               # Axios instance & API calls
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page-level components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── store/             # State management (Zustand)
│   │   ├── types/             # TypeScript types/interfaces
│   │   ├── utils/             # Utility functions
│   │   └── styles/            # Global styles
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── docs/
    └── planning.md             # This document
```

### 3.2 Frontend Pages & Routes

| Route | Page | Roles | Description |
|-------|------|-------|-------------|
| `/login` | LoginPage | All | Authentication |
| `/` | Dashboard | All | Role-based dashboard with KPIs |
| `/patients` | PatientList | All except Viewer | Patient search & list |
| `/patients/new` | PatientCreate | Reception, Admin, Consultant | New patient registration |
| `/patients/:id` | PatientDetail | All | Full patient record |
| `/patients/:id/cycles` | CycleHistory | Medical roles | Patient's cycle history |
| `/patients/:id/cryo` | CryoInventory | Medical + Admin | Patient's cryo records |
| `/cycles` | CycleDashboard | Medical roles | Active cycles overview |
| `/cycles/new` | CycleCreate | Consultant, Specialist | Start new treatment cycle |
| `/cycles/:id` | CycleDetail | Medical roles | Full cycle details |
| `/cycles/:id/follicles` | FollicleTracking | Specialist, Sonographer | Follicle growth grid |
| `/cycles/:id/opu` | OPURecord | Specialist, Nurse, Embryologist | OPU details |
| `/cycles/:id/embryology` | EmbryologyLab | Embryologist, Consultant | Embryo development |
| `/cycles/:id/et` | ETRecord | Specialist, Embryologist | Embryo transfer details |
| `/cycles/:id/pregnancy` | PregnancyTracking | Consultant, Specialist | Pregnancy test & outcome |
| `/appointments` | AppointmentList | All | Schedule management |
| `/appointments/new` | AppointmentCreate | Reception, Medical | Book appointment |
| `/investigations` | InvestigationList | Medical | Lab results overview |
| `/investigations/:id` | InvestigationDetail | Medical | Detailed results |
| `/cryo-inventory` | CryoDashboard | Embryologist, Admin | Tank management |
| `/billing` | InvoiceList | Billing, Admin | Invoices & payments |
| `/billing/new` | InvoiceCreate | Billing | New invoice |
| `/reports` | ReportsDashboard | Medical + Admin | KPI and analytics |
| `/tasks` | TaskList | All | Task management |
| `/admin/users` | UserManagement | Admin only | User CRUD & permissions |
| `/admin/settings` | SystemSettings | Admin only | System configuration |

---

## 4. Database Schema Design

### 4.1 Entity Relationship Overview

```
User ──1:N──> Patient ──1:1──> Couple <──1:1── PartnerPatient
 │                      │
 │                      ├──1:N──> Cycle ──1:N──> FollicleTracking
 │                      │         │              │
 │                      │         ├──1:1──> OPURecord
 │                      │         │              │
 │                      │         ├──1:N──> EmbryologyRecord
 │                      │         │              │
 │                      │         ├──1:1──> ETRecord
 │                      │         │
 │                      │         ├──1:1──> PregnancyTest
 │                      │         │
 │                      │         └──1:1──> PregnancyOutcome
 │                      │
 │                      ├──1:N──> Investigation
 │                      │
 │                      ├──1:N──> CryoRecord
 │                      │
 │                      └──1:N──> Invoice
 │
 Appointment ──N:1──> Patient
 Appointment ──N:1──> User (physician/resource)

 Task ──N:1──> Patient (optional)
 Task ──N:1──> User (assignee)
 Task ──N:1──> Cycle (optional)
```

### 4.2 Complete Schema

#### **User** (`users`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| email | String (unique) | Login email |
| password | String | bcrypt hashed |
| firstName | String | |
| lastName | String | |
| role | Enum (Role) | ADMIN, CONSULTANT, SPECIALIST, NURSE, EMBRYOLOGIST, COUNSELLOR, SONOGRAPHER, LAB_TECH, BILLING, RECEPTIONIST, VIEWER |
| phone | String? | |
| isActive | Boolean | Default: true |
| lastLogin | DateTime? | |
| permissions | JSON | Granular permission overrides |
| refreshToken | String? | JWT refresh token |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### **Patient** (`patients`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| mrn | String (unique) | Medical Record Number |
| oldMrn | String? | Legacy MRN |
| firstName | String | |
| lastName | String | |
| dateOfBirth | DateTime | |
| nationality | String | |
| nationalId | String? | |
| gender | Enum | MALE, FEMALE |
| phone | String | |
| email | String? | |
| address | String? | |
| city | String? | |
| occupation | String? | |
| company | String? | Insurance/Company |
| hearUsFrom | String? | Referral source |
| branch | String? | Clinic branch |
| isActive | Boolean | |
| createdById | String | FK → User |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### **Couple** (`couples`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| wifePatientId | String (unique) | FK → Patient (female partner) |
| husbandPatientId | String (unique) | FK → Patient (male partner) |
| marriageDuration | Int? | Years |
| infertilityType | Enum? | PRIMARY, SECONDARY |
| infertilityDiagnosis | String? | Text description |
| createdById | String | FK → User |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### **Patient Medical History** (`patient_medical_histories`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| patientId | String | FK → Patient |
| obHistory | String? | Obstetric history |
| surgicalHistory | String? | |
| gynecologicalHistory | String? | |
| adolescence | String? | |
| contraception | String? | |
| lmp | DateTime? | Last Menstrual Period |
| menstrualCycle | String? | Regularity, duration |
| gravida | Int? | Number of pregnancies |
| para | Int? | Number of deliveries |
| abortion | Int? | Number of abortions |
| ectopic | Int? | Number of ectopic pregnancies |
| livingChildren | Int? | |
| createdById | String | FK → User |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### **Patient Diagnosis** (`patient_diagnoses`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| patientId | String | FK → Patient |
| diagnosis | Enum | PCOS, ANOVULATION, ENDOMETRIOSIS, TUBAL_FACTOR, FIBROID, UTERINE_FACTOR, UNEXPLAINED, RECURRENT_MISCARRIAGE, AZOOSPERMIA, PGS_ACGH, PGD, GENDER_SELECTION, KLINEFELTER_SYNDROME, MALE_FACTOR, DOR, OTHER |
| notes | String? | |
| diagnosedBy | String | FK → User |
| diagnosedAt | DateTime | |
| createdAt | DateTime | |

#### **Cycle** (`cycles`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| coupleId | String | FK → Couple |
| cycleNumber | Int | Sequential per patient |
| artType | Enum | ICSI, IVF, IUI, FET, NATURAL |
| pgdType | Enum? | PGS, PGD, NONE |
| pgdGene | String? | |
| pgdMutation | String? | |
| pgdInheritanceMode | String? | |
| pgdMarkers | String? | |
| pgdTestMethod | String? | |
| pgdFemaleDiagnosis | String? | |
| pgdMaleDiagnosis | String? | |
| stimulationProtocol | String? | e.g., "Antagonist", "Agonist" |
| stimulationDrugs | JSON | [{name, dosage, unit, startDay, endDay}] |
| treatingPhysicianId | String | FK → User |
| bmi | Float? | |
| cycleWarnings | String? | e.g., "HEP B PATIENT" |
| lmp | DateTime? | Last Menstrual Period |
| hcgDate | DateTime? | |
| opuDate | DateTime? | |
| etDate | DateTime? | |
| status | Enum | UNDER_STIMULATION, OPU_SCHEDULED, OPU_COMPLETED, ET_SCHEDULED, ET_COMPLETED, PREGNANCY_TEST, PREGNANCY_CONFIRMED, CYCLE_CANCELLED, CYCLE_COMPLETED |
| notes | String? | |
| createdById | String | FK → User |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### **Follicle Tracking** (`follicle_trackings`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| cycleId | String | FK → Cycle |
| dayNumber | Int | Stimulation day (1–14) |
| date | DateTime | |
| rightOvary | JSON | [{size: float, count: int}] |
| leftOvary | JSON | [{size: float, count: int}] |
| endometrium | String? | Thickness & pattern |
| notes | String? | |
| recordedById | String | FK → User |
| createdAt | DateTime | |

#### **OPU Record** (`opu_records`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| cycleId | String (unique) | FK → Cycle |
| anaesthesiaType | String? | |
| follicleCount | Int? | |
| oocyteCount | Int? | |
| miiOocyteCount | Int? | Mature oocytes |
| operationNotes | String? | |
| complications | String? | |
| postOpPlan | String? | |
| performedById | String | FK → User |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### **Semen Data** (`semen_data`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| cycleId | String | FK → Cycle |
| patientId | String | FK → Patient (male) |
| specimenType | String? | Ejaculate, TESA, PESA, MESA |
| processingMethod | String? | Swim-Up, Gradient, Wash |
| collectionDate | DateTime? | |
| abstinenceDays | Int? | |
| preVolume | Float? | |
| preConcentration | Float? | million/mL |
| preTotalCount | Float? | million |
| preMotility | Float? | % |
| preProgressiveMotility | Float? | % |
| preMorphology | Float? | % (Kruger strict) |
| preViscosity | String? | |
| preColor | String? | |
| prePH | Float? | |
| postVolume | Float? | |
| postConcentration | Float? | |
| postTotalCount | Float? | |
| postMotility | Float? | |
| postProgressiveMotility | Float? | |
| postMorphology | Float? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### **Embryology Record** (`embryology_records`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| cycleId | String | FK → Cycle |
| dayNumber | Enum | D0, D1, D2, D3, D4, D5, D6, D7 |
| embryoCount | Int | |
| icsiMethod | String? | |
| icsiPerformedById | String? | FK → User |
| details | JSON | [{embryoNumber, grade, fragmentation, cellCount, expansion, quality}] |
| notes | String? | |
| createdById | String | FK → User |
| createdAt | DateTime | |

#### **Embryo Biopsy** (`embryo_biopsies`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| cycleId | String | FK → Cycle |
| embryoNumber | Int | |
| biopsyDate | DateTime | |
| biopsyType | Enum | POLAR_BODY, BLASTOMERE, TROPHECTODERM |
| cellsRemoved | Int? | |
| labNotes | String? | |
| performedById | String | FK → User |
| createdAt | DateTime | |

#### **NGS Result** (`ngs_results`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| embryoBiopsyId | String | FK → EmbryoBiopsy |
| embryoNumber | Int | |
| result | Enum | EUPLOID, ANEUPLOID, MOSAIC, FAILED, PENDING |
| chromosomeDetails | JSON? | [{chromosome, status}] |
| reportFile | String? | URL to attached PDF |
| reportedAt | DateTime | |
| reportedById | String | FK → User |
| notes | String? | |
| createdAt | DateTime | |

#### **Embryo Transfer Record** (`et_records`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| cycleId | String (unique) | FK → Cycle |
| etDate | DateTime | |
| physicianId | String | FK → User |
| embryologistId | String | FK → User |
| witnessId | String? | FK → User |
| catheterType | String? | |
| catheterBrand | String? | |
| transferredEmbryos | JSON | [{embryoNumber, quality, stage}] |
| residueEmbryos | String? | |
| notes | String? | |
| createdAt | DateTime | |

#### **Embryo Cryo** (`embryo_cryos`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| cycleId | String | FK → Cycle |
| embryoNumber | Int | |
| freezeDate | DateTime | |
| tankId | String | FK → CryoTank |
| partition | String? | |
| level | String? | |
| goblet | String? | |
| containerColor | String? | |
| protocol | String? | Vitrification, Slow Freeze |
| media | String? | |
| strawDetails | String? | |
| renewalDate | DateTime? | |
| status | Enum | STORED, TRANSFERRED, DISCARDED, EXPIRED |
| discardedAt | DateTime? | |
| discardedReason | String? | |
| notes | String? | |
| createdById | String | FK → User |
| createdAt | DateTime | |

#### **Cryo Tank** (`cryo_tanks`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| name | String | Tank identifier |
| location | String? | Physical location |
| capacity | Int? | Max number of straws |
| currentCount | Int | |
| fillLevel | Float? | Liquid nitrogen level |
| lastChecked | DateTime? | |
| isActive | Boolean | |
| createdAt | DateTime | |

#### **Sperm/Oocyte Cryo** (`sperm_cryos`, `oocyte_cryos`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| patientId | String | FK → Patient |
| freezeDate | DateTime | |
| tankId | String | FK → CryoTank |
| partition | String? | |
| level | String? | |
| goblet | String? | |
| containerColor | String? | |
| protocol | String? | |
| source | String? | Ejaculate, TESA, Donor |
| count | Int? | |
| motility | Float? | (for sperm) |
| renewalDate | DateTime? | |
| status | Enum | STORED, USED, DISCARDED, EXPIRED |
| notes | String? | |
| createdById | String | FK → User |

#### **Investigation** (`investigations`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| patientId | String | FK → Patient |
| type | Enum | SEMEN_ANALYSIS, HORMONAL, INFECTION_SCREENING, GENETIC, LAPAROSCOPY, HSG, ULTRASOUND, OTHER |
| date | DateTime | |
| orderedById | String | FK → User |
| results | JSON | Flexible key-value results |
| reportFile | String? | URL to attachment |
| notes | String? | |
| isAbnormal | Boolean? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### **Appointment** (`appointments`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| patientId | String | FK → Patient |
| physicianId | String? | FK → User |
| service | String | e.g., "General Blood Test", "Ultrasound" |
| clinicId | String? | FK → Clinic |
| startTime | DateTime | |
| endTime | DateTime | |
| status | Enum | SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW |
| notes | String? | |
| createdById | String | FK → User |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### **Clinic** (`clinics`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| name | String | |
| branch | String? | |
| startTime | String | HH:mm |
| endTime | String | HH:mm |
| workingDays | JSON | [0,1,2,3,4,5,6] (Sun=0) |
| isActive | Boolean | |
| createdAt | DateTime | |

#### **Invoice** (`invoices`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| invoiceNumber | String (unique) | Auto-generated |
| patientId | String | FK → Patient |
| dueDate | DateTime | |
| branch | String? | |
| currency | String | AED, USD, EUR, etc. |
| subTotal | Float | |
| vatRate | Float | e.g., 0.05 |
| vatAmount | Float | |
| discountAmount | Float? | |
| totalAmount | Float | |
| paidAmount | Float | |
| balanceAmount | Float | |
| status | Enum | DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED |
| insuranceClaim | Boolean? | |
| notes | String? | |
| createdById | String | FK → User |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### **Invoice Line Item** (`invoice_line_items`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| invoiceId | String | FK → Invoice |
| description | String | |
| quantity | Int | |
| unitPrice | Float | |
| totalPrice | Float | |
| createdAt | DateTime | |

#### **Payment** (`payments`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| invoiceId | String | FK → Invoice |
| amount | Float | |
| method | Enum | CASH, CREDIT_CARD, WIRE_TRANSFER, CHEQUE, INSURANCE |
| reference | String? | Transaction reference |
| paymentDate | DateTime | |
| receivedById | String | FK → User |
| notes | String? | |
| createdAt | DateTime | |

#### **Task** (`tasks`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| title | String | |
| description | String? | |
| type | Enum | FOLLOW_UP_CALL, EMBRYO_DISPOSAL, GAMETE_REMINDER, EXPIRY_NOTIFICATION, GENERAL |
| priority | Enum | LOW, MEDIUM, HIGH, URGENT |
| status | Enum | PENDING, IN_PROGRESS, COMPLETED, CANCELLED |
| patientId | String? | FK → Patient |
| cycleId | String? | FK → Cycle |
| assigneeId | String | FK → User |
| assignedById | String | FK → User |
| dueDate | DateTime? | |
| completedAt | DateTime? | |
| completedById | String? | FK → User |
| notes | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### **Audit Log** (`audit_logs`)
| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| userId | String | FK → User |
| action | String | CREATE, READ, UPDATE, DELETE |
| entity | String | e.g., "Patient", "Cycle" |
| entityId | String? | |
| changes | JSON? | Before/after values |
| ipAddress | String? | |
| userAgent | String? | |
| createdAt | DateTime | |

---

## 5. API Routes & Controllers

### 5.1 Route Structure

```
API Base: /api/v1

AUTH ──────────── POST   /auth/login
                  POST   /auth/register
                  POST   /auth/logout
                  POST   /auth/refresh-token
                  GET    /auth/me

USERS ─────────── GET    /users
                  GET    /users/:id
                  POST   /users          [ADMIN]
                  PUT    /users/:id      [ADMIN]
                  PATCH  /users/:id/deactivate [ADMIN]
                  GET    /users/roles

PATIENTS ──────── GET    /patients
                  GET    /patients/search
                  GET    /patients/:id
                  POST   /patients
                  PUT    /patients/:id
                  GET    /patients/:id/medical-history
                  PUT    /patients/:id/medical-history
                  GET    /patients/:id/diagnoses
                  POST   /patients/:id/diagnoses
                  GET    /patients/:id/couple
                  POST   /patients/:id/couple

CYCLES ────────── GET    /cycles
                  GET    /cycles/dashboard
                  GET    /cycles/:id
                  POST   /cycles
                  PUT    /cycles/:id
                  PATCH  /cycles/:id/status
                  
                  GET    /cycles/:id/follicles
                  POST   /cycles/:id/follicles
                  
                  GET    /cycles/:id/opu
                  POST   /cycles/:id/opu
                  PUT    /cycles/:id/opu
                  
                  GET    /cycles/:id/semen
                  POST   /cycles/:id/semen
                  
                  GET    /cycles/:id/embryology
                  POST   /cycles/:id/embryology
                  
                  GET    /cycles/:id/biopsy
                  POST   /cycles/:id/biopsy
                  
                  GET    /cycles/:id/ngs-results
                  POST   /cycles/:id/ngs-results
                  
                  GET    /cycles/:id/et
                  POST   /cycles/:id/et
                  
                  GET    /cycles/:id/pregnancy-test
                  POST   /cycles/:id/pregnancy-test
                  
                  GET    /cycles/:id/pregnancy-outcome
                  POST   /cycles/:id/pregnancy-outcome
                  
                  GET    /cycles/:id/cryo-embryos
                  POST   /cycles/:id/cryo-embryos

CRYO ──────────── GET    /cryo/tanks
                  POST   /cryo/tanks
                  PUT    /cryo/tanks/:id
                  GET    /cryo/tanks/:id/contents
                  
                  GET    /cryo/embryos
                  GET    /cryo/embryos/:id
                  PUT    /cryo/embryos/:id
                  PATCH  /cryo/embryos/:id/discard
                  
                  GET    /cryo/sperm
                  POST   /cryo/sperm
                  PUT    /cryo/sperm/:id
                  
                  GET    /cryo/oocytes
                  POST   /cryo/oocytes
                  PUT    /cryo/oocytes/:id
                  
                  GET    /cryo/expiring

INVESTIGATIONS ── GET    /investigations
                  GET    /investigations/:id
                  POST   /investigations
                  PUT    /investigations/:id

APPOINTMENTS ──── GET    /appointments
                  GET    /appointments/calendar
                  POST   /appointments
                  PUT    /appointments/:id
                  PATCH  /appointments/:id/status

BILLING ───────── GET    /invoices
                  GET    /invoices/:id
                  POST   /invoices
                  PUT    /invoices/:id
                  PATCH  /invoices/:id/cancel
                  
                  GET    /invoices/:id/payments
                  POST   /invoices/:id/payments
                  
                  GET    /patients/:id/invoices

REPORTS ───────── GET    /reports/kpi
                  GET    /reports/kpi/stimulation
                  GET    /reports/kpi/fertilization
                  GET    /reports/kpi/opu-technologist
                  GET    /reports/kpi/icsi-rates
                  GET    /reports/cycle-outcomes
                  GET    /reports/financial

TASKS ─────────── GET    /tasks
                  GET    /tasks/my
                  POST   /tasks
                  PUT    /tasks/:id
                  PATCH  /tasks/:id/complete
```

### 5.2 Controller Responsibilities

| Controller | Key Methods | Description |
|------------|------------|-------------|
| `auth.controller.js` | register, login, logout, refreshToken, getMe | Authentication & session |
| `user.controller.js` | getAll, getById, create, update, deactivate, getRoles | User management |
| `patient.controller.js` | getAll, search, getById, create, update | CRUD for patients |
| `couple.controller.js` | getByPatient, create, update | Couple linking |
| `cycle.controller.js` | getAll, getDashboard, getById, create, update, updateStatus | Treatment cycles |
| `embryology.controller.js` | getRecords, createRecord | Embryo development |
| `cryo.controller.js` | tank CRUD, embryo/sperm/oocyte CRUD, getExpiring | Cryo inventory |
| `investigation.controller.js` | getAll, getById, create, update | Lab results |
| `appointment.controller.js` | getAll, getCalendar, create, update, updateStatus | Scheduling |
| `billing.controller.js` | invoice CRUD, addPayment, cancelInvoice | Invoicing & payments |
| `report.controller.js` | getKPI, getFertilizationRates, getFinancial | Analytics |
| `task.controller.js` | getAll, getMy, create, update, complete | Task management |

---

## 6. Frontend Component Tree

### 6.1 Shared/Reusable Components

```
components/
├── ui/                          # Base UI primitives
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Modal.tsx
│   ├── Card.tsx
│   ├── Table.tsx
│   ├── Badge.tsx
│   ├── Tabs.tsx
│   ├── DatePicker.tsx
│   ├── Pagination.tsx
│   ├── SearchInput.tsx
│   ├── Spinner.tsx
│   ├── Toast.tsx
│   ├── ConfirmDialog.tsx
│   └── FileUpload.tsx
│
├── layout/
│   ├── AppLayout.tsx             # Sidebar + Header + Content
│   ├── Sidebar.tsx               # Role-based navigation
│   ├── Header.tsx                # User info, notifications
│   └── Breadcrumb.tsx
│
├── auth/
│   ├── ProtectedRoute.tsx        # Auth guard
│   ├── RoleGuard.tsx             # Role-based access guard
│   └── PermissionGate.tsx        # Fine-grained permission check
│
└── common/
    ├── StatusBadge.tsx
    ├── PatientSearch.tsx
    ├── EmptyState.tsx
    ├── LoadingSkeleton.tsx
    ├── DataTable.tsx
    ├── FilterPanel.tsx
    ├── ExportButton.tsx
    └── AuditTimestamp.tsx
```

### 6.2 Feature Components by Module

```
Patient Module:
pages/patients/
├── PatientList.tsx               # Searchable table with filters
├── PatientCreate.tsx             # Registration form
├── PatientDetail.tsx             # Full patient record
├── components/
│   ├── PatientInfo.tsx           # Demographics
│   ├── MedicalHistory.tsx        # Medical/surgical/GYN history
│   ├── DiagnosisList.tsx         # Current diagnoses
│   ├── CoupleInfo.tsx            # Partner details
│   ├── PatientNotes.tsx          # Multi-role notes tabs
│   └── InvestigationHistory.tsx  # Past investigations

Cycle Module:
pages/cycles/
├── CycleDashboard.tsx            # Active cycles overview with counts
├── CycleList.tsx                 # Searchable cycle history
├── CycleDetail.tsx               # Full cycle details
├── CycleCreate.tsx               # Start new treatment cycle
├── components/
│   ├── CycleHeader.tsx           # Status, warnings, key dates
│   ├── StimulationInfo.tsx       # Protocol, drugs, BMI
│   ├── FollicleTracking.tsx      # Day 1-12 ultrasound grid
│   ├── FollicleChart.tsx         # Visualization of follicle growth
│   ├── OPUDetails.tsx            # Oocyte retrieval form
│   ├── SemenData.tsx             # ICSI semen prep
│   ├── EmbryologyTimeline.tsx    # Day 0-7 development
│   ├── EmbryoGrading.tsx         # Embryo quality cards
│   ├── BiopsyForm.tsx            # PGD/PGS biopsy
│   ├── NGSResults.tsx            # Genetic results table
│   ├── ETDetails.tsx             # Embryo transfer form
│   ├── PregnancyTest.tsx         # BHCG tracking
│   └── PregnancyOutcome.tsx      # Delivery/outcome

Cryo Module:
pages/cryo/
├── CryoDashboard.tsx             # Tank overview
├── CryoEmbryoList.tsx            # Patient's cryo embryos
├── CryoSpermList.tsx             # Patient's cryo sperm
├── CryoOocyteList.tsx            # Patient's cryo oocytes
├── components/
│   ├── TankMap.tsx               # Visual tank/partition/level
│   ├── CryoCard.tsx              # Individual frozen item
│   └── ExpiryAlert.tsx           # Renewal notifications

Appointments Module:
pages/appointments/
├── AppointmentCalendar.tsx       # Weekly/daily view
├── AppointmentList.tsx           # Table view
├── AppointmentForm.tsx           # Create/edit appointment
├── components/
│   ├── CalendarGrid.tsx
│   ├── AppointmentCard.tsx
│   └── ResourceSelector.tsx

Billing Module:
pages/billing/
├── InvoiceList.tsx               # Searchable invoices
├── InvoiceCreate.tsx             # New invoice with line items
├── InvoiceDetail.tsx             # Full invoice with payments
├── components/
│   ├── InvoiceLineItems.tsx
│   ├── PaymentForm.tsx           # Cash/card/wire transfer
│   ├── PaymentHistory.tsx
│   └── InvoiceSummary.tsx        # Totals, VAT, balance

Dashboard:
pages/dashboard/
├── Dashboard.tsx                 # Role-based home page
├── components/
│   ├── KPIcards.tsx              # Cycle counts, outcomes
│   ├── UpcomingTasks.tsx
│   ├── TodayAppointments.tsx
│   └── RecentPatients.tsx

Reports:
pages/reports/
├── ReportsDashboard.tsx
├── components/
│   ├── KPIChart.tsx
│   ├── FertilizationRateChart.tsx
│   ├── OPUTechnologistStats.tsx
│   └── CycleOutcomeTable.tsx

Tasks:
pages/tasks/
├── TaskList.tsx
├── TaskForm.tsx
├── components/
│   ├── TaskCard.tsx
│   └── TaskFilters.tsx

Admin:
pages/admin/
├── UserManagement.tsx            # User CRUD
├── UserForm.tsx                  # Create/edit user + permissions
├── SystemSettings.tsx            # Clinic config, branches
└── AuditLogViewer.tsx
```

---

## 7. Key Workflows & Data Flow

### 7.1 Complete Patient Journey

```
1. REGISTRATION
   Receptionist registers patient → Creates Patient record + MRN
       │
2. COUPLE LINKING
   Consultant links partners → Creates Couple record
       │
3. INITIAL WORKUP
   ● Medical History recorded
   ● Diagnoses assigned
   ● Investigations ordered (semen analysis, hormonal, genetic)
       │
4. CYCLE INITIATION
   Consultant creates new Cycle → Sets ART type, protocol
       │
5. STIMULATION PHASE (Days 1–12)
   Sonographer records follicle tracking daily
   Nurse monitors patient, administers drugs
       │
6. OOCYTE RETRIEVAL (OPU)
   Specialist performs OPU → Embryologist receives oocytes
   OPU record created
       │
7. EMBRYOLOGY (Days 0–7)
   Embryologist records fertilization, embryo grading daily
   ICSI data recorded if applicable
   Biopsy sent for PGD/PGS if applicable
   NGS results received and recorded
       │
8. EMBRYO TRANSFER
   Specialist + Embryologist perform ET
   ET record created
   Remaining embryos cryopreserved
       │
9. PREGNANCY TEST (Day 14 post-ET)
   BHCG test recorded → Positive or Negative
       │
10a. POSITIVE → Pregnancy US → Pregnancy Outcome (delivery)
10b. NEGATIVE → Cycle marked as completed, counselling offered
```

### 7.2 Cryo Inventory Flow

```
Cryopreservation at ET
       │
       ▼
Embryo → assigned to Tank → Partition → Level → Goblet
       │
       ▼
Annual renewal date set
       │
       ▼
Tasks: Renewal reminder generated
       │
       ▼
Patient returns for FET → embryo retrieved & thawed
       │
       ▼
Status updated: STORED → TRANSFERRED
```

### 7.3 Billing Flow

```
Service provided → Invoice created (DRAFT)
       │
       ▼
Invoice finalized → Status: SENT
       │
       ▼
Payment received (Cash/Card/Wire)
       │
       ▼
Payment recorded → Invoice updated:
  - paidAmount increased
  - balanceAmount recalculated
  - Status: PARTIALLY_PAID or PAID
```

### 7.4 Role-Based Dashboard Data Flow

```
User logs in → JWT verified → Role extracted from token
       │
       ▼
Frontend requests /api/v1/cycles/dashboard
       │
       ▼
Backend RBAC middleware checks role
       │
       ▼
Query tailored by role:
  - Admin: All cycles
  - Consultant: Their assigned cycles
  - Embryologist: OPU/Embryology counts
       │
       ▼
Response: { underStimulation, opuToday, pregnancyTests, etc. }
       │
       ▼
Dashboard renders role-specific KPI cards
```

---

## 8. Security & Compliance

### 8.1 Authentication & Authorization
- **JWT-based authentication** with access + refresh tokens
- **Access token**: Short-lived (15 min) — stored in memory
- **Refresh token**: Long-lived (7 days) — stored in httpOnly cookie
- **bcrypt** password hashing (salt rounds: 12)
- **RBAC middleware** on every protected route
- **Permission overrides** for granular access within roles

### 8.2 Data Protection
- **HTTPS** enforced in production
- **Input validation** with Zod on all API endpoints
- **SQL injection prevention** via Prisma ORM parameterized queries
- **Audit logging** for all CREATE, UPDATE, DELETE operations
- **Patient data encryption** at rest (PostgreSQL TDE or column-level)

### 8.3 Compliance Considerations
- **HIPAA/GDPR** alignment for patient health data
- **Data retention policies** configurable per clinic
- **Export functionality** for patient data portability
- **Access logs** maintained for regulatory auditing
- **Consent tracking** for treatment procedures

---

> **Document Version:** 1.0.0
> **Last Updated:** June 2026
> **Author:** System Architecture Team
> **Next Steps:** Begin backend implementation → Prisma schema → API routes → Frontend
