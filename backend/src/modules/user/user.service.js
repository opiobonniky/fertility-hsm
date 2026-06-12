import bcrypt from "bcryptjs";
import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";
import { sendWelcomeEmail } from "../../utils/email.service.js";

const userSelect = {
  id: true,
  staffCode: true,
  email: true,
  firstName: true,
  lastName: true,
  roleId: true,
  phone: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
};

export const getAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      ...userSelect,
      role: { select: { id: true, name: true, label: true, hierarchy: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...userSelect,
      role: { select: { id: true, name: true, label: true, hierarchy: true } },
    },
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
};

/**
 * Role-based staff code prefixes.
 */
const ROLE_CODE_PREFIXES = {
  ADMIN: "ADM",
  CONSULTANT: "DOC",
  SPECIALIST: "SPC",
  NURSE: "NUR",
  EMBRYOLOGIST: "EMB",
  COUNSELLOR: "CNS",
  SONOGRAPHER: "SNG",
  LAB_TECH: "LAB",
  BILLING: "BIL",
  RECEPTIONIST: "REC",
  VIEWER: "VWR",
};

/**
 * Get the abbreviation for a role name (for staff code prefix).
 * Uses known prefixes or falls back to first 3 uppercase chars.
 */
function getRolePrefix(roleName) {
  return ROLE_CODE_PREFIXES[roleName] || roleName.slice(0, 3).toUpperCase();
}

/**
 * Generate a unique staff code for a given role.
 * Format: {PREFIX}-{SEQUENTIAL_NUMBER} e.g., DOC-001, NUR-005, EMB-012
 */
async function generateStaffCode(roleName) {
  const prefix = getRolePrefix(roleName);

  // Find the highest existing number for this prefix
  const lastUser = await prisma.user.findFirst({
    where: { staffCode: { startsWith: prefix + "-" } },
    select: { staffCode: true },
    orderBy: { staffCode: "desc" },
  });

  let nextNumber = 1;
  if (lastUser) {
    const parts = lastUser.staffCode.split("-");
    const num = parseInt(parts[1], 10);
    if (!isNaN(num)) {
      nextNumber = num + 1;
    }
  }

  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

/**
 * Create a new staff user (admin only).
 * Requires roleId, email, password, firstName, lastName.
 * staffCode is auto-generated if not provided.
 */
export const createUser = async (data) => {
  // Verify role exists first (needed to generate staff code)
  const role = await prisma.role.findUnique({ where: { id: data.roleId } });
  if (!role) throw new AppError("Role not found", 400);

  // Auto-generate staff code if not provided
  const staffCode = data.staffCode || (await generateStaffCode(role.name));

  // Check unique staffCode
  const existingCode = await prisma.user.findUnique({ where: { staffCode } });
  if (existingCode) throw new AppError("Staff code already in use", 400);

  // Check unique email
  const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingEmail) throw new AppError("Email already in use", 400);

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const user = await prisma.user.create({
    data: {
      staffCode,
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      roleId: data.roleId,
      phone: data.phone || null,
      isActive: true,
    },
    select: {
      ...userSelect,
      role: { select: { id: true, name: true, label: true } },
    },
  });

  logger.info(`Staff user created: ${user.staffCode} (${user.firstName} ${user.lastName})`);

  // Send welcome email with login credentials (fire-and-forget — errors logged inside email service)
  sendWelcomeEmail({
    email: user.email,
    firstName: user.firstName,
    staffCode: user.staffCode,
    password: data.password, // plaintext password for email only
    roleLabel: user.role.label,
  });

  return user;
};

export const updateUser = async (id, data) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new AppError("User not found", 404);

  // If roleId is being updated, verify role exists
  if (data.roleId) {
    const role = await prisma.role.findUnique({ where: { id: data.roleId } });
    if (!role) throw new AppError("Role not found", 400);
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      ...userSelect,
      role: { select: { id: true, name: true, label: true } },
    },
  });
  logger.info(`User updated: ${updated.staffCode}`);
  return updated;
};

export const deactivateUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", 404);

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: false, refreshToken: null },
    select: {
      ...userSelect,
      role: { select: { id: true, name: true, label: true } },
    },
  });
  logger.info(`User deactivated: ${updated.staffCode}`);
  return updated;
};

/**
 * Get active physicians (CONSULTANT, SPECIALIST, ADMIN roles) for cycle assignment.
 * Used by the cycle creation form — accessible to users with cycle:create permission.
 */
export const getPhysicians = async () => {
  return prisma.user.findMany({
    where: {
      isActive: true,
      role: {
        name: { in: ["CONSULTANT", "SPECIALIST", "ADMIN"] },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      staffCode: true,
      role: { select: { name: true, label: true } },
    },
    orderBy: [{ firstName: "asc" }],
  });
};

/**
 * Fetch roles dynamically from the Role model (not hardcoded).
 */
export const getRoles = async () => {
  const roles = await prisma.role.findMany({
    orderBy: { hierarchy: "desc" },
    select: { id: true, name: true, label: true, hierarchy: true, isSystem: true },
  });
  return roles;
};
