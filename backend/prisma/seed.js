import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ── Default Role Definitions ───────────────────────────────────
const ROLE_DEFINITIONS = [
  { name: "ADMIN", label: "System Admin", hierarchy: 100, isSystem: true },
  { name: "CONSULTANT", label: "Consultant Doctor", hierarchy: 80, isSystem: true },
  { name: "SPECIALIST", label: "Fertility Specialist", hierarchy: 75, isSystem: true },
  { name: "EMBRYOLOGIST", label: "Embryologist", hierarchy: 70, isSystem: true },
  { name: "NURSE", label: "Nurse", hierarchy: 60, isSystem: true },
  { name: "COUNSELLOR", label: "Counsellor", hierarchy: 50, isSystem: true },
  { name: "SONOGRAPHER", label: "Sonographer", hierarchy: 50, isSystem: true },
  { name: "LAB_TECH", label: "Lab Technician", hierarchy: 50, isSystem: true },
  { name: "BILLING", label: "Billing Officer", hierarchy: 40, isSystem: true },
  { name: "RECEPTIONIST", label: "Receptionist", hierarchy: 30, isSystem: true },
  { name: "VIEWER", label: "Viewer (Read-Only)", hierarchy: 10, isSystem: true },
];

// ── Full Permission Definitions ────────────────────────────────
const PERMISSION_DEFINITIONS = [
  // Patient Management
  { key: "patient:register", name: "Register Patient", module: "Patient Management" },
  { key: "patient:view", name: "View Patient Records", module: "Patient Management" },
  { key: "patient:edit", name: "Edit Patient Details", module: "Patient Management" },
  { key: "patient:delete", name: "Delete Patient", module: "Patient Management" },

  // Medical History
  { key: "medical-history:view", name: "View Medical History", module: "Medical History" },
  { key: "medical-history:edit", name: "Edit Medical History", module: "Medical History" },

  // Diagnosis
  { key: "diagnosis:manage", name: "Manage Diagnoses", module: "Diagnosis" },

  // Couple
  { key: "couple:manage", name: "Manage Couples", module: "Couple Management" },

  // Cycle Management
  { key: "cycle:create", name: "Create New Cycle", module: "Cycle Management" },
  { key: "cycle:view", name: "View Cycle Details", module: "Cycle Management" },
  { key: "cycle:edit", name: "Edit Cycle", module: "Cycle Management" },
  { key: "cycle:cancel", name: "Cancel Cycle", module: "Cycle Management" },

  // Follicle Tracking
  { key: "follicle:record", name: "Record Follicle Tracking", module: "Follicle Tracking" },
  { key: "follicle:view", name: "View Follicle Data", module: "Follicle Tracking" },

  // OPU
  { key: "opu:record", name: "Record OPU Details", module: "OPU" },
  { key: "opu:view", name: "View OPU Records", module: "OPU" },

  // Semen
  { key: "semen:record", name: "Record Semen Data", module: "Semen Analysis" },
  { key: "semen:view", name: "View Semen Data", module: "Semen Analysis" },

  // Embryology
  { key: "embryology:view", name: "View Embryo Data", module: "Embryology Lab" },
  { key: "embryology:record", name: "Record Embryo Data", module: "Embryology Lab" },
  { key: "embryology:grade", name: "Grade Embryos", module: "Embryology Lab" },

  // Biopsy & PGD
  { key: "biopsy:manage", name: "Manage Biopsy/PGD", module: "Biopsy & PGD" },
  { key: "biopsy:view", name: "View Biopsy Data", module: "Biopsy & PGD" },

  // NGS
  { key: "ngs:record", name: "Record NGS Results", module: "NGS Results" },
  { key: "ngs:view", name: "View NGS Results", module: "NGS Results" },

  // ET
  { key: "et:manage", name: "Manage Embryo Transfer", module: "Embryo Transfer" },
  { key: "et:view", name: "View ET Records", module: "Embryo Transfer" },

  // Pregnancy
  { key: "pregnancy-test:record", name: "Record Pregnancy Test", module: "Pregnancy" },
  { key: "pregnancy-test:view", name: "View Pregnancy Test", module: "Pregnancy" },
  { key: "pregnancy-outcome:record", name: "Record Pregnancy Outcome", module: "Pregnancy" },
  { key: "pregnancy-outcome:view", name: "View Pregnancy Outcome", module: "Pregnancy" },

  // Cryo
  { key: "cryo:view", name: "View Cryo Records", module: "Cryo Inventory" },
  { key: "cryo:manage", name: "Manage Cryo Records", module: "Cryo Inventory" },
  { key: "cryo:discard", name: "Discard Cryo", module: "Cryo Inventory" },

  // Tank Management
  { key: "tank:manage", name: "Manage Cryo Tanks", module: "Tank Management" },
  { key: "tank:view", name: "View Cryo Tanks", module: "Tank Management" },

  // Investigations
  { key: "investigation:view", name: "View Lab Results", module: "Investigations" },
  { key: "investigation:order", name: "Order Investigations", module: "Investigations" },
  { key: "investigation:record-results", name: "Record Lab Results", module: "Investigations" },

  // Appointments
  { key: "appointment:view", name: "View Schedule", module: "Appointments" },
  { key: "appointment:book", name: "Book Appointment", module: "Appointments" },
  { key: "appointment:edit", name: "Edit Appointment", module: "Appointments" },

  // Billing
  { key: "invoice:create", name: "Create Invoice", module: "Billing" },
  { key: "invoice:view", name: "View Invoices", module: "Billing" },
  { key: "invoice:update", name: "Update Invoice", module: "Billing" },
  { key: "invoice:cancel", name: "Cancel Invoice", module: "Billing" },
  { key: "payment:process", name: "Process Payment", module: "Billing" },
  { key: "payment:view", name: "View Payments", module: "Billing" },

  // Reports
  { key: "report:kpi", name: "View KPI Reports", module: "Reports" },
  { key: "report:financial", name: "View Financial Reports", module: "Reports" },
  { key: "report:export", name: "Export Reports", module: "Reports" },
  { key: "report:opu-technologist", name: "OPU Technologist Report", module: "Reports" },
  { key: "report:icsi-rates", name: "ICSI Rates Report", module: "Reports" },
  { key: "report:cycle-outcomes", name: "Cycle Outcomes Report", module: "Reports" },

  // Prescriptions
  { key: "prescription:view", name: "View Prescriptions", module: "Prescriptions" },
  { key: "prescription:prescribe", name: "Prescribe Medication", module: "Prescriptions" },

  // Tasks
  { key: "task:create", name: "Create Tasks", module: "Tasks" },
  { key: "task:view", name: "View Tasks", module: "Tasks" },
  { key: "task:complete", name: "Complete Tasks", module: "Tasks" },

  // Patient Spouse Auto-Detect
  { key: "spouse:auto-detect", name: "Auto-Detect Spouse/Partner", module: "Patient Management" },

  // Admin
  { key: "admin:users", name: "Manage Users", module: "Admin" },
  { key: "admin:settings", name: "System Settings", module: "Admin" },
  { key: "admin:audit-logs", name: "View Audit Logs", module: "Admin" },
  { key: "permissions:manage", name: "Manage Role Permissions", module: "Admin" },
];

// ── Default Role-Permission Mappings (by role name) ──────────
const ROLE_PERMISSION_MAP = {
  ADMIN: [
    "patient:register", "patient:view", "patient:edit", "patient:delete",
    "spouse:auto-detect",
    "medical-history:view", "medical-history:edit",
    "diagnosis:manage",
    "couple:manage",
    "cycle:create", "cycle:view", "cycle:edit", "cycle:cancel",
    "follicle:record", "follicle:view",
    "opu:record", "opu:view",
    "semen:record", "semen:view",
    "embryology:view", "embryology:record", "embryology:grade",
    "biopsy:manage", "biopsy:view",
    "ngs:record", "ngs:view",
    "et:manage", "et:view",
    "pregnancy-test:record", "pregnancy-test:view",
    "pregnancy-outcome:record", "pregnancy-outcome:view",
    "cryo:view", "cryo:manage", "cryo:discard",
    "tank:manage", "tank:view",
    "investigation:view", "investigation:order", "investigation:record-results",
    "appointment:view", "appointment:book", "appointment:edit",
    "invoice:create", "invoice:view", "invoice:cancel",
    "payment:process", "payment:view",
    "report:kpi", "report:financial", "report:export",
    "report:opu-technologist", "report:icsi-rates", "report:cycle-outcomes",
    "prescription:view", "prescription:prescribe",
    "task:create", "task:view", "task:complete",
    "admin:users", "admin:settings", "admin:audit-logs",
    "permissions:manage",
  ],
  CONSULTANT: [
    "patient:register", "patient:view", "patient:edit",
    "spouse:auto-detect",
    "medical-history:view", "medical-history:edit",
    "diagnosis:manage",
    "couple:manage",
    "cycle:create", "cycle:view", "cycle:edit", "cycle:cancel",
    "follicle:view",
    "opu:view",
    "semen:view",
    "embryology:view",
    "biopsy:view",
    "ngs:view",
    "et:view",
    "pregnancy-test:record", "pregnancy-test:view",
    "pregnancy-outcome:record", "pregnancy-outcome:view",
    "cryo:view",
    "investigation:view", "investigation:order",
    "prescription:view", "prescription:prescribe",
    "appointment:view",
    "invoice:view",
    "report:kpi", "report:export", "report:cycle-outcomes",
    "report:opu-technologist", "report:icsi-rates",
    "task:create", "task:view", "task:complete",
  ],
  SPECIALIST: [
    "patient:register", "patient:view", "patient:edit",
    "spouse:auto-detect",
    "medical-history:view", "medical-history:edit",
    "diagnosis:manage",
    "cycle:create", "cycle:view", "cycle:edit",
    "follicle:record", "follicle:view",
    "opu:record", "opu:view",
    "semen:record", "semen:view",
    "embryology:view",
    "et:manage", "et:view",
    "pregnancy-test:view",
    "pregnancy-outcome:view",
    "cryo:view",
    "investigation:view", "investigation:order",
    "prescription:view", "prescription:prescribe",
    "appointment:view",
    "invoice:view",
    "report:kpi", "report:export", "report:cycle-outcomes",
    "report:opu-technologist",
    "task:create", "task:view", "task:complete",
  ],
  NURSE: [
    "patient:register", "patient:view", "patient:edit",
    "spouse:auto-detect",
    "medical-history:view", "medical-history:edit",
    "cycle:view",
    "opu:record",
    "appointment:view",
    "investigation:view",
    "prescription:view", "prescription:prescribe",
    "task:create", "task:view", "task:complete",
  ],
  EMBRYOLOGIST: [
    "patient:view",
    "medical-history:view",
    "cycle:view",
    "opu:record", "opu:view",
    "semen:record", "semen:view",
    "embryology:view", "embryology:record", "embryology:grade",
    "biopsy:manage", "biopsy:view",
    "ngs:record", "ngs:view",
    "et:manage", "et:view",
    "cryo:view", "cryo:manage", "cryo:discard",
    "tank:manage", "tank:view",
    "investigation:view", "investigation:record-results",
    "appointment:view",
    "prescription:view",
    "report:kpi", "report:export", "report:cycle-outcomes",
    "report:opu-technologist", "report:icsi-rates",
    "task:create", "task:view", "task:complete",
  ],
  COUNSELLOR: [
    "patient:register", "patient:view", "patient:edit",
    "medical-history:view",
    "cycle:view",
    "investigation:view",
    "prescription:view",
    "appointment:view",
    "task:create", "task:view", "task:complete",
  ],
  SONOGRAPHER: [
    "patient:view",
    "cycle:view",
    "follicle:record", "follicle:view",
    "appointment:view",
    "task:create", "task:view", "task:complete",
  ],
  LAB_TECH: [
    "patient:view",
    "cycle:view",
    "semen:record", "semen:view",
    "investigation:view", "investigation:record-results",
    "prescription:view",
    "appointment:view",
    "task:create", "task:view", "task:complete",
  ],
  BILLING: [
    "patient:register", "patient:view", "patient:edit",
    "cycle:view",
    "invoice:create", "invoice:view", "invoice:update", "invoice:cancel",
    "payment:process", "payment:view",
    "report:kpi", "report:financial", "report:export",
    "task:create", "task:view", "task:complete",
  ],
  RECEPTIONIST: [
    "patient:register", "patient:view", "patient:edit",
    "spouse:auto-detect",
    "appointment:view", "appointment:book", "appointment:edit",
    "task:create", "task:view", "task:complete",
  ],
  VIEWER: [
    "patient:view",
  ],
};

async function main() {
  console.log("🌱 Seeding Life's Spring Women Center database...\n");

  // ── 1. Create default roles ──────────────────────────────────
  console.log("📋 Creating default roles...");
  const roleMap = {}; // name -> { id, name, label, hierarchy }

  for (const def of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { name: def.name },
      create: def,
      update: { label: def.label, hierarchy: def.hierarchy },
    });
    roleMap[def.name] = role;
  }
  console.log(`✅ Created/updated ${ROLE_DEFINITIONS.length} roles`);

  // ── 2. Create admin user ─────────────────────────────────────
  const adminEmail = "admin@gmail.com";
  const adminStaffCode = "ADMIN";
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminUser) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    adminUser = await prisma.user.create({
      data: {
        staffCode: adminStaffCode,
        email: adminEmail,
        password: hashedPassword,
        firstName: "System",
        lastName: "Admin",
        roleId: roleMap.ADMIN.id,
        isActive: true,
      },
    });
    console.log(`✅ Created admin user: ${adminStaffCode} / ${adminEmail} / admin123`);
  } else {
    // Ensure existing admin gets staffCode and correct roleId
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        staffCode: adminUser.staffCode || adminStaffCode,
        roleId: adminUser.roleId || roleMap.ADMIN.id,
      },
    });
    console.log(`✓ Admin user already exists: ${adminStaffCode} / ${adminEmail}`);
  }

  // ── 3. Seed all permissions ──────────────────────────────────
  console.log("\n📋 Seeding permissions...");
  const permissionMap = {}; // key -> id

  for (const def of PERMISSION_DEFINITIONS) {
    const perm = await prisma.permission.upsert({
      where: { key: def.key },
      create: def,
      update: { name: def.name, module: def.module },
    });
    permissionMap[def.key] = perm.id;
  }
  console.log(`✅ Seeded ${PERMISSION_DEFINITIONS.length} permissions`);

  // ── 4. Sync role-permission mappings ─────────────────────────
  console.log("\n🔐 Synchronizing role-permission assignments...");
  await prisma.rolePermission.deleteMany({});
  console.log("   Cleared existing role-permission mappings");

  let totalAssignments = 0;

  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = roleMap[roleName];
    if (!role) {
      console.warn(`⚠️  Role "${roleName}" not found — skipping`);
      continue;
    }

    for (const key of permissionKeys) {
      const permissionId = permissionMap[key];
      if (!permissionId) {
        console.warn(`⚠️  Permission key "${key}" not found — skipping for role ${roleName}`);
        continue;
      }

      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permissionId,
          assignedById: adminUser.id,
        },
      });
      totalAssignments++;
    }
  }

  console.log(`✅ Assigned ${totalAssignments} role-permission mappings`);

  // ── 5. Seed selection options (referral sources, branches, etc.) ─
  console.log("\n📋 Seeding selection options...");

  const SELECTION_OPTIONS = [
    // How did you hear about us?
    { category: "hearUsFrom", label: "Social Media (Facebook / Instagram)", sortOrder: 1 },
    { category: "hearUsFrom", label: "Google Search", sortOrder: 2 },
    { category: "hearUsFrom", label: "Friend / Family Referral", sortOrder: 3 },
    { category: "hearUsFrom", label: "Doctor Referral", sortOrder: 4 },
    { category: "hearUsFrom", label: "Clinic Website", sortOrder: 5 },
    { category: "hearUsFrom", label: "TV / Radio Advert", sortOrder: 6 },
    { category: "hearUsFrom", label: "Billboard / Outdoor", sortOrder: 7 },
    { category: "hearUsFrom", label: "Social Media (WhatsApp / TikTok)", sortOrder: 8 },
    { category: "hearUsFrom", label: "Email Campaign", sortOrder: 9 },
    { category: "hearUsFrom", label: "Walk-in / Passing By", sortOrder: 10 },
    { category: "hearUsFrom", label: "Insurance Provider Referral", sortOrder: 11 },
    { category: "hearUsFrom", label: "Other", sortOrder: 99 },

    // Branches
    { category: "branch", label: "Main Branch — Dubai Healthcare City", sortOrder: 1 },
    { category: "branch", label: "Dubai — Al Barsha", sortOrder: 2 },
    { category: "branch", label: "Abu Dhabi — Khalifa City", sortOrder: 3 },
    { category: "branch", label: "Sharjah — Al Qasimia", sortOrder: 4 },
    { category: "branch", label: "Al Ain", sortOrder: 5 },
    { category: "branch", label: "Ras Al Khaimah", sortOrder: 6 },
  ];

  let seededOptions = 0;
  for (const opt of SELECTION_OPTIONS) {
    await prisma.selectionOption.upsert({
      where: { category_label: { category: opt.category, label: opt.label } },
      create: { ...opt, value: null, isActive: true },
      update: { sortOrder: opt.sortOrder, isActive: true },
    });
    seededOptions++;
  }
  console.log(`✅ Seeded ${seededOptions} selection options (${new Set(SELECTION_OPTIONS.map((o) => o.category)).size} categories)`);

  console.log(`\n🎉 Seed complete!`);
  console.log(`   Admin login staff code: ${adminStaffCode} / password: admin123`);
  console.log(`   Total roles: ${ROLE_DEFINITIONS.length}`);
  console.log(`   Total permissions: ${PERMISSION_DEFINITIONS.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
