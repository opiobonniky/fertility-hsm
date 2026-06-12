# 🌿 Post-Registration Patient Flow — Complete Lifecycle

> **System:** Life's Spring Women Center — Fertility HMS
> **Purpose:** Detailed step-by-step flow from patient registration through treatment completion
> **Audience:** Developers, Clinic Admin, Training

---

## Table of Contents

1. [Overview](#1-overview)
2. [Step 0: Patient Registration](#2-step-0-patient-registration)
3. [Step 1: Couple Linking](#3-step-1-couple-linking)
4. [Step 2: Medical History & Diagnoses](#4-step-2-medical-history--diagnoses)
5. [Step 3: Investigations & Workup](#5-step-3-investigations--workup)
6. [Step 4: Cycle Initiation](#6-step-4-cycle-initiation)
7. [Step 5: Stimulation Phase (Follicle Tracking)](#7-step-5-stimulation-phase-follicle-tracking)
8. [Step 6: Oocyte Retrieval (OPU)](#8-step-6-oocyte-retrieval-opu)
9. [Step 7: Semen Collection & Preparation](#9-step-7-semen-collection--preparation)
10. [Step 8: Embryology Lab (Days 0–7)](#10-step-8-embryology-lab-days-0-7)
11. [Step 9: Biopsy, PGD/PGS & NGS](#11-step-9-biopsy-pgdpgs--ngs)
12. [Step 10: Embryo Transfer (ET)](#12-step-10-embryo-transfer-et)
13. [Step 11: Cryopreservation](#13-step-11-cryopreservation)
14. [Step 12: Pregnancy Test](#14-step-12-pregnancy-test)
15. [Step 13: Pregnancy Outcome](#15-step-13-pregnancy-outcome)
16. [Step 14: Cycle Completion](#16-step-14-cycle-completion)
17. [Supporting Flows](#17-supporting-flows)
18. [Complete Staff Responsibility Map](#18-complete-staff-responsibility-map)
19. [Entity Relationship Flow Diagram](#19-entity-relationship-flow-diagram)

---

## 1. Overview

### 1.1 The Big Picture

```
REGISTRATION
     │
     ▼
COUPLE LINKING ─────────────────► PREGNANCY OUTCOME
     │                                    ▲
     ▼                                    │
MEDICAL HISTORY & DIAGNOSES              │
     │                                    │
     ▼                                    │
INVESTIGATIONS & WORKUP                  │
     │                                    │
     ▼                                    │
CYCLE INITIATION                         │
     │                                    │
     ▼                                    │
STIMULATION PHASE (Follicle Tracking)    │
     │                                    │
     ▼                                    │
OPU (Egg Retrieval) ──► SEMEN PREP       │
     │                                    │
     ▼                                    │
EMBRYOLOGY LAB (D0–D7)                   │
     │                                    │
     ├──► BIOPSY / PGD / PGS / NGS       │
     │                                    │
     ▼                                    │
EMBRYO TRANSFER (ET)                     │
     │                                    │
     ├──► CRYOPRESERVATION (remaining)   │
     │                                    │
     ▼                                    │
PREGNANCY TEST ──────────────────────────┘
     │
     ├── POSITIVE ► PREGNANCY OUTCOME
     └── NEGATIVE ► CYCLE COMPLETED
```

### 1.2 Key Principles

- **One cycle, one couple**: Each treatment cycle belongs to exactly one couple (wife + husband)
- **Progressive status**: A cycle moves through the `CycleStatus` enum in strict sequence
- **Multiple patients per couple**: A husband and wife are both registered as individual patients before being linked as a couple
- **Staff role separation**: Each step involves different roles — no single role does everything

---

## 2. Step 0: Patient Registration

### Who performs this
**Receptionist** (or Admin, Consultant, Nurse)

### Where
`/patients/new` → `PatientCreate.tsx`

### What is captured

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `firstName` | String | ✅ | |
| `lastName` | String | ✅ | |
| `dateOfBirth` | Date | ✅ | |
| `nationality` | String | | Dropdown |
| `nationalId` | String | | Government ID |
| `gender` | Enum (MALE/FEMALE) | ✅ | |
| `phone` | String | ✅ | |
| `email` | String | | |
| `address` | String | | Geoapify autocomplete |
| `city` | String | | Geoapify autocomplete |
| `occupation` | String | | |
| `company` | String | | Insurance/employer |
| `hearUsFrom` | String | | Dynamic dropdown from `SelectionOption(category: "hearUsFrom")` |
| `branch` | String | | Dynamic dropdown from `SelectionOption(category: "branch")` |

### Auto-generated
- **MRN** (`LSW1001`, `LSW1002`, ...) — sequential, auto-generated
- `createdById` — set from authenticated user
- `isActive` — defaults to `true`

### Next step after registration
**→ Link the patient with their partner to form a Couple**

---

## 3. Step 1: Couple Linking

### Who performs this
**Consultant Doctor** (or Admin/Specialist)

### Where
Patient Detail page → "Link Partner" section

### What is happening
- The wife and husband are **both registered as individual patients**
- They are linked together as a **Couple** record
- The couple becomes the central entity for all treatment cycles

### Entities created

**Couple** (`couples` table):

| Field | Type | Required | Source |
|-------|------|----------|--------|
| `wifePatientId` | UUID | ✅ | FK → Patient (female partner) |
| `husbandPatientId` | UUID | ✅ | FK → Patient (male partner) |
| `marriageDuration` | Int | | Years married |
| `infertilityType` | Enum (PRIMARY/SECONDARY) | | |
| `infertilityDiagnosis` | String | | Free text |
| `createdById` | UUID | ✅ | FK → User |

### Auto-detection feature
The system has a `GET /patients/detect-spouse` endpoint that:
- Takes phone, nationalId, firstName, lastName, and gender of the patient being registered
- Searches for existing patients of the **opposite gender**
- Returns potential matches to auto-link as a couple
- This avoids duplicate patient records for the same person registered twice

### Validation rules
- A patient can only be a wife in **one** couple (unique `wifePatientId`)
- A patient can only be a husband in **one** couple (unique `husbandPatientId`)
- The same patient cannot be both wife and husband

### Next step
**→ Record medical history and assign diagnoses for each partner**

---

## 4. Step 2: Medical History & Diagnoses

### Who performs this
**Consultant Doctor** (or Specialist)

### Where
Patient Detail → Medical History tab → Diagnosis tab

### 4.1 Patient Medical History

One record per patient (`patient_medical_histories` table):

| Field | Type | Description |
|-------|------|-------------|
| `obHistory` | Text | Obstetric history (pregnancies, deliveries, complications) |
| `surgicalHistory` | Text | Past surgeries (especially pelvic/abdominal) |
| `gynecologicalHistory` | Text | Menstrual history, past GYN conditions |
| `adolescence` | Text | Pubertal development, menarche |
| `contraception` | Text | Past contraceptive use |
| `lmp` | DateTime | Last Menstrual Period |
| `menstrualCycle` | String | Regularity, cycle length, duration |
| `gravida` | Int | Number of pregnancies |
| `para` | Int | Number of deliveries |
| `abortion` | Int | Number of abortions (spontaneous + induced) |
| `ectopic` | Int | Number of ectopic pregnancies |
| `livingChildren` | Int | Number of living children |

### 4.2 Diagnoses

Multiple diagnoses per patient (`patient_diagnoses` table):

| Field | Type | Options |
|-------|------|---------|
| `diagnosis` | Enum | PCOS, ANOVULATION, ENDOMETRIOSIS, TUBAL_FACTOR, FIBROID, UTERINE_FACTOR, UNEXPLAINED, RECURRENT_MISCARRIAGE, AZOOSPERMIA, PGS_ACGH, PGD, GENDER_SELECTION, KLINEFELTER_SYNDROME, MALE_FACTOR, DOR, OTHER |
| `notes` | Text | Free text details |
| `diagnosedAt` | DateTime | Auto-set to now |

### Important
- Both wife and husband should have their **own medical history** and **own diagnoses** recorded
- Male factor diagnoses (AZOOSPERMIA, MALE_FACTOR, KLINEFELTER_SYNDROME) go on the husband
- Female factor diagnoses (PCOS, ENDOMETRIOSIS, DOR, etc.) go on the wife

### Next step
**→ Order initial investigations (lab tests, semen analysis, etc.)**

---

## 5. Step 3: Investigations & Workup

### Who performs this
**Consultant Doctor** orders → **Lab Technician** performs → **Doctor** reviews results

### Where
Investigations tab on Patient Detail → `/investigations`

### 5.1 Types of Investigations

| Type | What it tests | Who performs |
|------|---------------|-------------|
| `SEMEN_ANALYSIS` | Sperm count, motility, morphology | Lab Technician |
| `HORMONAL` | FSH, LH, AMH, Prolactin, TSH, Estradiol | Lab Technician |
| `INFECTION_SCREENING` | HIV, HBV, HCV, VDRL, Chlamydia, Gonorrhea | Lab Technician |
| `GENETIC` | Karyotype, CFTR, Y-chromosome microdeletion | External lab |
| `LAPAROSCOPY` | Diagnostic surgical procedure | Consultant |
| `HSG` | Tubal patency test | Specialist/Sonographer |
| `ULTRASOUND` | Pelvic ultrasound, AFC, uterine评估 | Sonographer |
| `OTHER` | Any other test | Varies |

### 5.2 Entity: Investigation

| Field | Type | Notes |
|-------|------|-------|
| `patientId` | UUID | FK → Patient (which partner) |
| `type` | Enum | InvestigationType |
| `date` | DateTime | When test was done |
| `results` | JSON | Flexible key-value results (different per type) |
| `reportFile` | String | URL to attached PDF/report |
| `notes` | String | Free text |
| `isAbnormal` | Boolean | Flag for abnormal results |
| `orderedById` | UUID | FK → User (doctor who ordered it) |

### Typical pre-cycle workup
For the **wife**:
- Hormonal profile (Day 2–3 FSH, LH, E2, AMH)
- Pelvic ultrasound / AFC (Antral Follicle Count)
- Infection screening
- HSG (if tubal factor suspected)
- Genetic testing (if indicated)

For the **husband**:
- Semen analysis (at least 2 samples, 2–4 weeks apart)
- Infection screening
- Genetic testing (if severe male factor)

### Decision point
Based on investigation results, the consultant decides:
- **Recommended ART type**: ICSI, IVF, IUI, FET, or NATURAL
- **Need for PGD/PGS**: If genetic condition suspected
- **Need for donor gametes**: If severe male/female factor
- **Need for surrogacy**: If uterine factor

### Next step
**→ Create a new treatment Cycle**

---

## 6. Step 4: Cycle Initiation

### Who performs this
**Consultant Doctor** (or Specialist/Admin)

### Where
`/cycles/new` → `CycleCreate.tsx`

### What is captured

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `coupleId` | UUID | ✅ | Select from linked couples |
| `artType` | Enum | ✅ | ICSI, IVF, IUI, FET, NATURAL |
| `cycleNumber` | Int | ✅ | Auto-incremented per couple |
| `pgdType` | Enum | | PGS, PGD, NONE |
| `pgdGene` | String | | If PGD — gene name |
| `pgdMutation` | String | | If PGD — specific mutation |
| `pgdInheritanceMode` | String | | Autosomal dominant/recessive, X-linked |
| `pgdMarkers` | String | | Linked markers for PGD |
| `pgdTestMethod` | String | | PCR, NGS, Array-CGH, FISH |
| `pgdFemaleDiagnosis` | String | | Female carrier diagnosis |
| `pgdMaleDiagnosis` | String | | Male carrier diagnosis |
| `stimulationProtocol` | String | | e.g., "Antagonist", "Agonist Long", "Agonist Short", "Natural", "Mild" |
| `stimulationDrugs` | JSON | | Array of `{name, dosage, unit, startDay, endDay}` |
| `treatingPhysicianId` | UUID | | FK → User (responsible doctor) |
| `bmi` | Float | | Wife's BMI at cycle start |
| `cycleWarnings` | String | | e.g., "HEP B PATIENT", "ALLERGIC TO X" |
| `lmp` | DateTime | | Last Menstrual Period (cycle start date) |
| `notes` | String | | General cycle notes |

### Status progression
When a cycle is created, its status is set to:

**`UNDER_STIMULATION`** — the cycle is active and stimulation has begun

### PGD/PGS decision flow
```
                     ┌──────────────┐
                     │ Any genetic  │
                     │ indication?  │
                     └──────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              │ YES                       │ NO
              ▼                           ▼
         ┌──────────────┐          ┌──────────────┐
         │ PGD or PGS?  │          │ pgdType =    │
         │              │          │ "NONE"       │
         └──────┬───────┘          └──────────────┘
                │
      ┌─────────┴──────────┐
      │ PGD               │ PGS
      ▼                    ▼
 ┌──────────┐        ┌──────────┐
 │ pgdType  │        │ pgdType  │
 │ = "PGD"  │        │ = "PGS"  │
 └──────────┘        └──────────┘
```

### Cycle number rules
- `cycleNumber` auto-increments per couple
- Cycle 1 is the first treatment cycle
- FET (Frozen Embryo Transfer) cycles are numbered sequentially too
- Cancelled cycles are still counted (no reuse of cycle numbers)

### Drugs/Protocols (JSON structure in `stimulationDrugs`)

```json
[
  { "name": "Gonal-F", "dosage": 300, "unit": "IU", "startDay": 2, "endDay": 12 },
  { "name": "Cetrotide", "dosage": 0.25, "unit": "mg", "startDay": 6, "endDay": 12 },
  { "name": "Ovitrelle", "dosage": 250, "unit": "mcg", "startDay": 13, "endDay": null }
]
```

### Key date placeholders set at cycle creation
- `hcgDate` — Date of HCG trigger shot (set when scheduled)
- `opuDate` — Date of oocyte retrieval (set when scheduled)
- `etDate` — Date of embryo transfer (set when scheduled)

### Next step
**→ Daily follicle tracking during stimulation phase**

---

## 7. Step 5: Stimulation Phase (Follicle Tracking)

### Who performs this
**Sonographer** records → **Consultant/Specialist** reviews

### Where
Cycle Detail → Follicle Tracking tab

### When
Days 5–14 of stimulation (typically 8–12 days of monitoring)

### What is captured per day

| Field | Type | Notes |
|-------|------|-------|
| `cycleId` | UUID | FK → Cycle |
| `dayNumber` | Int | Stimulation day (1–14) |
| `date` | DateTime | Date of ultrasound |
| `rightOvary` | JSON | Array of follicle sizes: `[{size: 18, count: 3}, {size: 16, count: 2}]` |
| `leftOvary` | JSON | Same structure as right ovary |
| `endometrium` | String | e.g., "Triple-line 10mm", "Not visualized" |
| `notes` | String | Free text |
| `recordedById` | UUID | FK → User (sonographer) |

### JSON structure for ovary data

```json
{
  "follicles": [
    { "size": 18, "count": 3 },
    { "size": 16, "count": 2 },
    { "size": 14, "count": 4 }
  ],
  "ovarianVolume": "Normal",
  "cyst": false,
  "cystNotes": null
}
```

### Timeline of a typical stimulation

```
Day 2-3:  Baseline ultrasound → Start stimulation meds
Day 5:    First monitoring scan
Day 7:    Second monitoring scan
Day 9:    Third monitoring scan
Day 11:   Follicles mature (18-22mm) → HCG trigger
Day 13:   OPU (36 hours after trigger)
```

### Decision point
When leading follicles reach **18–22mm** and endometrium is adequate:
→ **Schedule HCG trigger** → Updates `hcgDate` on Cycle
→ **Schedule OPU** → Updates `opuDate` on Cycle
→ **Cycle status updates** to `OPU_SCHEDULED`

### Next step
**→ Oocyte Retrieval (OPU)**

---

## 8. Step 6: Oocyte Retrieval (OPU)

### Who performs this
**Fertility Specialist** performs procedure → **Embryologist** receives oocytes → **Nurse** assists

### Where
Cycle Detail → OPU tab

### When
34–36 hours after HCG trigger

### What is captured

| Field | Type | Notes |
|-------|------|-------|
| `cycleId` | UUID | FK → Cycle (unique — one OPU per cycle) |
| `anaesthesiaType` | String | e.g., "IV Sedation", "General", "Local" |
| `follicleCount` | Int | Total follicles aspirated |
| `oocyteCount` | Int | Total oocytes retrieved |
| `miiOocyteCount` | Int | Mature oocytes (Metaphase II) — important for ICSI |
| `operationNotes` | Text | Procedure notes |
| `complications` | Text | Any complications during retrieval |
| `postOpPlan` | Text | Post-operative instructions |
| `performedById` | UUID | FK → User (specialist who performed) |

### Validation
- One OPU cycleId — only **one OPU record per cycle**
- `oocyteCount >= miiOocyteCount` (can't have more mature oocytes than total)

### Status update
After OPU is recorded → Cycle status advances to **`OPU_COMPLETED`**

### What the embryologist does immediately
- Receives follicular fluid from the specialist
- Identifies and isolates oocytes under microscope
- Counts total oocytes and grades maturity
- Places oocytes in culture media (incubator)
- Notes: **MII oocytes are ready for ICSI**; MI and GV oocytes need more culture time

### Next step
**→ Semen collection and preparation (for ICSI/IVF)**

---

## 9. Step 7: Semen Collection & Preparation

### Who performs this
**Husband** provides sample → **Embryologist** or **Lab Technician** processes

### Where
Cycle Detail → Semen Data tab

### When
Day of OPU (same day as oocyte retrieval)

### What is captured

| Field | Type | Notes |
|-------|------|-------|
| `cycleId` | UUID | FK → Cycle |
| `patientId` | UUID | FK → Patient (male partner) |
| `specimenType` | String | "Ejaculate", "TESA", "PESA", "MESA", "Donor", "Frozen" |
| `processingMethod` | String | "Swim-Up", "Density Gradient", "Wash", "None (ICSI)" |
| `collectionDate` | DateTime | |
| `abstinenceDays` | Int | |
| `preVolume` | Float | mL (pre-processing) |
| `preConcentration` | Float | million/mL (pre-processing) |
| `preProgressiveMotility` | Float | % (pre-processing) |
| `preMorphology` | Float | % normal forms (Kruger strict criteria) |
| `postVolume` | Float | mL (post-processing) |
| `postConcentration` | Float | million/mL (post-processing) |
| `postProgressiveMotility` | Float | % (post-processing) |

### Processing methods
| Method | Best for | What it does |
|--------|----------|-------------|
| **Swim-Up** | Normal semen samples | Motile sperm swim up into culture media |
| **Density Gradient** | Suboptimal samples | Centrifugation separates sperm from debris |
| **Wash** | Simple wash | Centrifuge + resuspend in media |
| **None (ICSI)** | Severe male factor | Oocytes injected directly — only a few sperm needed |

### Multiple samples per cycle
- Some cycles may have multiple semen analyses (e.g., backup frozen sample)
- Each is a separate `SemenDatum` record linked to the same cycle

### Next step
**→ Embryology Lab — ICSI, Fertilization, and Embryo Development**

---

## 10. Step 8: Embryology Lab (Days 0–7)

### Who performs this
**Embryologist** — this is the most intensive lab phase

### Where
Cycle Detail → Embryology tab

### 10.1 Day 0 — OPU Day: ICSI

If ART type is **ICSI** → embryologist performs intracytoplasmic sperm injection

| Field | Type | Notes |
|-------|------|-------|
| `cycleId` | UUID | FK → Cycle |
| `dayNumber` | Enum | "D0" |
| `embryoCount` | Int | Number of oocytes injected |
| `icsiMethod` | String | "Conventional ICSI", "Piezo ICSI", "IMSI" |
| `icsiPerformedById` | UUID | FK → User (embryologist) |
| `details` | JSON | See below |
| `notes` | String | |

**details JSON structure (D0)**:
```json
{
  "oocytesInjected": 8,
  "degeneratedOocytes": 1,
  "survivalRate": "87.5%",
  "icsiNotes": "All MII oocytes injected. 1 degenerated post-ICSI."
}
```

### 10.2 Day 1 — Fertilization Check

16–18 hours post-ICSI → check for fertilization (2 pronuclei)

**details JSON**:
```json
{
  "totalOocytes": 8,
  "fertilized2PN": 6,
  "abnormalFertilization": 1,
  "unfertilized": 1,
  "fertilizationRate": "75%"
}
```

### 10.3 Days 2–6 — Embryo Development & Grading

Daily grading of each embryo:

**details JSON (D5 example)**:
```json
{
  "embryos": [
    {
      "embryoNumber": 1,
      "grade": "AA",
      "stage": "Expanded Blastocyst",
      "expansion": 4,
      "innerCellMass": "A",
      "trophectoderm": "A",
      "fragmentation": "<5%",
      "cellCount": null,
      "quality": "Excellent"
    },
    {
      "embryoNumber": 2,
      "grade": "BB",
      "stage": "Early Blastocyst",
      "expansion": 2,
      "innerCellMass": "B",
      "trophectoderm": "B",
      "fragmentation": "10-20%",
      "cellCount": null,
      "quality": "Good"
    },
    {
      "embryoNumber": 3,
      "grade": "CC",
      "stage": "Morula",
      "expansion": null,
      "innerCellMass": "C",
      "trophectoderm": "C",
      "fragmentation": ">30%",
      "cellCount": 16,
      "quality": "Poor"
    }
  ]
}
```

### Embryo grading scales

**Cleavage stage (D2–D3)**:
| Grade | Cell Count | Fragmentation | Symmetry |
|-------|-----------|---------------|----------|
| A (Excellent) | 4–6 cells D2, 7–9 cells D3 | <10% | Equal |
| B (Good) | 2–4 cells D2, 6–8 cells D3 | 10–20% | Slightly uneven |
| C (Fair) | Any | 20–30% | Uneven |
| D (Poor) | Any | >30% | Very uneven |

**Blastocyst stage (D5–D6) - Gardner grading**:
| Grade | Expansion | ICM | TE |
|-------|-----------|-----|-----|
| AA | 3–5 | A (Tight, many cells) | A (Many cells, cohesive) |
| BB | 3–5 | B (Loose, few cells) | B (Few cells, loose) |
| CC | 3–5 | C (Very few cells) | C (Very few cells) |

### Daily record
Every day from D0 to D7 (or until all embryos are transferred/cryopreserved/discarded), a new `EmbryologyRecord` is created.

### Day 5/6 — Decision point
- **Best embryos** → Transfer (fresh ET on Day 5)
- **Good quality remaining** → Cryopreserve (vitrify)
- **Poor quality / arrested** → Discard (with consent)

### Next step (if PGD/PGS)
**→ Biopsy and genetic testing** (before freezing)

### Next step (if no genetic testing)
**→ Embryo Transfer (ET)**

---

## 11. Step 9: Biopsy, PGD/PGS & NGS

### Who performs this
**Embryologist** performs biopsy → **External lab** runs NGS → **Embryologist** records results

### Where
Cycle Detail → Biopsy/NGS tab

### 11.1 Embryo Biopsy

Performed on D5/D6 blastocysts before vitrification.

| Field | Type | Notes |
|-------|------|-------|
| `cycleId` | UUID | FK → Cycle |
| `embryoNumber` | Int | Which embryo is biopsied |
| `biopsyDate` | DateTime | |
| `biopsyType` | Enum | "POLAR_BODY", "BLASTOMERE", "TROPHECTODERM" |
| `cellsRemoved` | Int | Number of cells biopsied |
| `labNotes` | String | |
| `performedById` | UUID | FK → User (embryologist) |

### Biopsy types
| Type | When | Cells | Used for |
|------|------|-------|----------|
| Polar Body | D0/D1 | 1–2 | Maternal genetic defects only |
| Blastomere | D3 | 1–2 | PGD for single gene disorders |
| Trophectoderm | D5/D6 | 3–6 | PGS/Aneuploidy screening (most common) |

### 11.2 NGS Results

Received from external genetics lab (typically 2–4 weeks).

| Field | Type | Notes |
|-------|------|-------|
| `embryoBiopsyId` | UUID | FK → EmbryoBiopsy |
| `embryoNumber` | Int | Matches the biopsied embryo |
| `result` | Enum | "EUPLOID", "ANEUPLOID", "MOSAIC", "FAILED", "PENDING" |
| `chromosomeDetails` | JSON | `[{chromosome: 21, status: "Trisomy"}]` |
| `reportFile` | String | URL to uploaded PDF |
| `notes` | String | |
| `reportedById` | UUID | FK → User |

### Result interpretation
| Result | Meaning | Action |
|--------|---------|--------|
| **EUPLOID** | Normal chromosomes | Can be transferred |
| **ANEUPLOID** | Abnormal chromosomes | Should NOT be transferred (discard or research) |
| **MOSAIC** | Some cells normal, some abnormal | Discuss with patient — may be transferred as last resort |
| **FAILED** | No result obtained | May need re-biopsy |
| **PENDING** | Awaiting results | Embryo remains frozen |

### Clinical decision
- **Euploid embryos** → Prioritized for transfer
- **PGD embryos** → Only embryos without the genetic condition are transferred
- **Remaining** → Remain vitrified or discarded per patient consent

### Next step
**→ Frozen Embryo Transfer (FET) or fresh Embryo Transfer**

---

## 12. Step 10: Embryo Transfer (ET)

### Who performs this
**Fertility Specialist** performs transfer → **Embryologist** prepares embryos → **Witness** verifies

### Where
Cycle Detail → ET tab

### When
- **Fresh ET**: Day 5 after OPU (blastocyst stage)
- **FET**: In a subsequent cycle (natural or medicated endometrial preparation)

### What is captured

| Field | Type | Notes |
|-------|------|-------|
| `cycleId` | UUID | FK → Cycle (unique — one ET per cycle) |
| `etDate` | DateTime | Transfer date |
| `catheterType` | String | e.g., "Soft", "Frydman", "Wallace", "Cook" |
| `catheterBrand` | String | |
| `transferredEmbryos` | JSON | Array of transferred embryos — see below |
| `residueEmbryos` | String | Any embryos left in catheter |
| `notes` | String | Transfer difficulty, comments |
| `physicianId` | UUID | FK → User (doctor performing transfer) |
| `embryologistId` | UUID | FK → User (embryologist preparing) |
| `witnessId` | UUID | FK → User (second person verifying) |

### Transferred embryos JSON structure

```json
{
  "transferredEmbryos": [
    {
      "embryoNumber": 1,
      "quality": "AA",
      "stage": "Expanded Blastocyst",
      "day": "D5"
    },
    {
      "embryoNumber": 2,
      "quality": "AB",
      "stage": "Hatching Blastocyst",
      "day": "D5"
    }
  ],
  "numberTransferred": 2,
  "catheterCheck": "Clean — no retained embryos",
  "difficulty": "Easy"
}
```

### Witness requirement
- The witness is **mandatory** for legal and safety reasons
- They verify: patient identity → embryo identity → number of embryos loaded → proper transfer
- Only the ET record should not be editable without creating an audit trail

### Status update
After ET is recorded → Cycle status advances to **`ET_COMPLETED`**

### What happens to remaining embryos
- **Good quality** → Cryopreserved (see Step 11)
- **Poor quality** → Extended culture to D6/D7, then discarded if not usable
- **Biopsied** → Frozen awaiting NGS results, then discarded/transferred based on results

### Next step
**→ Cryopreservation of remaining embryos** (if any) **AND**
**→ Pregnancy Test (14 days post-ET)**

---

## 13. Step 11: Cryopreservation

### Who performs this
**Embryologist** vitrifies → Stores in **CryoTank**

### Where
Cycle Detail → Cryo tab / Cryo Dashboard

### When
- Immediately after ET (same day — remaining good quality embryos)
- After NGS results (euploid embryos)

### 13.1 CryoTank Management

First, tanks must be defined:

| Field | Type | Notes |
|-------|------|-------|
| `name` | String | e.g., "Tank A", "LN2 Tank 3" |
| `location` | String | Physical location in lab |
| `capacity` | Int | Max number of straws |
| `currentCount` | Int | Auto-updated |
| `fillLevel` | Float | Liquid nitrogen level % |
| `lastChecked` | DateTime | Last maintenance check |
| `isActive` | Boolean | |

### 13.2 Embryo Cryopreservation

| Field | Type | Notes |
|-------|------|-------|
| `cycleId` | UUID | FK → Cycle (source cycle) |
| `embryoNumber` | Int | Original embryo number |
| `freezeDate` | DateTime | |
| `tankId` | UUID | FK → CryoTank |
| `partition` | String | e.g., "Shelf A", "Rack 2" |
| `level` | String | e.g., "Level 3" |
| `goblet` | String | e.g., "Goblet 5" |
| `containerColor` | String | e.g., "Blue", "Yellow" (for visual ID) |
| `protocol` | String | "Vitrification", "Slow Freeze" |
| `media` | String | e.g., "Kitazato", "Irvine Scientific" |
| `strawDetails` | String | Straw identifier |
| `renewalDate` | DateTime | Annual storage renewal (auto-calc 1 year from freeze) |
| `status` | Enum | "STORED" (default), "USED", "TRANSFERRED", "DISCARDED", "EXPIRED" |
| `notes` | String | |

### 13.3 Sperm / Oocyte Cryopreservation

Same pattern as embryo cryo but linked to `patientId` instead of `cycleId`.

### 13.4 Storage location hierarchy

```
CryoTank
  └── Partition (Shelf/Rack)
       └── Level
            └── Goblet / Straw
                 └── Embryo / Sperm / Oocyte
```

### 13.5 Expiry and renewal

- **Renewal date** = freeze date + 1 year (default)
- System auto-generates **tasks** of type `EXPIRY_NOTIFICATION` 30 days before renewal
- If not renewed → status changes to `EXPIRED` → embryos may be discarded per consent

### 13.6 Using frozen embryos (FET)

When patient returns for FET:
1. Embryo is located by Tank → Partition → Level → Goblet
2. Thawed in lab
3. If survives → transferred in FET cycle
4. Status updated from `STORED` → `USED`

### Next step (if not cryo)
**→ Pregnancy Test**

---

## 14. Step 12: Pregnancy Test

### Who performs this
**Consultant Doctor** orders → **Nurse** draws blood → **Lab** runs B-hCG

### Where
Cycle Detail → Pregnancy tab

### When
14 days after ET (Day 14 post-ET)

### What is captured

| Field | Type | Notes |
|-------|------|-------|
| `cycleId` | UUID | FK → Cycle (unique) |
| `bhcgLevel` | Float | B-hCG level in mIU/mL |
| `testDate` | DateTime | |

### Interpreting B-hCG levels

| Level (mIU/mL) | Interpretation |
|----------------|---------------|
| < 5 | **Negative** — not pregnant |
| 5–25 | **Borderline** — repeat test in 48 hours |
| 25–100 | **Early positive** — repeat in 48 hours (should double) |
| 100–1000 | **Positive** — doubling indicates viable pregnancy |
| > 1000 | **Strong positive** — schedule ultrasound |
| > 5000 (no doubling) | **Ectopic / miscarriage** — investigate |

### Status update
- **Positive** (`bhcgLevel > 25`) → Cycle status → **`PREGNANCY_CONFIRMED`**
- **Negative** (`bhcgLevel < 5`) → Cycle status → **`CYCLE_COMPLETED`**

### Next step
**→ Pregnancy Outcome** (if positive) **OR**
**→ Counselling for next cycle** (if negative)

---

## 15. Step 13: Pregnancy Outcome

### Who performs this
**Consultant Doctor** records outcome

### Where
Cycle Detail → Pregnancy Outcome tab

### When
- After first trimester ultrasound (viability scan at 6–8 weeks)
- After delivery (if ongoing pregnancy)

### What is captured

| Field | Type | Notes |
|-------|------|-------|
| `cycleId` | UUID | FK → Cycle (unique) |
| `outcome` | String | e.g., "Ongoing", "Live Birth", "Miscarriage", "Ectopic", "Stillbirth", "Termination" |
| `deliveryDate` | DateTime | |
| `weight` | Float | kg (for live births) |
| `height` | Float | cm |
| `anomalies` | String | Any congenital anomalies |
| `notes` | String | |

### Outcome types
| Outcome | Description |
|---------|-------------|
| **Ongoing** | Pregnancy continues beyond first trimester (used for interim tracking) |
| **Live Birth** | Successful delivery of live baby(ies) — final success metric |
| **Miscarriage** | Pregnancy loss before 20 weeks |
| **Ectopic** | Implantation outside uterus |
| **Stillbirth** | Fetal loss after 20 weeks |
| **Termination** | Elective termination for medical or personal reasons |

### Status update
Cycle status advances to **`CYCLE_COMPLETED`**

---

## 16. Step 14: Cycle Completion

### What happens at the end

The cycle status is set to **`CYCLE_COMPLETED`** in two scenarios:
1. Negative pregnancy test
2. Pregnancy outcome recorded (delivery, miscarriage, etc.)

### What remains active after completion

- **Cryopreserved embryos** remain in storage (linked to the completed cycle)
- Patient can return for **FET** (Frozen Embryo Transfer) in a new cycle
- **Invoices** may still need to be paid
- **Tasks** may still be pending (e.g., follow-up counselling)

### New cycle possibilities

After completion, the couple can start a new cycle:
- **Fresh cycle**: New stimulation, OPU, etc.
- **FET cycle**: Uses cryopreserved embryos from a previous cycle
  - No stimulation, OPU, or embryology needed
  - Only endometrial preparation + embryo thaw + transfer

---

## 17. Supporting Flows

### 17.1 Appointments

Appointments are created **throughout** the patient journey — not just at one step.

| Stage | Appointment type | Scheduled with |
|-------|-----------------|----------------|
| Pre-cycle | Initial consultation | Consultant |
| Pre-cycle | Counselling session | Counsellor |
| During stimulation | Follicle tracking ultrasound | Sonographer |
| OPU day | Oocyte retrieval | Specialist |
| ET day | Embryo transfer | Specialist |
| Post-ET | Pregnancy test blood draw | Nurse |
| Post-cycle | Results consultation | Consultant |
| Ongoing pregnancy | Obstetric follow-up | Consultant |

**Appointment entity**:

| Field | Type | Notes |
|-------|------|-------|
| `patientId` | UUID | FK → Patient |
| `physicianId` | UUID | FK → User (staff member) |
| `service` | String | e.g., "Follicle Tracking US", "Consultation" |
| `clinicId` | UUID | FK → Clinic (room/location) |
| `startTime` | DateTime | |
| `endTime` | DateTime | |
| `status` | Enum | SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW |
| `notes` | String | |

### 17.2 Billing & Invoicing

Billing happens at multiple points:

| Phase | What is billed | Who bills |
|-------|---------------|-----------|
| Registration | Registration fee | Reception |
| Pre-cycle | Initial workup (lab tests) | Billing |
| Cycle start | Stimulation medications | Billing |
| OPU | OPU procedure fee | Billing |
| Embryology | ICSI, biopsy, NGS fees | Billing |
| ET | Transfer fee | Billing |
| Cryo | Storage fees (annual) | Billing (auto) |
| Post-cycle | Delivery/pregnancy care | Billing |

**Invoice workflow**:
1. Service provided → Invoice created (DRAFT)
2. Invoice finalized → Status: SENT
3. Payment received → Recorded against invoice
4. Invoice status updates: PAID, PARTIALLY_PAID, or OVERDUE

### 17.3 Tasks & Reminders

Tasks are auto-generated or manually created throughout:

| Task Type | Trigger | Assigned to |
|-----------|---------|-------------|
| `FOLLOW_UP_CALL` | Post-OPU / Post-ET follow-up | Nurse |
| `EMBRYO_DISPOSAL` | Patient consent for discarding | Embryologist |
| `GAMETE_REMINDER` | Renewal date approaching (30 days) | Embryologist |
| `EXPIRY_NOTIFICATION` | Cryo storage about to expire | Embryologist/Admin |
| `GENERAL` | Any ad-hoc task | Any role |

### 17.4 Cycle Cancellation

A cycle may be cancelled at any stage:

| Stage | Common reason |
|-------|--------------|
| During stimulation | Poor response, risk of OHSS |
| After OPU | No oocytes retrieved |
| After fertilization | No fertilization occurred |
| Before ET | No viable embryos |
| After positive pregnancy | Miscarriage |

When cancelled → Status set to `CYCLE_CANCELLED`
Cancelled cycles are counted in `cycleNumber` (no reuse)

### 17.5 Prescriptions

Throughout the cycle, medications are prescribed:

| Phase | Common medications |
|-------|-------------------|
| Stimulation | Gonal-F, Menopur, Cetrotide, Orgalutran |
| Trigger | Ovitrelle, Pregnyl, Lupron |
| Luteal support | Progesterone (injection/suppository), Estrace |
| FET prep | Estrogen patches, Progesterone |
| Post-OPU | Antibiotics (prophylactic) |

**Prescription entity fields**:
`medicationName`, `dosage`, `frequency`, `route`, `duration`, `startDate`, `endDate`, `refills`, `instructions`, `diagnosis`, `status`

---

## 18. Complete Staff Responsibility Map

| Step | Staff Role | Action |
|------|-----------|--------|
| **Registration** | Receptionist / Admin / Nurse | Enter patient demographics |
| **Couple Linking** | Consultant / Admin | Link wife + husband patients |
| **Medical History** | Consultant / Specialist | Record OB/GYN history, surgical history |
| **Diagnoses** | Consultant / Specialist | Assign diagnosis codes |
| **Investigations Order** | Consultant / Specialist | Order lab tests, semen analysis |
| **Investigations Perform** | Lab Technician / Sonographer | Draw blood, perform US, process semen |
| **Investigations Review** | Consultant / Specialist | Review results, plan treatment |
| **Cycle Initiation** | Consultant / Specialist | Set ART type, protocol, drugs |
| **Follicle Tracking** | Sonographer | Daily ultrasound measurements |
| **Stimulation Review** | Consultant / Specialist | Review follicle growth, decide trigger |
| **OPU** | Specialist (+ Nurse assist) | Oocyte retrieval procedure |
| **Semen Processing** | Embryologist / Lab Tech | Prepare sperm for ICSI/IVF |
| **ICSI** | Embryologist | Inject sperm into oocyte |
| **Embryo Culture** | Embryologist | Daily grading Days 1–7 |
| **Biopsy** | Embryologist | Remove cells for genetic testing |
| **NGS Results** | Embryologist | Record genetic results |
| **ET** | Specialist + Embryologist + Witness | Transfer embryo(s) |
| **Cryopreservation** | Embryologist | Vitrify remaining embryos |
| **Cryo Tank Mgmt** | Embryologist | Monitor tanks, LN2 levels |
| **Pregnancy Test** | Nurse (draw) + Lab (process) | B-hCG blood test |
| **Pregnancy Outcome** | Consultant / Specialist | Record delivery/outcome |
| **Appointments** | Receptionist / Nurse | Book all appointments |
| **Billing** | Billing Officer | Create invoices, process payments |
| **Tasks** | All roles | Create and complete tasks |
| **Reports/KPIs** | Consultant / Admin | Review success rates, analytics |

---

## 19. Entity Relationship Flow Diagram

```
Patient (Wife)
     │
     ├── PatientMedicalHistory (1:1)
     ├── PatientDiagnosis (1:N)
     ├── Investigation (1:N)
     │
     └── Couple (as wifePatientId)
              │
              ├── Patient (Husband) ─── PatientMedicalHistory (1:1)
              │                              ├── PatientDiagnosis (1:N)
              │                              └── Investigation (1:N)
              │
              └── Cycle (1:N)
                      │
                      ├── FollicleTracking (1:N)
                      ├── OPURecord (1:1)
                      ├── SemenDatum (1:N)
                      ├── EmbryologyRecord (1:N)
                      ├── EmbryoBiopsy (1:N) ── NGSReport (1:1)
                      ├── ETRecord (1:1)
                      ├── EmbryoCryo (1:N) ── CryoTank (N:1)
                      ├── PregnancyTest (1:1)
                      ├── PregnancyOutcome (1:1)
                      ├── Prescription (1:N)
                      └── Task (1:N) ── AssignedTo User
```

### Entity counts per typical cycle

| Entity | Typical count |
|--------|---------------|
| Patients (per couple) | 2 (wife + husband) |
| Cycles (per couple) | 1–5+ |
| FollicleTrackings | 3–6 (per stimulation cycle) |
| OPURecords | 1 (per stimulation cycle) |
| SemenData | 1–2 (per cycle) |
| EmbryologyRecords | 3–7 (D0 through D5/D6) |
| EmbryoBiopsies | 1–10 (per biopsied embryo) |
| NGSReports | 1–10 (per biopsied embryo) |
| ETRecords | 1 (per cycle or FET) |
| EmbryoCryo | 0–10 (remaining embryos) |
| PregnancyTests | 1–2 (initial + repeat if borderline) |
| PregnancyOutcomes | 1 (if positive) |
| Invoices | 2–5 (per cycle, different services) |
| Appointments | 5–15 (per cycle) |
| Prescriptions | 2–8 (per cycle) |
| Tasks | 3–10 (auto-generated + manual) |

---

> **Document Version:** 1.0.0
> **Last Updated:** June 2026
> **Author:** System Architecture Team
> **Next Steps:** Build missing frontend pages → Connect to existing backend APIs → Add FET flow support → Implement auto-task generation
