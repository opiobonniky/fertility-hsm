import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";

// ── Hierarchy Helpers ──────────────────────────────────────────

/**
 * Get all role IDs whose hierarchy is <= the given role's hierarchy.
 * This enables permission inheritance — higher roles inherit from lower ones.
 */
export const getInheritedRoleIds = async (roleId) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { hierarchy: true },
  });
  if (!role) return [roleId];

  const lowerRoles = await prisma.role.findMany({
    where: { hierarchy: { lte: role.hierarchy } },
    select: { id: true },
  });
  return lowerRoles.map((r) => r.id);
};



/**
 * Check if a role (or any inherited role) has a specific permission.
 */
export const hasPermissionWithInheritance = async (roleId, permissionKey) => {
  const inheritedIds = await getInheritedRoleIds(roleId);
  const count = await prisma.rolePermission.count({
    where: {
      roleId: { in: inheritedIds },
      permission: { key: permissionKey },
    },
  });
  return count > 0;
};

// ── CRUD Operations ───────────────────────────────────────────

/**
 * Get all permissions.
 */
export const getAllPermissions = async () => {
  return prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });
};

/**
 * Get all permissions grouped by module, with assigned role info.
 */
export const getPermissionsGrouped = async () => {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { name: "asc" }],
    include: {
      rolePermissions: {
        select: {
          role: { select: { id: true, name: true, label: true, hierarchy: true } },
          assignedAt: true,
        },
      },
    },
  });

  // Group by module
  const grouped = {};
  for (const perm of permissions) {
    if (!grouped[perm.module]) {
      grouped[perm.module] = [];
    }
    grouped[perm.module].push({
      id: perm.id,
      key: perm.key,
      name: perm.name,
      description: perm.description,
      assignedRoles: perm.rolePermissions.map((rp) => ({
        id: rp.role.id,
        name: rp.role.name,
        label: rp.role.label,
        hierarchy: rp.role.hierarchy,
      })),
    });
  }
  return grouped;
};

/**
 * Get all permissions for a specific role (by roleId), including inherited ones.
 */
export const getPermissionsForRole = async (roleId) => {
  const inheritedIds = await getInheritedRoleIds(roleId);
  const rolePerms = await prisma.rolePermission.findMany({
    where: { roleId: { in: inheritedIds } },
    include: {
      permission: {
        select: {
          id: true,
          key: true,
          name: true,
          module: true,
        },
      },
    },
  });

  // De-duplicate by permission ID
  const seen = new Set();
  const permissions = [];
  for (const rp of rolePerms) {
    if (!seen.has(rp.permission.id)) {
      seen.add(rp.permission.id);
      permissions.push(rp.permission);
    }
  }
  return permissions;
};

/**
 * Get all permissions that a role does NOT have (by roleId).
 * Excludes permissions already inherited from lower roles.
 */
export const getAvailablePermissionsForRole = async (roleId) => {
  const inheritedIds = await getInheritedRoleIds(roleId);

  // Permissions already owned (directly or through inheritance)
  const owned = await prisma.rolePermission.findMany({
    where: { roleId: { in: inheritedIds } },
    select: { permissionId: true },
  });
  const ownedIds = owned.map((rp) => rp.permissionId);

  return prisma.permission.findMany({
    where: { id: { notIn: ownedIds } },
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });
};

/**
 * Assign a permission to a role using roleId.
 */
export const assignPermissionToRole = async (roleId, permissionId, assignedById) => {
  // Verify permission exists
  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
  });
  if (!permission) {
    throw new AppError("Permission not found", 404);
  }

  // Verify role exists
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new AppError("Role not found", 404);
  }

  // Check if already assigned (including inheritance)
  const hasInherited = await hasPermissionWithInheritance(roleId, permission.key);
  if (hasInherited) {
    throw new AppError("Permission already assigned to this role or inherited from a lower role", 400);
  }

  const rp = await prisma.rolePermission.create({
    data: {
      roleId,
      permissionId,
      assignedById,
    },
    include: {
      permission: {
        select: { key: true, name: true, module: true },
      },
      role: {
        select: { id: true, name: true, label: true, hierarchy: true },
      },
    },
  });

  logger.info(`Permission "${rp.permission.key}" assigned to role ${rp.role.name}`);
  return rp;
};

/**
 * Remove a permission from a role using roleId.
 */
export const removePermissionFromRole = async (roleId, permissionId) => {
  const existing = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: { roleId, permissionId },
    },
    include: {
      permission: {
        select: { key: true, name: true },
      },
      role: {
        select: { id: true, name: true, label: true, hierarchy: true },
      },
    },
  });
  if (!existing) {
    throw new AppError("Permission is not assigned to this role", 404);
  }

  await prisma.rolePermission.delete({
    where: {
      roleId_permissionId: { roleId, permissionId },
    },
  });

  logger.info(`Permission "${existing.permission.key}" removed from role ${existing.role.name}`);
  return { message: `Permission "${existing.permission.name}" removed from role ${existing.role.name}` };
};

/**
 * Check if a role has a specific permission in the database (direct only).
 */
export const hasPermissionInDb = async (roleId, permissionKey) => {
  const count = await prisma.rolePermission.count({
    where: {
      roleId,
      permission: { key: permissionKey },
    },
  });
  return count > 0;
};

/**
 * Sync all permissions from the static definition to the database.
 */
export const syncPermissions = async (permissions) => {
  let count = 0;
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      create: {
        key: perm.key,
        name: perm.name,
        description: perm.description || null,
        module: perm.module,
      },
      update: {
        name: perm.name,
        description: perm.description || null,
        module: perm.module,
      },
    });
    count++;
  }
  logger.info(`Synced ${count} permissions to database`);
  return { count };
};
