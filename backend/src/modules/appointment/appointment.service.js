import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

export const getById = async (id) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true, firstName: true, lastName: true, mrn: true,
          phone: true, email: true, dateOfBirth: true, gender: true,
        },
      },
      physician: { select: { id: true, firstName: true, lastName: true, staffCode: true } },
      clinic: { select: { id: true, name: true, branch: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!appointment) throw new AppError("Appointment not found", 404);
  return appointment;
};

export const getAll = async (filters) => {
  const { patientId, physicianId, startDate, endDate, status } = filters;
  const pageNum = Number(filters.page) || 1;
  const limitNum = Number(filters.limit) || 20;
  const where = {};
  if (patientId) where.patientId = patientId;
  if (physicianId) where.physicianId = physicianId;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime.gte = new Date(startDate);
    if (endDate) where.startTime.lte = new Date(endDate);
  }

  const [data, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true, phone: true } },
        physician: { select: { id: true, firstName: true, lastName: true } },
        clinic: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.appointment.count({ where }),
  ]);

  return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
};

export const getCalendar = async (startDate, endDate) => {
  return prisma.appointment.findMany({
    where: {
      startTime: { gte: new Date(startDate) },
      endTime: { lte: new Date(endDate) },
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      physician: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { startTime: "asc" },
  });
};

export const create = async (data, userId) => {
  const appointment = await prisma.appointment.create({
    data: { ...data, createdById: userId },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  logger.info(`Appointment created: ${appointment.id} for patient ${data.patientId}`);
  return appointment;
};

export const update = async (id, data) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw new AppError("Appointment not found", 404);
  return prisma.appointment.update({ where: { id }, data });
};

export const updateStatus = async (id, status) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) throw new AppError("Appointment not found", 404);
  return prisma.appointment.update({ where: { id }, data: { status } });
};
