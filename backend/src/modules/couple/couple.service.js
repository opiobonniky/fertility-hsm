import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

export const getCoupleByPatientId = async (patientId) => {
  const couple = await prisma.couple.findFirst({
    where: {
      OR: [{ wifePatientId: patientId }, { husbandPatientId: patientId }],
    },
    include: {
      wifePatient: { select: { id: true, firstName: true, lastName: true, mrn: true, dateOfBirth: true } },
      husbandPatient: { select: { id: true, firstName: true, lastName: true, mrn: true, dateOfBirth: true } },
    },
  });
  return couple;
};

export const createCouple = async (data, userId) => {
  // Verify both patients exist
  const [wife, husband] = await Promise.all([
    prisma.patient.findUnique({ where: { id: data.wifePatientId } }),
    prisma.patient.findUnique({ where: { id: data.husbandPatientId } }),
  ]);
  if (!wife || !husband) throw new AppError("One or both patients not found", 404);
  if (wife.gender !== "FEMALE" || husband.gender !== "MALE") {
    throw new AppError("Wife must be female and husband must be male", 400);
  }

  // Check if either patient is already in a couple
  const existing = await prisma.couple.findFirst({
    where: {
      OR: [{ wifePatientId: data.wifePatientId }, { husbandPatientId: data.husbandPatientId }],
    },
  });
  if (existing) throw new AppError("One or both patients are already linked to a couple", 400);

  const couple = await prisma.couple.create({
    data: { ...data, createdById: userId },
    include: {
      wifePatient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      husbandPatient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
    },
  });
  logger.info(`Couple created: ${wife.firstName} + ${husband.firstName}`);
  return couple;
};

export const getAll = async (filters = {}) => {
  const pageNum = Number(filters.page) || 1;
  const limitNum = Number(filters.limit) || 50;
  const where = {};

  if (filters.query) {
    where.OR = [
      { wifePatient: { firstName: { contains: filters.query, mode: "insensitive" } } },
      { wifePatient: { lastName: { contains: filters.query, mode: "insensitive" } } },
      { wifePatient: { mrn: { contains: filters.query, mode: "insensitive" } } },
      { husbandPatient: { firstName: { contains: filters.query, mode: "insensitive" } } },
      { husbandPatient: { lastName: { contains: filters.query, mode: "insensitive" } } },
      { husbandPatient: { mrn: { contains: filters.query, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.couple.findMany({
      where,
      include: {
        wifePatient: { select: { id: true, firstName: true, lastName: true, mrn: true, dateOfBirth: true } },
        husbandPatient: { select: { id: true, firstName: true, lastName: true, mrn: true, dateOfBirth: true } },
        cycles: {
          select: {
            id: true,
            cycleNumber: true,
            artType: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.couple.count({ where }),
  ]);

  // Add computed status info
  const enriched = data.map((couple) => {
    const cycles = couple.cycles || [];
    const completedCycles = cycles.filter((c) =>
      ["CYCLE_COMPLETED", "PREGNANCY_CONFIRMED"].includes(c.status)
    );
    const activeCycles = cycles.filter((c) =>
      !["CYCLE_COMPLETED", "CYCLE_CANCELLED", "PREGNANCY_CONFIRMED"].includes(c.status)
    );
    return {
      ...couple,
      cycleCount: cycles.length,
      completedCycleCount: completedCycles.length,
      activeCycleCount: activeCycles.length,
      latestCycle: cycles[0] || null,
    };
  });

  return { data: enriched, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
};

export const updateCouple = async (id, data) => {
  const couple = await prisma.couple.findUnique({ where: { id } });
  if (!couple) throw new AppError("Couple not found", 404);
  return prisma.couple.update({ where: { id }, data });
};
