import { z } from "zod";

export const createOptionSchema = z.object({
  category: z.string().min(1, "Category is required"),
  label: z.string().min(1, "Label is required"),
  value: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateOptionSchema = z.object({
  label: z.string().min(1).optional(),
  value: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, "Option ID is required"),
        sortOrder: z.number().int("Sort order must be an integer"),
      })
    )
    .min(1, "At least one item is required"),
});
