import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

/**
 * Get all options for a given category (only active ones).
 */
export const getByCategory = async (category) => {
  return prisma.selectionOption.findMany({
    where: { category, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, label: true, value: true, sortOrder: true },
  });
};

/**
 * Get all options grouped by category (for admin management).
 */
export const getAllGrouped = async () => {
  const options = await prisma.selectionOption.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  const grouped = {};
  for (const opt of options) {
    if (!grouped[opt.category]) {
      grouped[opt.category] = [];
    }
    grouped[opt.category].push(opt);
  }
  return grouped;
};

/**
 * Create a new selection option.
 */
export const create = async (data) => {
  const existing = await prisma.selectionOption.findUnique({
    where: { category_label: { category: data.category, label: data.label } },
  });
  if (existing) {
    throw new AppError(`Option "${data.label}" already exists in category "${data.category}"`, 400);
  }

  const option = await prisma.selectionOption.create({
    data: {
      category: data.category,
      label: data.label,
      value: data.value || null,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    },
  });

  logger.info(`SelectionOption created: [${option.category}] ${option.label}`);
  return option;
};

/**
 * Update an existing selection option.
 */
export const update = async (id, data) => {
  const existing = await prisma.selectionOption.findUnique({ where: { id } });
  if (!existing) throw new AppError("Option not found", 404);

  const updated = await prisma.selectionOption.update({
    where: { id },
    data: {
      ...(data.label && { label: data.label }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  logger.info(`SelectionOption updated: [${updated.category}] ${updated.label}`);
  return updated;
};

/**
 * Batch reorder options within a category.
 * Accepts an array of { id, sortOrder } and updates all at once.
 */
export const reorder = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Items array is required", 400);
  }

  const updates = items.map(({ id, sortOrder }) =>
    prisma.selectionOption.update({
      where: { id },
      data: { sortOrder },
    })
  );

  await prisma.$transaction(updates);
  logger.info(`SelectionOptions reordered: ${items.length} items`);
  return { message: `${items.length} options reordered` };
};

/**
 * Delete (hard delete) a selection option.
 */
export const remove = async (id) => {
  const existing = await prisma.selectionOption.findUnique({ where: { id } });
  if (!existing) throw new AppError("Option not found", 404);

  await prisma.selectionOption.delete({ where: { id } });
  logger.info(`SelectionOption deleted: [${existing.category}] ${existing.label}`);
  return { message: "Option deleted" };
};
