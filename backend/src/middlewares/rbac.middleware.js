import { AppError } from "../utils/AppError.js";
import { hasPermission, hasMinRole, ROLE_HIERARCHY } from "../utils/permissions.js";
import { prisma } from "../config/db.js";

/**
 * Middleware that restricts access to specific roles.
 * Usage: rbac('ADMIN', 'CONSULTANT')
 * Compares against req.user.role.name (string) for dynamic roles.
 */
export const rbac = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    const roleName = req.user.role?.name || req.user.role;
    if (!allowedRoles.includes(roleName)) {
      return next(
        new AppError(
          `Role '${roleName}' is not authorized for this resource. Required: ${allowedRoles.join(", ")}`,
          403,
        ),
      );
    }
    next();
  };
};

/**
 * Middleware that restricts access by minimum role level.
 * Usage: rbacMin('NURSE') — allows NURSE and above
 */
export const rbacMin = (minRole) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    const roleName = req.user.role?.name || req.user.role;
    if (!hasMinRole(roleName, minRole)) {
      return next(
        new AppError(
          `Insufficient privileges. Your role '${roleName}' is below the required minimum.`,
          403,
        ),
      );
    }
    next();
  };
};

/**
 * Fine-grained permission middleware.
 * Usage: can('patient:view')
 * Checks DB RolePermission records with hierarchy inheritance —
 * a role inherits all permissions from roles with lower or equal hierarchy.
 * Falls back to the static permission matrix ONLY when the DB query fails.
 */
export const can = (...permissions) => {
  return async (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    const roleName = req.user.role?.name || req.user.role;
    const roleId = req.user.roleId || req.user.role?.id;

    // Try DB check — if successful, DB is the source of truth
    let dbAvailable = true;

    try {
      // 1. Get all inherited role IDs (roles with hierarchy <= user's role)
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        select: { hierarchy: true },
      });

      if (role) {
        const lowerRoles = await prisma.role.findMany({
          where: { hierarchy: { lte: role.hierarchy } },
          select: { id: true },
        });
        const inheritedIds = lowerRoles.map((r) => r.id);

        // 2. Check if ANY inherited role has the requested permission
        const match = await prisma.rolePermission.findFirst({
          where: {
            roleId: { in: inheritedIds },
            permission: { key: { in: permissions } },
          },
        });

        if (match) {
          return next();
        }
      }
    } catch (err) {
      dbAvailable = false;
      console.warn(`[RBAC] DB hierarchy check failed for ${roleName}:`, err?.message || err);
    }

    if (!dbAvailable) {
      // DB unavailable — fall back to static permission matrix
      const hasStatic = permissions.some((perm) => hasPermission(roleName, perm));
      if (hasStatic) {
        return next();
      }
    }

    return next(
      new AppError(
        `Role '${roleName}' does not have required permission(s): ${permissions.join(", ")}`,
        403,
      ),
    );
  };
};

/**
 * Data-level ownership check middleware.
 * Verifies the user is the owner/creator of a resource or has bypass privileges.
 *
 * Usage: checkOwnership('Patient', 'createdById', 'id')
 */
export const checkOwnership = (model, ownerField = "createdById", idParam = "id", bypassRoles = ["ADMIN"]) => {
  return async (req, _res, next) => {
    try {
      if (!req.user) {
        return next(new AppError("Authentication required", 401));
      }

      const roleName = req.user.role?.name || req.user.role;

      // Admin bypass
      if (bypassRoles.includes(roleName)) {
        return next();
      }

      const resourceId = req.params[idParam];
      if (!resourceId) {
        return next(new AppError("Resource ID not provided", 400));
      }

      const resource = await prisma[model].findUnique({
        where: { id: resourceId },
        select: { [ownerField]: true },
      });

      if (!resource) {
        return next(new AppError(`${model} not found`, 404));
      }

      if (resource[ownerField] !== req.user.id) {
        return next(
          new AppError("You do not have access to this resource", 403),
        );
      }

      next();
    } catch (error) {
      next(new AppError("Ownership verification failed", 500));
    }
  };
};

/**
 * Combined middleware: authenticate + RBAC in one call.
 * Usage: auth('patient:view')  or  auth('ADMIN', 'CONSULTANT')
 * If a permission key matches, uses permission check; otherwise falls back to role check.
 */
export const auth = (...checks) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    const roleName = req.user.role?.name || req.user.role;

    // Separate permission keys (contain ':') from role names (no ':')
    const permissionKeys = checks.filter((c) => c.includes(":"));
    const roleNames = checks.filter((c) => !c.includes(":"));

    // Check permission keys through the permission matrix
    if (permissionKeys.length > 0) {
      const hasAny = permissionKeys.some((perm) => hasPermission(roleName, perm));
      if (hasAny) return next();
    }

    // Check role names directly
    if (roleNames.length > 0) {
      if (roleNames.includes(roleName)) return next();
    }

    if (roleNames.length === 0 && permissionKeys.length === 0) {
      return next(new AppError("No authorization checks provided", 500));
    }

    return next(
      new AppError(
        `Role '${roleName}' is not authorized for this resource.`,
        403,
      ),
    );
  };
};
