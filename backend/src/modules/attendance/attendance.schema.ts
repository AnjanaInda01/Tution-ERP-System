import { z } from "zod";

const attendanceStatusSchema = z.enum([
  "present",
  "absent",
  "late",
  "excused",
]);

export const createAttendanceSessionSchema = z.object({
  classId: z.string().uuid(),
  sessionDate: z.string().date(),
  startTime: z.string().trim().max(20).optional(),
  endTime: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateAttendanceSessionSchema = z.object({
  sessionDate: z.string().date().optional(),
  startTime: z.string().trim().max(20).nullable().optional(),
  endTime: z.string().trim().max(20).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const createAttendanceRecordSchema = z.object({
  studentId: z.string().uuid(),
  status: attendanceStatusSchema,
  remarks: z.string().trim().max(1000).optional(),
});

export const updateAttendanceRecordSchema = z.object({
  status: attendanceStatusSchema.optional(),
  remarks: z.string().trim().max(1000).nullable().optional(),
});

export type CreateAttendanceSessionInput =
  z.infer<typeof createAttendanceSessionSchema>;

export type UpdateAttendanceSessionInput =
  z.infer<typeof updateAttendanceSessionSchema>;

export type CreateAttendanceRecordInput =
  z.infer<typeof createAttendanceRecordSchema>;

export type UpdateAttendanceRecordInput =
  z.infer<typeof updateAttendanceRecordSchema>;