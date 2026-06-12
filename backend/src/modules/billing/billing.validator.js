import { z } from "zod";

export const createInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  dueDate: z.string().datetime().optional(),
  branch: z.string().optional(),
  currency: z.string().default("AED"),
  vatRate: z.number().min(0).max(1).default(0),
  discountAmount: z.number().min(0).optional(),
  insuranceClaim: z.boolean().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({ description: z.string().min(1), quantity: z.number().int().positive(), unitPrice: z.number().positive() })).min(1, "At least one line item is required"),
});

export const updateInvoiceSchema = z.object({
  dueDate: z.string().datetime().optional(),
  branch: z.string().optional(),
  currency: z.string().optional(),
  vatRate: z.number().min(0).max(1).optional(),
  discountAmount: z.number().min(0).optional(),
  insuranceClaim: z.boolean().optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({ description: z.string().min(1), quantity: z.number().int().positive(), unitPrice: z.number().positive() })).optional(),
});

export const addPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["CASH", "CREDIT_CARD", "WIRE_TRANSFER", "CHEQUE", "INSURANCE"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
