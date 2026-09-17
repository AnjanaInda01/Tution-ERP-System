import { z } from "zod";

const invoiceStatusSchema = z.enum([
  "pending",
  "partially_paid",
  "paid",
  "cancelled",
  "overdue",
]);

export const createInvoiceSchema = z.object({
  studentId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  billingYear: z.number().int().min(2000).max(2100),
  billingMonth: z.number().int().min(1).max(12),
  amount: z.number().positive(),
  dueDate: z.string().date().optional(),
  description: z.string().trim().max(2000).optional(),
});

export const updateInvoiceSchema = z.object({
  status: invoiceStatusSchema.optional(),
  dueDate: z.string().date().nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
