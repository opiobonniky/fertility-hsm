import { z } from "zod";

export const createUserSchema = z.object({
  staffCode: z
    .string()
    .trim()
    .min(2, "Staff code must be at least 2 characters")
    .max(20, "Staff code must not exceed 20 characters")
    .optional(),
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  roleId: z.string().uuid("Invalid role ID"),
  phone: z.string().trim().optional(),
});

export const updateUserSchema = z.object({
  staffCode: z.string().trim().min(2).max(20).optional(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  roleId: z.string().uuid().optional(),
  phone: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});
