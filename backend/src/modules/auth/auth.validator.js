import { z } from "zod";

/**
 * Login with staffCode instead of email.
 */
export const loginSchema = z.object({
  staffCode: z.string().trim().min(1, "Staff code is required"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/**
 * Forgot password — receives email to send reset link to.
 */
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
});

/**
 * Reset password — receives the token and the new password.
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters"),
});
