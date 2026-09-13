import { z } from "zod";

export const createTeacherSchema = z.object({
  firstName: z.string().trim().min(2).max(100),

  lastName: z.string().trim().max(100).optional(),

  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),

  phone: z.string().trim().max(30).optional(),

  teacherCode: z.string()
    .trim()
    .min(2)
    .max(30)
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Teacher code can contain only letters, numbers, hyphens, and underscores",
    )
    .transform((value) => value.toUpperCase()),

  qualification: z.string().trim().max(200).optional(),

  specialization: z.string().trim().max(200).optional(),

  bio: z.string().trim().max(1000).optional(),

  teacherType: z
    .enum([
      "permanent",
      "part_time",
      "visiting",
      "contract",
    ])
    .default("part_time"),
});

export const updateTeacherSchema = z.object({
  firstName: z.string().trim().min(2).max(100).optional(),

  lastName: z.string().trim().max(100).optional(),

  phone: z.string().trim().max(30).optional(),

  teacherCode: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Teacher code can contain only letters, numbers, hyphens, and underscores",
    )
    .transform((value) => value.toUpperCase())
    .optional(),

  qualification: z.string().trim().max(200).optional(),

  specialization: z.string().trim().max(200).optional(),

  bio: z.string().trim().max(1000).optional(),

  teacherType: z
    .enum([
      "permanent",
      "part_time",
      "visiting",
      "contract",
    ])
    .optional(),

  status: z
    .enum([
      "active",
      "inactive",
      "suspended",
      "left",
    ])
    .optional(),
});

export type CreateTeacherInput = z.infer<
  typeof createTeacherSchema
>;

export type UpdateTeacherInput = z.infer<
  typeof updateTeacherSchema
>;