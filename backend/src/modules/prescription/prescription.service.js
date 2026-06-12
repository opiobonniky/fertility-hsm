import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

const prescriptionInclude = {
  patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
  prescribedBy: { select: { id: true, firstName: true, lastName: true, staffCode: true } },
  cycle: { select: { id: true, cycleNumber: true, artType: true } },
};

export const getAll = async (filters) => {
  const { patientId, status, prescribedById, cycleId } = filters;
  const pageNum = Number(filters.page) || 1;
  const limitNum = Number(filters.limit) || 20;
  const where = {};
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;
  if (prescribedById) where.prescribedById = prescribedById;
  if (cycleId) where.cycleId = cycleId;

  const [data, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      include: prescriptionInclude,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.prescription.count({ where }),
  ]);

  return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
};

export const getById = async (id) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: prescriptionInclude,
  });
  if (!prescription) throw new AppError("Prescription not found", 404);
  return prescription;
};

export const getPatientPrescriptions = async (patientId) => {
  return prisma.prescription.findMany({
    where: { patientId },
    include: {
      prescribedBy: { select: { id: true, firstName: true, lastName: true, staffCode: true } },
      cycle: { select: { id: true, cycleNumber: true, artType: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getActivePrescriptions = async (patientId) => {
  return prisma.prescription.findMany({
    where: { patientId, status: "ACTIVE" },
    include: {
      prescribedBy: { select: { id: true, firstName: true, lastName: true, staffCode: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const create = async (data, userId) => {
  const prescription = await prisma.prescription.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      prescribedById: userId,
    },
    include: {
      ...prescriptionInclude,
    },
  });
  logger.info(
    `Prescription created: ${prescription.medicationName} for patient ${data.patientId} by ${userId}`,
  );
  return prescription;
};

export const update = async (id, data) => {
  const existing = await prisma.prescription.findUnique({ where: { id } });
  if (!existing) throw new AppError("Prescription not found", 404);

  const updateData = { ...data };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);

  const prescription = await prisma.prescription.update({
    where: { id },
    data: updateData,
    include: prescriptionInclude,
  });
  return prescription;
};

export const updateStatus = async (id, status, discontinuedReason) => {
  const existing = await prisma.prescription.findUnique({ where: { id } });
  if (!existing) throw new AppError("Prescription not found", 404);

  const data = { status };
  if (status === "DISCONTINUED" || status === "CANCELLED") {
    data.discontinuedAt = new Date();
    if (discontinuedReason) data.discontinuedReason = discontinuedReason;
  }

  const prescription = await prisma.prescription.update({
    where: { id },
    data,
    include: prescriptionInclude,
  });
  logger.info(`Prescription ${id} status updated to ${status}`);
  return prescription;
};

/**
 * Get clinical timeline for a patient — all clinical activities across modules.
 * Used for cross-role visibility (doctors see lab results, nurses see prescriptions, etc.)
 */
export const getPatientClinicalTimeline = async (patientId) => {
  const [prescriptions, investigations, cycles, appointments] = await Promise.all([
    prisma.prescription.findMany({
      where: { patientId },
      include: {
        prescribedBy: { select: { id: true, firstName: true, lastName: true, role: { select: { name: true, label: true } } } },
        cycle: { select: { id: true, cycleNumber: true, artType: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.investigation.findMany({
      where: { patientId },
      include: {
        orderedBy: { select: { id: true, firstName: true, lastName: true, role: { select: { name: true, label: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.cycle.findMany({
      where: {
        couple: {
          OR: [{ wifePatientId: patientId }, { husbandPatientId: patientId }],
        },
      },
      include: {
        embryologyRecords: {
          select: {
            id: true,
            dayNumber: true,
            embryoCount: true,
            icsiMethod: true,
            details: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { dayNumber: "asc" },
        },
        opuRecord: { select: { oocyteCount: true, miiOocyteCount: true, createdAt: true } },
        etRecord: { select: { etDate: true, transferredEmbryos: true } },
        pregnancyTest: { select: { bhcgLevel: true, testDate: true } },
        pregnancyOutcome: { select: { outcome: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.appointment.findMany({
      where: { patientId },
      include: {
        physician: { select: { id: true, firstName: true, lastName: true, role: { select: { name: true, label: true } } } },
        clinic: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return {
    prescriptions,
    investigations,
    cycles,
    appointments,
  };
};
