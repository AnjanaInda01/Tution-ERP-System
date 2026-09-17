import { z } from "zod";

const paymentMethodSchema = z.enum(["cash", "bank_transfer", "online"]);

const paymentStatusSchema = z.enum([
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  method: paymentMethodSchema,
  paymentDate: z.string().datetime().optional(),
  reference: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updatePaymentSchema = z.object({
  status: paymentStatusSchema.optional(),
  reference: z.string().trim().max(255).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
