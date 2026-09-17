import { z } from "zod";

const enrollmentStatusSchema = z.enum([
  "active",
  "paused",
  "completed",
  "cancelled",
]);

export const createEnrollmentSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  enrolledAt: z.string().datetime().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateEnrollmentSchema = z.object({
  status: enrollmentStatusSchema.optional(),
  enrolledAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export type CreateEnrollmentInput = z.infer<
  typeof createEnrollmentSchema
>;

export type UpdateEnrollmentInput = z.infer<
  typeof updateEnrollmentSchema
>;