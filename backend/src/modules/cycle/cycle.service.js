import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

export const getDashboardData = async () => {
  const [underStimulation, opuScheduled, opuToday, pregnancyTests, iui, fet] =
    await Promise.all([
      prisma.cycle.count({ where: { status: "UNDER_STIMULATION" } }),
      prisma.cycle.count({ where: { status: "OPU_SCHEDULED" } }),
      prisma.cycle.count({
        where: { status: "OPU_SCHEDULED", opuDate: { gte: new Date() } },
      }),
      prisma.cycle.count({ where: { status: "PREGNANCY_TEST" } }),
      prisma.cycle.count({ where: { artType: "IUI" } }),
      prisma.cycle.count({ where: { artType: "FET" } }),
    ]);

  return { underStimulation, opuScheduled, opuToday, pregnancyTests, iui, fet };
};

export const searchCycles = async (filters) => {
  const { artType, status, coupleId } = filters;
  const pageNum = Number(filters.page) || 1;
  const limitNum = Number(filters.limit) || 20;
  const where = {};
  if (artType) where.artType = artType;
  if (status) where.status = status;
  if (coupleId) where.coupleId = coupleId;

  const [data, total] = await Promise.all([
    prisma.cycle.findMany({
      where,
      include: {
        couple: {
          include: {
            wifePatient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
            husbandPatient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.cycle.count({ where }),
  ]);

  return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
};

export const getCycleById = async (id) => {
  const cycle = await prisma.cycle.findUnique({
    where: { id },
    include: {
      couple: {
        include: {
          wifePatient: { select: { id: true, firstName: true, lastName: true, mrn: true, dateOfBirth: true } },
          husbandPatient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        },
      },
      follicleTrackings: { orderBy: { dayNumber: "asc" } },
      opuRecord: true,
      semenData: true,
      embryologyRecords: { orderBy: { dayNumber: "asc" } },
      etRecord: true,
      pregnancyTest: true,
      pregnancyOutcome: true,
      embryoCryos: true,
    },
  });
  if (!cycle) throw new AppError("Cycle not found", 404);
  return cycle;
};

export const createCycle = async (data, userId) => {
  const couple = await prisma.couple.findUnique({ where: { id: data.coupleId } });
  if (!couple) throw new AppError("Couple not found", 404);

  // Determine cycle number
  const prevCycles = await prisma.cycle.count({ where: { coupleId: data.coupleId } });

  const cycle = await prisma.cycle.create({
    data: { ...data, cycleNumber: prevCycles + 1, createdById: userId },
  });
  logger.info(`Cycle #${cycle.cycleNumber} created for couple ${data.coupleId}`);
  return cycle;
};

export const updateCycle = async (id, data) => {
  const cycle = await prisma.cycle.findUnique({ where: { id } });
  if (!cycle) throw new AppError("Cycle not found", 404);
  return prisma.cycle.update({ where: { id }, data });
};

export const updateCycleStatus = async (id, status) => {
  const cycle = await prisma.cycle.findUnique({ where: { id } });
  if (!cycle) throw new AppError("Cycle not found", 404);
  return prisma.cycle.update({ where: { id }, data: { status } });
};

// ── Sub-resources ──────────────────────────────────────────────

export const getFollicleTrackings = (cycleId) =>
  prisma.follicleTracking.findMany({ where: { cycleId }, orderBy: { dayNumber: "asc" } });

export const createFollicleTracking = (cycleId, data, userId) =>
  prisma.follicleTracking.create({ data: { ...data, cycleId, recordedById: userId } });

export const getOPURecord = (cycleId) =>
  prisma.oPURecord.findUnique({ where: { cycleId } });

export const createOPURecord = (cycleId, data) =>
  prisma.oPURecord.create({ data: { ...data, cycleId } });

export const updateOPURecord = (cycleId, data) =>
  prisma.oPURecord.update({ where: { cycleId }, data });

export const getSemenData = (cycleId) =>
  prisma.semenDatum.findMany({ where: { cycleId } });

export const createSemenData = (cycleId, data) =>
  prisma.semenDatum.create({ data: { ...data, cycleId } });

export const getEmbryologyRecords = (cycleId) =>
  prisma.embryologyRecord.findMany({ where: { cycleId }, orderBy: { dayNumber: "asc" } });

export const createEmbryologyRecord = (cycleId, data, userId) =>
  prisma.embryologyRecord.create({ data: { ...data, cycleId, createdById: userId } });

export const getETRecord = (cycleId) =>
  prisma.eTRecord.findUnique({ where: { cycleId } });

export const createETRecord = (cycleId, data) =>
  prisma.eTRecord.create({ data: { ...data, cycleId } });

export const getPregnancyTest = (cycleId) =>
  prisma.pregnancyTest.findUnique({ where: { cycleId } });

export const createPregnancyTest = (cycleId, data) =>
  prisma.pregnancyTest.create({ data: { ...data, cycleId } });

export const getPregnancyOutcome = (cycleId) =>
  prisma.pregnancyOutcome.findUnique({ where: { cycleId } });

export const createPregnancyOutcome = (cycleId, data) =>
  prisma.pregnancyOutcome.create({ data: { ...data, cycleId } });
