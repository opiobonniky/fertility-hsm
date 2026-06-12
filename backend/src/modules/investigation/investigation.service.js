import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

export const getAll = async (patientId) => {
  const where = patientId ? { patientId } : {};
  return prisma.investigation.findMany({
    where,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      orderedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { date: "desc" },
  });
};

export const getById = async (id) => {
  const investigation = await prisma.investigation.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      orderedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!investigation) throw new AppError("Investigation not found", 404);
  return investigation;
};

export const create = async (data, userId) => {
  const investigation = await prisma.investigation.create({
    data: { ...data, createdById: userId },
  });
  logger.info(`Investigation created: ${investigation.type} for patient ${data.patientId}`);
  return investigation;
};

export const update = async (id, data) => {
  const investigation = await prisma.investigation.findUnique({ where: { id } });
  if (!investigation) throw new AppError("Investigation not found", 404);
  return prisma.investigation.update({ where: { id }, data });
};
