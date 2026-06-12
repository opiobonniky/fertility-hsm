import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { logger } from "../../utils/logger.js";
import { sendPasswordResetEmail } from "../../utils/email.service.js";

/**
 * Authenticate a user using their staff code and password.
 */
export const loginUser = async ({ staffCode, password }) => {
  const user = await prisma.user.findUnique({
    where: { staffCode },
    include: {
      role: {
        select: { id: true, name: true, label: true, hierarchy: true },
      },
    },
  });

  if (!user) {
    throw new AppError("Invalid staff code or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account has been deactivated. Contact an administrator.", 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid staff code or password", 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token hash in DB
  const refreshHash = await bcrypt.hash(refreshToken, 6);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: refreshHash, lastLogin: new Date() },
  });

  logger.info(`User logged in: ${user.staffCode} (${user.role.name})`);
  return {
    user:    {
      id: user.id,
      staffCode: user.staffCode,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      roleLabel: user.role.label,
      roleId: user.role.id,
    },
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh an access token using a valid refresh token.
 */
export const refreshUserToken = async (refreshToken) => {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    include: {
      role: {
        select: { id: true, name: true, label: true, hierarchy: true },
      },
    },
  });

  if (!user || !user.refreshToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  // Verify stored refresh hash
  const valid = await bcrypt.compare(refreshToken, user.refreshToken);
  if (!valid) {
    throw new AppError("Invalid refresh token", 401);
  }

  const newAccessToken = generateAccessToken(user);
  return { accessToken: newAccessToken };
};

/**
 * Logout — clear the stored refresh token.
 */
export const logoutUser = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
  logger.info(`User logged out: ${userId}`);
};

/**
 * Get the currently authenticated user's profile.
 */
export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
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
    },
  });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
};

/**
 * Request a password reset.
 * Generates a reset token, stores its hash in the DB, and sends an email.
 */
export const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) {
    logger.info(`Password reset requested for unknown email: ${email}`);
    return { message: "If an account with that email exists, a password reset link has been sent." };
  }

  // Generate reset token (short-lived JWT)
  const resetToken = jwt.sign(
    { id: user.id, purpose: "password-reset" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  // Store reset token hash and expiry in DB
  const resetHash = await bcrypt.hash(resetToken, 6);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetHash,
      passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  });

  // Send email (fire-and-forget — errors logged inside email service)
  sendPasswordResetEmail({
    email: user.email,
    firstName: user.firstName,
    resetToken,
  });

  logger.info(`Password reset email sent to ${user.email}`);
  return { message: "If an account with that email exists, a password reset link has been sent." };
};

/**
 * Reset password using a valid reset token.
 */
export const resetPassword = async ({ token, newPassword }) => {
  // Decode token to get user ID
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError("Invalid or expired reset token", 400);
  }

  if (payload.purpose !== "password-reset") {
    throw new AppError("Invalid reset token", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });

  if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  // Check expiry
  if (new Date() > user.passwordResetExpires) {
    throw new AppError("Reset token has expired. Please request a new one.", 400);
  }

  // Verify token hash
  const valid = await bcrypt.compare(token, user.passwordResetToken);
  if (!valid) {
    throw new AppError("Invalid reset token", 400);
  }

  // Hash new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password and clear reset fields + refresh tokens
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshToken: null,
    },
  });

  logger.info(`Password reset completed for user ${user.email}`);
  return { message: "Password has been reset successfully. Please log in with your new password." };
};

// ── Helper: generate tokens ────────────────────────────────────

const generateAccessToken = (user) => {
  const roleName = user.role?.name || user.role;
  return jwt.sign(
    { id: user.id, email: user.email, staffCode: user.staffCode, role: roleName },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" },
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" },
  );
};
