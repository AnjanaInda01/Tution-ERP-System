import { z } from "zod";

const weekdaySchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format");

export const createClassScheduleSchema = z
  .object({
    classId: z.string().uuid(),

    day: weekdaySchema,

    startTime: timeSchema,

    endTime: timeSchema,

    room: z.string().trim().max(100).optional(),

    meetingUrl: z.string().trim().url().max(500).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const updateClassScheduleSchema = z
  .object({
    day: weekdaySchema.optional(),

    startTime: timeSchema.optional(),

    endTime: timeSchema.optional(),

    room: z.string().trim().max(100).nullable().optional(),

    meetingUrl: z.string().trim().url().max(500).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime !== undefined && data.endTime !== undefined) {
        return data.startTime < data.endTime;
      }

      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

export type CreateClassScheduleInput = z.infer<
  typeof createClassScheduleSchema
>;

export type UpdateClassScheduleInput = z.infer<
  typeof updateClassScheduleSchema
>;
