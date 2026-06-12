-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DISCONTINUED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MedicationRoute" AS ENUM ('ORAL', 'INJECTION', 'TOPICAL', 'SUBLINGUAL', 'RECTAL', 'INHALATION', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicationFrequency" AS ENUM ('ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'FOUR_TIMES_DAILY', 'EVERY_OTHER_DAY', 'WEEKLY', 'ONCE', 'AS_DIRECTED', 'OTHER');

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "cycleId" TEXT,
    "prescribedById" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "medicationRoute" "MedicationRoute" NOT NULL DEFAULT 'ORAL',
    "dosage" TEXT NOT NULL,
    "frequency" "MedicationFrequency" NOT NULL,
    "duration" TEXT,
    "frequencyDetail" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "refills" INTEGER NOT NULL DEFAULT 0,
    "refillsUsed" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "instructions" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "diagnosis" TEXT,
    "sideEffects" TEXT,
    "discontinuedAt" TIMESTAMP(3),
    "discontinuedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prescription_patientId_idx" ON "Prescription"("patientId");

-- CreateIndex
CREATE INDEX "Prescription_cycleId_idx" ON "Prescription"("cycleId");

-- CreateIndex
CREATE INDEX "Prescription_prescribedById_idx" ON "Prescription"("prescribedById");

-- CreateIndex
CREATE INDEX "Prescription_status_idx" ON "Prescription"("status");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_prescribedById_fkey" FOREIGN KEY ("prescribedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
