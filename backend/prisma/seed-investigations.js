import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Sample Patients Data ───────────────────────────────────────
const SAMPLE_PATIENTS = [
  {
    mrn: "LSW-T-1001",
    firstName: "Sarah",
    lastName: "Johnson",
    dateOfBirth: new Date("1990-03-15"),
    gender: "FEMALE",
    phone: "+971501234001",
    email: "sarah.johnson@email.com",
    nationality: "British",
    city: "Dubai",
    branch: "Main Branch — Dubai Healthcare City",
  },
  {
    mrn: "LSW-T-1002",
    firstName: "Aisha",
    lastName: "Al Maktoum",
    dateOfBirth: new Date("1988-07-22"),
    gender: "FEMALE",
    phone: "+971501234002",
    email: "aisha.almaktoum@email.com",
    nationality: "UAE",
    city: "Abu Dhabi",
    branch: "Abu Dhabi — Khalifa City",
  },
  {
    mrn: "LSW-T-1003",
    firstName: "Fatima",
    lastName: "Hassan",
    dateOfBirth: new Date("1992-11-08"),
    gender: "FEMALE",
    phone: "+971501234003",
    email: "fatima.hassan@email.com",
    nationality: "Egyptian",
    city: "Dubai",
    branch: "Main Branch — Dubai Healthcare City",
  },
  {
    mrn: "LSW-T-1004",
    firstName: "Emily",
    lastName: "Chen",
    dateOfBirth: new Date("1985-05-30"),
    gender: "FEMALE",
    phone: "+971501234004",
    email: "emily.chen@email.com",
    nationality: "Chinese",
    city: "Sharjah",
    branch: "Sharjah — Al Qasimia",
  },
  {
    mrn: "LSW-T-1005",
    firstName: "Layla",
    lastName: "Omar",
    dateOfBirth: new Date("1991-09-14"),
    gender: "FEMALE",
    phone: "+971501234005",
    email: "layla.omar@email.com",
    nationality: "Jordanian",
    city: "Dubai",
    branch: "Dubai — Al Barsha",
  },
];

// ── Investigation Type Constants ────────────────────────────────

const HORMONAL_NORMAL = {
  fsh: { value: 6.4, unit: "mIU/mL", range: "3.5–12.5" },
  lh: { value: 5.2, unit: "mIU/mL", range: "2.4–12.6" },
  e2: { value: 45, unit: "pg/mL", range: "12.5–166" },
  p4: { value: 0.8, unit: "ng/mL", range: "0.15–1.4" },
  amh: { value: 3.2, unit: "ng/mL", range: "1.0–4.0" },
  prolactin: { value: 12, unit: "ng/mL", range: "4.8–23.3" },
  tsh: { value: 2.1, unit: "mIU/L", range: "0.4–4.0" },
  testosterone: { value: 0.8, unit: "nmol/L", range: "0.3–1.9" },
};

const HORMONAL_ABNORMAL = {
  fsh: { value: 18.2, unit: "mIU/mL", range: "3.5–12.5", flag: "HIGH" },
  lh: { value: 14.8, unit: "mIU/mL", range: "2.4–12.6", flag: "HIGH" },
  e2: { value: 28, unit: "pg/mL", range: "12.5–166" },
  p4: { value: 0.5, unit: "ng/mL", range: "0.15–1.4" },
  amh: { value: 0.4, unit: "ng/mL", range: "1.0–4.0", flag: "LOW" },
  prolactin: { value: 8, unit: "ng/mL", range: "4.8–23.3" },
  tsh: { value: 5.8, unit: "mIU/L", range: "0.4–4.0", flag: "HIGH" },
  testosterone: { value: 0.6, unit: "nmol/L", range: "0.3–1.9" },
};

const INVESTIGATIONS = [
  // ── Female Patients ────────────────────────────────────────
  { type: "HORMONAL", label: "Day 3 Hormonal Profile", daysAgo: 14,
    getResults: () => HORMONAL_NORMAL, notes: "Normal ovarian reserve markers", isAbnormal: false, isMale: false },
  { type: "HORMONAL", label: "Day 3 Hormonal Profile", daysAgo: 30,
    getResults: () => HORMONAL_ABNORMAL, notes: "Elevated FSH and LH, low AMH — possible DOR", isAbnormal: true, isMale: false },
  { type: "ULTRASOUND", label: "Pelvic Ultrasound — AFC", daysAgo: 10,
    getResults: () => ({
      rightOvary: { volume: "8.2 mL", afc: 12, dominantFollicle: null, cysts: [] },
      leftOvary: { volume: "7.5 mL", afc: 10, dominantFollicle: null, cysts: [] },
      endometrium: { thickness: "6.5 mm", pattern: "Triple-line" },
      uterus: { position: "Anteverted", myometrium: "Homogeneous", fibroids: [] },
    }), notes: "Normal AFC, both ovaries well visualized", isAbnormal: false, isMale: false },
  { type: "ULTRASOUND", label: "Pelvic Ultrasound — Follicle Count", daysAgo: 45,
    getResults: () => ({
      rightOvary: { volume: "4.1 mL", afc: 3, dominantFollicle: null, cysts: [] },
      leftOvary: { volume: "3.8 mL", afc: 2, dominantFollicle: null, cysts: [] },
      endometrium: { thickness: "4.2 mm", pattern: "Thin" },
      uterus: { position: "Anteverted", myometrium: "Homogeneous", fibroids: [] },
    }), notes: "Low antral follicle count, consistent with DOR", isAbnormal: true, isMale: false },
  { type: "INFECTION_SCREENING", label: "Infection Panel — Female", daysAgo: 60,
    getResults: () => ({
      chlamydia: { result: "Negative", method: "PCR" },
      gonorrhea: { result: "Negative", method: "PCR" },
      hepatitisB: { result: "Negative", method: "Serology" },
      hepatitisC: { result: "Negative", method: "Serology" },
      hiv: { result: "Negative", method: "Serology" },
      rubellaIgG: { value: 25, unit: "IU/mL", range: ">10 positive" },
      toxoplasmosis: { result: "Non-reactive", method: "Serology" },
    }), notes: "All negative, Rubella immune", isAbnormal: false, isMale: false },
  { type: "HSG", label: "Hysterosalpingogram", daysAgo: 90,
    getResults: () => ({
      uterineCavity: { shape: "Normal triangular", fillingDefects: [], synechiae: false },
      rightTube: { patency: "Patent", spillage: "Free", morphology: "Normal" },
      leftTube: { patency: "Patent", spillage: "Free", morphology: "Normal" },
      impression: "Normal uterine cavity, bilateral tubal patency confirmed",
    }), notes: "Both tubes patent, normal uterine cavity", isAbnormal: false, isMale: false },
  { type: "HSG", label: "Hysterosalpingogram", daysAgo: 120,
    getResults: () => ({
      uterineCavity: { shape: "Normal triangular", fillingDefects: [], synechiae: false },
      rightTube: { patency: "Patent", spillage: "Free", morphology: "Normal" },
      leftTube: { patency: "Blocked", spillage: "None", morphology: "Hydrosalpinx noted at distal end" },
      impression: "Left hydrosalpinx — proximal occlusion suspected",
    }), notes: "Left hydrosalpinx identified, consider laparoscopic management", isAbnormal: true, isMale: false },
  { type: "LAPAROSCOPY", label: "Diagnostic Laparoscopy", daysAgo: 180,
    getResults: () => ({
      uterus: { size: "Normal", surface: "Smooth", mobility: "Free" },
      rightTube: { patency: "Patent", appearance: "Normal" },
      leftTube: { patency: "Not patent", appearance: "Hydrosalpinx, dilated ~2cm" },
      rightOvary: { appearance: "Normal, no cysts", adhesions: false },
      leftOvary: { appearance: "Normal", adhesions: "Mild filmy adhesions to pelvic sidewall" },
      peritoneum: { endometriosis: false, adhesions: "Mild" },
      diagnosis: "Left hydrosalpinx with peritubal adhesions, rAFS Stage II",
    }), notes: "Left salpingectomy recommended", isAbnormal: true, isMale: false },
  { type: "GENETIC", label: "Carrier Screening", daysAgo: 200,
    getResults: () => ({
      condition: "Cystic Fibrosis",
      gene: "CFTR",
      mutation: "F508del",
      status: "Carrier (heterozygous)",
      risk: "1 in 25 carrier frequency — partner testing recommended",
    }), notes: "CF carrier — partner should be tested", isAbnormal: false, isMale: false },
  { type: "OTHER", label: "Vitamin D Level", daysAgo: 7,
    getResults: () => ({
      vitaminD: { value: 18, unit: "ng/mL", range: "30–100", flag: "LOW" },
    }), notes: "Vitamin D deficiency — start supplementation", isAbnormal: true, isMale: false },

  // ── Male-related Investigations ─────────────────────────────
  { type: "SEMEN_ANALYSIS", label: "Semen Analysis — Basic", daysAgo: 7,
    getResults: () => ({
      collection: { abstinenceDays: 3, method: "Masturbation", collectionComplete: true },
      macroscopic: { volume: 3.2, unit: "mL", range: "≥1.5", color: "Grey-white", viscosity: "Normal", liquefaction: "Complete at 30 min", pH: 7.6 },
      microscopic: {
        concentration: { value: 55, unit: "million/mL", range: "≥15" },
        totalCount: { value: 176, unit: "million", range: "≥39" },
        motility: { progressive: 42, nonProgressive: 18, immotile: 40, range: "≥32% progressive" },
        morphology: { normal: 6, abnormal: 94, range: "≥4% normal" },
        vitality: { live: 72, dead: 28, range: "≥58% live" },
      },
      interpretation: "Normozoospermia — all parameters within reference ranges",
    }), notes: "Normal semen parameters", isAbnormal: false, isMale: true },
  { type: "SEMEN_ANALYSIS", label: "Semen Analysis — Follow-up", daysAgo: 30,
    getResults: () => ({
      collection: { abstinenceDays: 2, method: "Masturbation", collectionComplete: true },
      macroscopic: { volume: 1.2, unit: "mL", range: "≥1.5", color: "Grey-white", viscosity: "Increased", liquefaction: "Delayed >60 min", pH: 7.4 },
      microscopic: {
        concentration: { value: 8, unit: "million/mL", range: "≥15", flag: "LOW" },
        totalCount: { value: 9.6, unit: "million", range: "≥39", flag: "LOW" },
        motility: { progressive: 18, nonProgressive: 12, immotile: 70, range: "≥32% progressive", flag: "LOW" },
        morphology: { normal: 1, abnormal: 99, range: "≥4% normal", flag: "LOW" },
        vitality: { live: 48, dead: 52, range: "≥58% live", flag: "LOW" },
      },
      interpretation: "Oligoasthenoteratozoospermia — all parameters below reference",
    }), notes: "Severe male factor — ICSI recommended", isAbnormal: true, isMale: true },
];

async function main() {
  console.log("🔬 Seeding investigation data for testing...\n");

  // ── Find or create users ──────────────────────────────────────
  let adminUser = await prisma.user.findUnique({ where: { email: "admin@gmail.com" } });
  if (!adminUser) {
    console.log("   Creating admin user...");
    const adminRole = await prisma.role.findUnique({ where: { name: "ADMIN" } });
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("admin123", salt);
    adminUser = await prisma.user.create({
      data: {
        staffCode: "ADMIN",
        email: "admin@gmail.com",
        password: hashedPassword,
        firstName: "System",
        lastName: "Admin",
        roleId: adminRole.id,
        isActive: true,
      },
    });
  }

  // Find or create a consultant user (for ordering investigations)
  let consultantUser = await prisma.user.findFirst({ where: { role: { name: "CONSULTANT" } } });
  if (!consultantUser) {
    console.log("   Creating consultant user...");
    const consultantRole = await prisma.role.findUnique({ where: { name: "CONSULTANT" } });
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("doctor123", salt);
    consultantUser = await prisma.user.create({
      data: {
        staffCode: "DR-001",
        email: "doctor@fertilityclinic.com",
        password: hashedPassword,
        firstName: "Ahmed",
        lastName: "Rashid",
        roleId: consultantRole.id,
        isActive: true,
      },
    });
  }

  console.log(`   Using admin user: ${adminUser.email}`);
  console.log(`   Using consultant: Dr. ${consultantUser.firstName} ${consultantUser.lastName}\n`);

  // ── Create sample patients if they don't exist ────────────────
  console.log("📋 Creating sample patients...");

  // Also create male patients for couple linking
  const malePatients = [
    {
      mrn: "LSW-T-2001",
      firstName: "Michael",
      lastName: "Johnson",
      dateOfBirth: new Date("1987-06-20"),
      gender: "MALE",
      phone: "+971509994001",
      email: "michael.johnson@email.com",
      nationality: "British",
      city: "Dubai",
      branch: "Main Branch — Dubai Healthcare City",
    },
    {
      mrn: "LSW-T-2002",
      firstName: "Khalid",
      lastName: "Al Maktoum",
      dateOfBirth: new Date("1985-02-14"),
      gender: "MALE",
      phone: "+971509994002",
      email: "khalid.almaktoum@email.com",
      nationality: "UAE",
      city: "Abu Dhabi",
      branch: "Abu Dhabi — Khalifa City",
    },
    {
      mrn: "LSW-T-2003",
      firstName: "Omar",
      lastName: "Hassan",
      dateOfBirth: new Date("1989-08-25"),
      gender: "MALE",
      phone: "+971509994003",
      email: "omar.hassan@email.com",
      nationality: "Egyptian",
      city: "Dubai",
      branch: "Main Branch — Dubai Healthcare City",
    },
  ];

  const createdPatients = [];

  for (const p of [...SAMPLE_PATIENTS, ...malePatients]) {
    const existing = await prisma.patient.findUnique({ where: { mrn: p.mrn } });
    if (existing) {
      createdPatients.push({ id: existing.id, gender: existing.gender, firstName: existing.firstName });
      console.log(`   ✓ ${p.firstName} ${p.lastName} (${p.mrn}) — already exists`);
    } else {
      const patient = await prisma.patient.create({
        data: { ...p, createdById: adminUser.id },
      });
      createdPatients.push({ id: patient.id, gender: patient.gender, firstName: patient.firstName });
      console.log(`   ✅ Created: ${p.firstName} ${p.lastName} (${p.mrn})`);
    }
  }
  console.log(`   Total: ${createdPatients.length} patients`);

  // ── Create couples ────────────────────────────────────────────
  console.log("\n💑 Linking couples...");
  const couples = [
    { wife: SAMPLE_PATIENTS[0], husband: malePatients[0] }, // Sarah + Michael
    { wife: SAMPLE_PATIENTS[1], husband: malePatients[1] }, // Aisha + Khalid
    { wife: SAMPLE_PATIENTS[2], husband: malePatients[2] }, // Fatima + Omar
  ];

  const createdCouples = [];

  for (const couple of couples) {
    const wife = createdPatients.find((p) => p.firstName === couple.wife.firstName);
    const husband = createdPatients.find((p) => p.firstName === couple.husband.firstName);

    if (!wife || !husband) {
      console.log(`   ⚠️  Could not find both partners for ${couple.wife.firstName} + ${couple.husband.firstName}`);
      continue;
    }

    // Check if couple already exists
    const existingCouple = await prisma.couple.findFirst({
      where: { OR: [{ wifePatientId: wife.id }, { husbandPatientId: husband.id }] },
    });

    if (existingCouple) {
      createdCouples.push({ id: existingCouple.id, wifeId: wife.id, husbandId: husband.id });
      console.log(`   ✓ ${wife.firstName} + ${husband.firstName} — already linked`);
    } else {
      const coupleRecord = await prisma.couple.create({
        data: {
          wifePatientId: wife.id,
          husbandPatientId: husband.id,
          infertilityType: "PRIMARY",
          createdById: adminUser.id,
        },
      });
      createdCouples.push({ id: coupleRecord.id, wifeId: wife.id, husbandId: husband.id });
      console.log(`   ✅ Linked: ${wife.firstName} + ${husband.firstName}`);
    }
  }

  // ── Create sample cycles ──────────────────────────────────────
  console.log("\n🔄 Creating sample treatment cycles...");
  const createdCycles = [];

  const cycleStatuses = ["OPU_COMPLETED", "ET_COMPLETED", "PREGNANCY_TEST"];

  for (let i = 0; i < createdCouples.length; i++) {
    const couple = createdCouples[i];
    // Check for existing cycles
    const existingCycles = await prisma.cycle.findMany({
      where: { coupleId: couple.id },
      take: 1,
    });

    if (existingCycles.length > 0) {
      createdCycles.push({ id: existingCycles[0].id, coupleId: couple.id });
      console.log(`   ✓ Couple #${i + 1} — cycle already exists`);
    } else {
      const cycle = await prisma.cycle.create({
        data: {
          coupleId: couple.id,
          cycleNumber: 1,
          artType: "ICSI",
          status: cycleStatuses[i],
          createdById: adminUser.id,
        },
      });
      createdCycles.push({ id: cycle.id, coupleId: couple.id });
      console.log(`   ✅ Created cycle #1 for couple #${i + 1} — ${cycle.status}`);
    }
  }

  // ── Create investigations ─────────────────────────────────────
  console.log("\n🔬 Creating sample investigations...");

  // Assign investigations to patients
  // Patients 0,2,4 (Sarah, Fatima, Layla) + their male partners get investigations
  const investAssignments = [
    { patientIndex: 0, investIndices: [0, 2, 4, 7, 8] },   // Sarah: normal hormones, normal US, normal HSG, carrier screen, vit D
    { patientIndex: 1, investIndices: [1, 3, 5, 6] },       // Aisha: abnormal hormones, low AFC, blocked tube, laparoscopy
    { patientIndex: 2, investIndices: [0, 2, 4, 8] },       // Fatima: normal hormones, normal US, normal HSG, vit D
    { patientIndex: 3, investIndices: [1, 3, 5] },          // Emily: abnormal hormones, low AFC, blocked tube
    { patientIndex: 4, investIndices: [0, 2] },             // Layla: normal hormones, normal US
    // Male partners
    { patientIndex: 5, investIndices: [9, 4] },             // Michael: normal semen + infection screen
    { patientIndex: 6, investIndices: [10, 4] },            // Khalid: abnormal semen + infection screen
    { patientIndex: 7, investIndices: [9, 4] },             // Omar: normal semen + infection screen
  ];

  let totalInvestigations = 0;

  for (const assign of investAssignments) {
    const patient = createdPatients[assign.patientIndex];
    if (!patient) continue;

    for (const idx of assign.investIndices) {
      const template = INVESTIGATIONS[idx];
      if (!template) continue;

      // Check if this investigation already exists (skip duplicates during re-runs)
      const existingCount = await prisma.investigation.count({
        where: { patientId: patient.id, type: template.type },
      });

      if (existingCount > 0) {
        continue; // Skip — already seeded
      }

      const investDate = new Date();
      investDate.setDate(investDate.getDate() - template.daysAgo);

      await prisma.investigation.create({
        data: {
          patientId: patient.id,
          type: template.type,
          date: investDate,
          results: template.getResults(),
          notes: template.notes,
          isAbnormal: template.isAbnormal,
          orderedById: consultantUser.id,
        },
      });
      totalInvestigations++;
    }
  }

  if (totalInvestigations > 0) {
    console.log(`   ✅ Created ${totalInvestigations} new investigation records`);
  } else {
    console.log(`   ✓ Investigations already seeded — skipping`);
  }

  // ── Summary ───────────────────────────────────────────────────
  const totalInv = await prisma.investigation.count();
  const totalPat = await prisma.patient.count();
  const totalCpl = await prisma.couple.count();
  const totalCyc = await prisma.cycle.count();

  console.log(`\n🎉 Seed complete!`);
  console.log(`   Patients: ${totalPat}`);
  console.log(`   Couples: ${totalCpl}`);
  console.log(`   Cycles: ${totalCyc}`);
  console.log(`   Investigations: ${totalInv}`);
  console.log(`\n   Admin login: ADMIN / admin123`);
  console.log(`   Physician login: DR-001 / doctor123`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
