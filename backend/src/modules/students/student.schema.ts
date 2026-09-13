import { z } from "zod";

export const createStudentSchema = z.object({
  firstName: z.string().trim().min(2).max(100),

  lastName: z
    .string()
    .trim()
    .max(100)
    .optional(),

  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),

  phone: z
    .string()
    .trim()
    .max(30)
    .optional(),

  studentCode: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Student code can contain only letters, numbers, hyphens, and underscores",
    )
    .transform((value) => value.toUpperCase()),

  dateOfBirth: z
    .string()
    .date()
    .optional(),

  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .optional(),

  admissionAt: z
    .string()
    .datetime()
    .optional(),

  notes: z
    .string()
    .trim()
    .max(2000)
    .optional(),
});

export const updateStudentSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  lastName: z
    .string()
    .trim()
    .max(100)
    .optional(),

  phone: z
    .string()
    .trim()
    .max(30)
    .optional(),

  studentCode: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Student code can contain only letters, numbers, hyphens, and underscores",
    )
    .transform((value) => value.toUpperCase())
    .optional(),

  dateOfBirth: z
    .string()
    .date()
    .nullable()
    .optional(),

  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .nullable()
    .optional(),

  admissionAt: z
    .string()
    .datetime()
    .optional(),

  status: z
    .enum(["active", "inactive", "suspended", "left"])
    .optional(),

  notes: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional(),
});

export type CreateStudentInput = z.infer<
  typeof createStudentSchema
>;

export type UpdateStudentInput = z.infer<
  typeof updateStudentSchema
>;