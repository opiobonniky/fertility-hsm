import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

export const getById = async (id) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true, staffCode: true } },
      assignedBy: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      cycle: { select: { id: true, cycleNumber: true, artType: true } },
    },
  });
  if (!task) throw new AppError("Task not found", 404);
  return task;
};

export const getAll = async (filters) => {
  const { status, type, assigneeId, patientId } = filters;
  const pageNum = Number(filters.page) || 1;
  const limitNum = Number(filters.limit) || 20;
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (assigneeId) where.assigneeId = assigneeId;
  if (patientId) where.patientId = patientId;

  const [data, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        assignedBy: { select: { id: true, firstName: true, lastName: true } },
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.task.count({ where }),
  ]);

  return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
};

export const getMyTasks = async (userId, status) => {
  const where = { assigneeId: userId };
  if (status) where.status = status;

  return prisma.task.findMany({
    where,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      cycle: { select: { id: true, cycleNumber: true, artType: true } },
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });
};

export const create = async (data, userId) => {
  const task = await prisma.task.create({
    data: { ...data, assignedById: userId },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  logger.info(`Task created: ${task.title} assigned to ${task.assigneeId}`);
  return task;
};

export const update = async (id, data) => {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("Task not found", 404);
  return prisma.task.update({ where: { id }, data });
};

export const complete = async (id, userId, notes) => {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("Task not found", 404);

  return prisma.task.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completedById: userId,
      notes: notes || task.notes,
    },
  });
};
