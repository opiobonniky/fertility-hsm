-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "InfertilityType" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "ARTType" AS ENUM ('ICSI', 'IVF', 'IUI', 'FET', 'NATURAL');

-- CreateEnum
CREATE TYPE "PGDType" AS ENUM ('PGS', 'PGD', 'NONE');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('UNDER_STIMULATION', 'OPU_SCHEDULED', 'OPU_COMPLETED', 'ET_SCHEDULED', 'ET_COMPLETED', 'PREGNANCY_TEST', 'PREGNANCY_CONFIRMED', 'CYCLE_CANCELLED', 'CYCLE_COMPLETED');

-- CreateEnum
CREATE TYPE "EmbryoDay" AS ENUM ('D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7');

-- CreateEnum
CREATE TYPE "BiopsyType" AS ENUM ('POLAR_BODY', 'BLASTOMERE', 'TROPHECTODERM');

-- CreateEnum
CREATE TYPE "NGSResultStatus" AS ENUM ('EUPLOID', 'ANEUPLOID', 'MOSAIC', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "CryoStatus" AS ENUM ('STORED', 'USED', 'TRANSFERRED', 'DISCARDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "InvestigationType" AS ENUM ('SEMEN_ANALYSIS', 'HORMONAL', 'INFECTION_SCREENING', 'GENETIC', 'LAPAROSCOPY', 'HSG', 'ULTRASOUND', 'OTHER');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'WIRE_TRANSFER', 'CHEQUE', 'INSURANCE');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('FOLLOW_UP_CALL', 'EMBRYO_DISPOSAL', 'GAMETE_REMINDER', 'EXPIRY_NOTIFICATION', 'GENERAL');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Diagnosis" AS ENUM ('PCOS', 'ANOVULATION', 'ENDOMETRIOSIS', 'TUBAL_FACTOR', 'FIBROID', 'UTERINE_FACTOR', 'UNEXPLAINED', 'RECURRENT_MISCARRIAGE', 'AZOOSPERMIA', 'PGS_ACGH', 'PGD', 'GENDER_SELECTION', 'KLINEFELTER_SYNDROME', 'MALE_FACTOR', 'DOR', 'OTHER');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "hierarchy" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "staffCode" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "permissions" JSONB,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "mrn" TEXT NOT NULL,
    "oldMrn" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT,
    "nationalId" TEXT,
    "gender" "Gender" NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "occupation" TEXT,
    "company" TEXT,
    "hearUsFrom" TEXT,
    "branch" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientMedicalHistory" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "obHistory" TEXT,
    "surgicalHistory" TEXT,
    "gynecologicalHistory" TEXT,
    "adolescence" TEXT,
    "contraception" TEXT,
    "lmp" TIMESTAMP(3),
    "menstrualCycle" TEXT,
    "gravida" INTEGER,
    "para" INTEGER,
    "abortion" INTEGER,
    "ectopic" INTEGER,
    "livingChildren" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientMedicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientDiagnosis" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "diagnosis" "Diagnosis" NOT NULL,
    "notes" TEXT,
    "diagnosedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diagnosedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Couple" (
    "id" TEXT NOT NULL,
    "wifePatientId" TEXT NOT NULL,
    "husbandPatientId" TEXT NOT NULL,
    "marriageDuration" INTEGER,
    "infertilityType" "InfertilityType",
    "infertilityDiagnosis" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Couple_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cycle" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "artType" "ARTType" NOT NULL,
    "pgdType" "PGDType",
    "pgdGene" TEXT,
    "pgdMutation" TEXT,
    "pgdInheritanceMode" TEXT,
    "pgdMarkers" TEXT,
    "pgdTestMethod" TEXT,
    "pgdFemaleDiagnosis" TEXT,
    "pgdMaleDiagnosis" TEXT,
    "stimulationProtocol" TEXT,
    "stimulationDrugs" JSONB,
    "bmi" DOUBLE PRECISION,
    "cycleWarnings" TEXT,
    "lmp" TIMESTAMP(3),
    "hcgDate" TIMESTAMP(3),
    "opuDate" TIMESTAMP(3),
    "etDate" TIMESTAMP(3),
    "status" "CycleStatus" NOT NULL DEFAULT 'UNDER_STIMULATION',
    "notes" TEXT,
    "treatingPhysicianId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollicleTracking" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "rightOvary" JSONB,
    "leftOvary" JSONB,
    "endometrium" TEXT,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollicleTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OPURecord" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "anaesthesiaType" TEXT,
    "follicleCount" INTEGER,
    "oocyteCount" INTEGER,
    "miiOocyteCount" INTEGER,
    "operationNotes" TEXT,
    "complications" TEXT,
    "postOpPlan" TEXT,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OPURecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemenDatum" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "patientId" TEXT,
    "specimenType" TEXT,
    "processingMethod" TEXT,
    "collectionDate" TIMESTAMP(3),
    "abstinenceDays" INTEGER,
    "preVolume" DOUBLE PRECISION,
    "preConcentration" DOUBLE PRECISION,
    "preTotalCount" DOUBLE PRECISION,
    "preMotility" DOUBLE PRECISION,
    "preProgressiveMotility" DOUBLE PRECISION,
    "preMorphology" DOUBLE PRECISION,
    "preViscosity" TEXT,
    "preColor" TEXT,
    "prePH" DOUBLE PRECISION,
    "postVolume" DOUBLE PRECISION,
    "postConcentration" DOUBLE PRECISION,
    "postTotalCount" DOUBLE PRECISION,
    "postMotility" DOUBLE PRECISION,
    "postProgressiveMotility" DOUBLE PRECISION,
    "postMorphology" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemenDatum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbryologyRecord" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "dayNumber" "EmbryoDay" NOT NULL,
    "embryoCount" INTEGER NOT NULL,
    "icsiMethod" TEXT,
    "details" JSONB,
    "notes" TEXT,
    "icsiPerformedById" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmbryologyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbryoBiopsy" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "embryoNumber" INTEGER NOT NULL,
    "biopsyDate" TIMESTAMP(3) NOT NULL,
    "biopsyType" "BiopsyType" NOT NULL,
    "cellsRemoved" INTEGER,
    "labNotes" TEXT,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmbryoBiopsy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NGSReport" (
    "id" TEXT NOT NULL,
    "embryoBiopsyId" TEXT NOT NULL,
    "embryoNumber" INTEGER NOT NULL,
    "result" "NGSResultStatus" NOT NULL DEFAULT 'PENDING',
    "chromosomeDetails" JSONB,
    "reportFile" TEXT,
    "notes" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NGSReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ETRecord" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "etDate" TIMESTAMP(3) NOT NULL,
    "catheterType" TEXT,
    "catheterBrand" TEXT,
    "transferredEmbryos" JSONB,
    "residueEmbryos" TEXT,
    "notes" TEXT,
    "physicianId" TEXT NOT NULL,
    "embryologistId" TEXT NOT NULL,
    "witnessId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ETRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PregnancyTest" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "bhcgLevel" DOUBLE PRECISION,
    "testDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PregnancyTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PregnancyOutcome" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "anomalies" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PregnancyOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CryoTank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "capacity" INTEGER,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "fillLevel" DOUBLE PRECISION,
    "lastChecked" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CryoTank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbryoCryo" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "embryoNumber" INTEGER NOT NULL,
    "freezeDate" TIMESTAMP(3) NOT NULL,
    "tankId" TEXT NOT NULL,
    "partition" TEXT,
    "level" TEXT,
    "goblet" TEXT,
    "containerColor" TEXT,
    "protocol" TEXT,
    "media" TEXT,
    "strawDetails" TEXT,
    "renewalDate" TIMESTAMP(3),
    "status" "CryoStatus" NOT NULL DEFAULT 'STORED',
    "discardedAt" TIMESTAMP(3),
    "discardedReason" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmbryoCryo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpermCryo" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "freezeDate" TIMESTAMP(3) NOT NULL,
    "tankId" TEXT NOT NULL,
    "partition" TEXT,
    "level" TEXT,
    "goblet" TEXT,
    "containerColor" TEXT,
    "protocol" TEXT,
    "source" TEXT,
    "count" INTEGER,
    "motility" DOUBLE PRECISION,
    "renewalDate" TIMESTAMP(3),
    "status" "CryoStatus" NOT NULL DEFAULT 'STORED',
    "discardedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpermCryo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OocyteCryo" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "freezeDate" TIMESTAMP(3) NOT NULL,
    "tankId" TEXT NOT NULL,
    "partition" TEXT,
    "level" TEXT,
    "goblet" TEXT,
    "containerColor" TEXT,
    "protocol" TEXT,
    "source" TEXT,
    "count" INTEGER,
    "renewalDate" TIMESTAMP(3),
    "status" "CryoStatus" NOT NULL DEFAULT 'STORED',
    "discardedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OocyteCryo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "InvestigationType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "results" JSONB,
    "reportFile" TEXT,
    "notes" TEXT,
    "isAbnormal" BOOLEAN,
    "orderedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch" TEXT,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "workingDays" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "physicianId" TEXT,
    "service" TEXT NOT NULL,
    "clinicId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "branch" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "subTotal" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAmount" DOUBLE PRECISION NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "insuranceClaim" BOOLEAN,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "receivedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'GENERAL',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "patientId" TEXT,
    "cycleId" TEXT,
    "assigneeId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_staffCode_key" ON "User"("staffCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_mrn_key" ON "Patient"("mrn");

-- CreateIndex
CREATE INDEX "Patient_mrn_idx" ON "Patient"("mrn");

-- CreateIndex
CREATE INDEX "Patient_firstName_lastName_idx" ON "Patient"("firstName", "lastName");

-- CreateIndex
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "PatientMedicalHistory_patientId_key" ON "PatientMedicalHistory"("patientId");

-- CreateIndex
CREATE INDEX "PatientDiagnosis_patientId_idx" ON "PatientDiagnosis"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "Couple_wifePatientId_key" ON "Couple"("wifePatientId");

-- CreateIndex
CREATE UNIQUE INDEX "Couple_husbandPatientId_key" ON "Couple"("husbandPatientId");

-- CreateIndex
CREATE INDEX "Couple_wifePatientId_idx" ON "Couple"("wifePatientId");

-- CreateIndex
CREATE INDEX "Couple_husbandPatientId_idx" ON "Couple"("husbandPatientId");

-- CreateIndex
CREATE INDEX "Cycle_coupleId_idx" ON "Cycle"("coupleId");

-- CreateIndex
CREATE INDEX "Cycle_status_idx" ON "Cycle"("status");

-- CreateIndex
CREATE INDEX "Cycle_createdAt_idx" ON "Cycle"("createdAt");

-- CreateIndex
CREATE INDEX "FollicleTracking_cycleId_idx" ON "FollicleTracking"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "FollicleTracking_cycleId_dayNumber_key" ON "FollicleTracking"("cycleId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "OPURecord_cycleId_key" ON "OPURecord"("cycleId");

-- CreateIndex
CREATE INDEX "SemenDatum_cycleId_idx" ON "SemenDatum"("cycleId");

-- CreateIndex
CREATE INDEX "EmbryologyRecord_cycleId_idx" ON "EmbryologyRecord"("cycleId");

-- CreateIndex
CREATE INDEX "EmbryoBiopsy_cycleId_idx" ON "EmbryoBiopsy"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "NGSReport_embryoBiopsyId_key" ON "NGSReport"("embryoBiopsyId");

-- CreateIndex
CREATE UNIQUE INDEX "ETRecord_cycleId_key" ON "ETRecord"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "PregnancyTest_cycleId_key" ON "PregnancyTest"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "PregnancyOutcome_cycleId_key" ON "PregnancyOutcome"("cycleId");

-- CreateIndex
CREATE INDEX "EmbryoCryo_tankId_idx" ON "EmbryoCryo"("tankId");

-- CreateIndex
CREATE INDEX "EmbryoCryo_status_idx" ON "EmbryoCryo"("status");

-- CreateIndex
CREATE INDEX "EmbryoCryo_renewalDate_idx" ON "EmbryoCryo"("renewalDate");

-- CreateIndex
CREATE INDEX "SpermCryo_tankId_idx" ON "SpermCryo"("tankId");

-- CreateIndex
CREATE INDEX "SpermCryo_patientId_idx" ON "SpermCryo"("patientId");

-- CreateIndex
CREATE INDEX "SpermCryo_renewalDate_idx" ON "SpermCryo"("renewalDate");

-- CreateIndex
CREATE INDEX "OocyteCryo_tankId_idx" ON "OocyteCryo"("tankId");

-- CreateIndex
CREATE INDEX "OocyteCryo_patientId_idx" ON "OocyteCryo"("patientId");

-- CreateIndex
CREATE INDEX "OocyteCryo_renewalDate_idx" ON "OocyteCryo"("renewalDate");

-- CreateIndex
CREATE INDEX "Investigation_patientId_idx" ON "Investigation"("patientId");

-- CreateIndex
CREATE INDEX "Investigation_type_idx" ON "Investigation"("type");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_physicianId_idx" ON "Appointment"("physicianId");

-- CreateIndex
CREATE INDEX "Appointment_startTime_idx" ON "Appointment"("startTime");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_patientId_idx" ON "Invoice"("patientId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedicalHistory" ADD CONSTRAINT "PatientMedicalHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedicalHistory" ADD CONSTRAINT "PatientMedicalHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDiagnosis" ADD CONSTRAINT "PatientDiagnosis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientDiagnosis" ADD CONSTRAINT "PatientDiagnosis_diagnosedById_fkey" FOREIGN KEY ("diagnosedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_wifePatientId_fkey" FOREIGN KEY ("wifePatientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_husbandPatientId_fkey" FOREIGN KEY ("husbandPatientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Couple" ADD CONSTRAINT "Couple_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_treatingPhysicianId_fkey" FOREIGN KEY ("treatingPhysicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollicleTracking" ADD CONSTRAINT "FollicleTracking_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollicleTracking" ADD CONSTRAINT "FollicleTracking_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OPURecord" ADD CONSTRAINT "OPURecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OPURecord" ADD CONSTRAINT "OPURecord_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemenDatum" ADD CONSTRAINT "SemenDatum_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemenDatum" ADD CONSTRAINT "SemenDatum_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbryologyRecord" ADD CONSTRAINT "EmbryologyRecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbryologyRecord" ADD CONSTRAINT "EmbryologyRecord_icsiPerformedById_fkey" FOREIGN KEY ("icsiPerformedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbryologyRecord" ADD CONSTRAINT "EmbryologyRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbryoBiopsy" ADD CONSTRAINT "EmbryoBiopsy_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbryoBiopsy" ADD CONSTRAINT "EmbryoBiopsy_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NGSReport" ADD CONSTRAINT "NGSReport_embryoBiopsyId_fkey" FOREIGN KEY ("embryoBiopsyId") REFERENCES "EmbryoBiopsy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NGSReport" ADD CONSTRAINT "NGSReport_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETRecord" ADD CONSTRAINT "ETRecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETRecord" ADD CONSTRAINT "ETRecord_physicianId_fkey" FOREIGN KEY ("physicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETRecord" ADD CONSTRAINT "ETRecord_embryologistId_fkey" FOREIGN KEY ("embryologistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ETRecord" ADD CONSTRAINT "ETRecord_witnessId_fkey" FOREIGN KEY ("witnessId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PregnancyTest" ADD CONSTRAINT "PregnancyTest_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PregnancyOutcome" ADD CONSTRAINT "PregnancyOutcome_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbryoCryo" ADD CONSTRAINT "EmbryoCryo_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbryoCryo" ADD CONSTRAINT "EmbryoCryo_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "CryoTank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbryoCryo" ADD CONSTRAINT "EmbryoCryo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpermCryo" ADD CONSTRAINT "SpermCryo_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpermCryo" ADD CONSTRAINT "SpermCryo_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "CryoTank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpermCryo" ADD CONSTRAINT "SpermCryo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OocyteCryo" ADD CONSTRAINT "OocyteCryo_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OocyteCryo" ADD CONSTRAINT "OocyteCryo_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "CryoTank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OocyteCryo" ADD CONSTRAINT "OocyteCryo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_physicianId_fkey" FOREIGN KEY ("physicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
