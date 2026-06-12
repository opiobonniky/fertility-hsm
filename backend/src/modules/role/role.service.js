import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

const roleSelect = {
  id: true,
  name: true,
  label: true,
  hierarchy: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Get all roles, ordered by hierarchy (highest first).
 */
export const getAllRoles = async () => {
  return prisma.role.findMany({
    select: {
      ...roleSelect,
      _count: { select: { users: true } },
    },
    orderBy: { hierarchy: "desc" },
  });
};

/**
 * Get a single role by ID, including assigned permission keys.
 */
export const getRoleById = async (id) => {
  const role = await prisma.role.findUnique({
    where: { id },
    select: {
      ...roleSelect,
      users: {
        select: { id: true, staffCode: true, firstName: true, lastName: true, email: true, isActive: true },
        orderBy: { createdAt: "desc" },
      },
      rolePermissions: {
        select: {
          permission: { select: { id: true, key: true, name: true, module: true } },
          assignedAt: true,
        },
        orderBy: { assignedAt: "asc" },
      },
    },
  });
  if (!role) throw new AppError("Role not found", 404);
  return role;
};

/**
 * Create a new role.
 * name is uppercased and trimmed for consistency.
 */
export const createRole = async (data) => {
  const name = data.name.toUpperCase().trim();

  // Check uniqueness
  const existing = await prisma.role.findUnique({ where: { name } });
  if (existing) throw new AppError(`Role "${name}" already exists`, 400);

  const role = await prisma.role.create({
    data: {
      name,
      label: data.label,
      hierarchy: data.hierarchy ?? 0,
      isSystem: false,
    },
    select: roleSelect,
  });

  logger.info(`Role created: ${role.name} (${role.label})`);
  return role;
};

/**
 * Update an existing role.
 * System roles can only have their label/hierarchy updated, not deleted.
 */
export const updateRole = async (id, data) => {
  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) throw new AppError("Role not found", 404);

  // If renaming, check uniqueness
  if (data.name) {
    const name = data.name.toUpperCase().trim();
    const dup = await prisma.role.findFirst({
      where: { name, id: { not: id } },
    });
    if (dup) throw new AppError(`Role "${name}" already exists`, 400);
    data.name = name;
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.label && { label: data.label }),
      ...(data.hierarchy !== undefined && { hierarchy: data.hierarchy }),
    },
    select: roleSelect,
  });

  logger.info(`Role updated: ${role.name}`);
  return role;
};

/**
 * Delete a role. System roles cannot be deleted.
 * Users with this role must be reassigned first.
 */
export const deleteRole = async (id) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });

  if (!role) throw new AppError("Role not found", 404);
  if (role.isSystem) throw new AppError("System roles cannot be deleted", 403);
  if (role._count.users > 0) {
    throw new AppError(
      `Cannot delete role "${role.name}" — ${role._count.users} user(s) are assigned to it. Reassign them first.`,
      400,
    );
  }

  await prisma.role.delete({ where: { id } });
  logger.info(`Role deleted: ${role.name}`);
  return { message: `Role "${role.name}" deleted` };
};
