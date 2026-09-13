import { z } from "zod";

const academicCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(30)
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Code can contain only letters, numbers, hyphens, and underscores",
  )
  .transform((value) => value.toUpperCase());

export const createEducationLevelSchema = z.object({
  name: z.string().trim().min(2).max(100),

  code: academicCodeSchema,

  displayOrder: z.number().int().min(0).default(0),
});

export const updateEducationLevelSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),

  code: academicCodeSchema.optional(),

  displayOrder: z.number().int().min(0).optional(),

  status: z.enum(["active", "inactive"]).optional(),
});

export type CreateEducationLevelInput = z.infer<
  typeof createEducationLevelSchema
>;

export type UpdateEducationLevelInput = z.infer<
  typeof updateEducationLevelSchema
>;

export const createGradeSchema = z.object({
  educationLevelId: z.string().uuid(),

  name: z.string().trim().min(1).max(100),

  code: academicCodeSchema,

  displayOrder: z.number().int().min(0).default(0),
});

export const updateGradeSchema = z.object({
  educationLevelId: z.string().uuid().optional(),

  name: z.string().trim().min(1).max(100).optional(),

  code: academicCodeSchema.optional(),

  displayOrder: z.number().int().min(0).optional(),

  status: z.enum(["active", "inactive"]).optional(),
});

export type CreateGradeInput = z.infer<typeof createGradeSchema>;

export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;

export const createStreamSchema = z.object({
  name: z.string().trim().min(1).max(100),

  code: academicCodeSchema,

  displayOrder: z.number().int().min(0).default(0),
});

export const updateStreamSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),

  code: academicCodeSchema.optional(),

  displayOrder: z.number().int().min(0).optional(),

  status: z.enum(["active", "inactive"]).optional(),
});

export type CreateStreamInput = z.infer<typeof createStreamSchema>;

export type UpdateStreamInput = z.infer<typeof updateStreamSchema>;

export const createClassSchema = z.object({
  teacherId: z.string().uuid(),

  subjectId: z.string().uuid(),

  gradeId: z.string().uuid(),

  streamId: z.string().uuid().optional(),

  name: z.string().trim().min(2).max(150),

  code: academicCodeSchema,

  monthlyFee: z.number().nonnegative().optional(),

  capacity: z.number().int().positive().optional(),

  deliveryMode: z
    .enum(["physical", "online", "hybrid"])
    .default("physical"),

  startsAt: z.string().datetime().optional(),

  endsAt: z.string().datetime().optional(),
});

export const updateClassSchema = z.object({
  teacherId: z.string().uuid().optional(),

  subjectId: z.string().uuid().optional(),

  gradeId: z.string().uuid().optional(),

  streamId: z.string().uuid().nullable().optional(),

  name: z.string().trim().min(2).max(150).optional(),

  code: academicCodeSchema.optional(),

  monthlyFee: z.number().nonnegative().nullable().optional(),

  capacity: z.number().int().positive().nullable().optional(),

  deliveryMode: z
    .enum(["physical", "online", "hybrid"])
    .optional(),

  status: z
    .enum([
      "draft",
      "active",
      "completed",
      "cancelled",
      "archived",
    ])
    .optional(),

  startsAt: z.string().datetime().nullable().optional(),

  endsAt: z.string().datetime().nullable().optional(),
});

export type CreateClassInput = z.infer<
  typeof createClassSchema
>;

export type UpdateClassInput = z.infer<
  typeof updateClassSchema
>;

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1).max(100),

  code: academicCodeSchema,

  description: z.string().trim().max(500).optional(),
});

export const updateSubjectSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),

  code: academicCodeSchema.optional(),

  description: z.string().trim().max(500).optional(),

  status: z.enum(["active", "inactive"]).optional(),
});

export type CreateSubjectInput = z.infer<
  typeof createSubjectSchema
>;

export type UpdateSubjectInput = z.infer<
  typeof updateSubjectSchema
>;

