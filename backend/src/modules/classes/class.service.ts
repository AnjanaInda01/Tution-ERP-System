import { db } from "../../db/db.js";

import type {
  CreateClassScheduleInput,
  UpdateClassScheduleInput,
} from "./class.schema.js";

export class ClassScheduleNotFoundError extends Error {
  constructor() {
    super("Class schedule not found");
    this.name = "ClassScheduleNotFoundError";
  }
}

export class ClassForScheduleNotFoundError extends Error {
  constructor() {
    super("Class not found in this institute");
    this.name = "ClassForScheduleNotFoundError";
  }
}

export class ClassScheduleConflictError extends Error {
  constructor(message = "Class schedule conflicts with an existing schedule") {
    super(message);
    this.name = "ClassScheduleConflictError";
  }
}

async function validateClass(instituteId: string, classId: string) {
  const classRecord = await db.orm.public.Class.first({
    id: classId,
    instituteId,
  });

  if (!classRecord) {
    throw new ClassForScheduleNotFoundError();
  }

  return classRecord;
}

async function validateScheduleConflict(
  instituteId: string,
  classId: string,
  day: CreateClassScheduleInput["day"],
  startTime: string,
  endTime: string,
  excludeScheduleId?: string,
) {
  const schedules = await db.orm.public.ClassSchedule.where({
    instituteId,
    classId,
    day,
  }).all();

  const conflict = schedules.find((schedule) => {
    if (excludeScheduleId !== undefined && schedule.id === excludeScheduleId) {
      return false;
    }

    /*
     * Two time ranges overlap when:
     *
     * newStart < existingEnd
     * AND
     * newEnd > existingStart
     */
    return startTime < schedule.endTime && endTime > schedule.startTime;
  });

  if (conflict) {
    throw new ClassScheduleConflictError(
      `Class already has a schedule on ${day} between ${conflict.startTime} and ${conflict.endTime}`,
    );
  }
}

export async function listClassSchedules(
  instituteId: string,
  classId?: string,
) {
  if (classId !== undefined) {
    await validateClass(instituteId, classId);

    return db.orm.public.ClassSchedule.where({
      instituteId,
      classId,
    }).all();
  }

  return db.orm.public.ClassSchedule.where({
    instituteId,
  }).all();
}

export async function getClassSchedule(
  instituteId: string,
  scheduleId: string,
) {
  const schedule = await db.orm.public.ClassSchedule.first({
    id: scheduleId,
    instituteId,
  });

  if (!schedule) {
    throw new ClassScheduleNotFoundError();
  }

  return schedule;
}

export async function createClassSchedule(
  instituteId: string,
  input: CreateClassScheduleInput,
) {
  await validateClass(instituteId, input.classId);

  await validateScheduleConflict(
    instituteId,
    input.classId,
    input.day,
    input.startTime,
    input.endTime,
  );

  const createData: {
    classId: string;
    instituteId: string;
    day:
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday";
    startTime: string;
    endTime: string;
    room?: string;
    meetingUrl?: string;
  } = {
    classId: input.classId,
    instituteId,
    day: input.day,
    startTime: input.startTime,
    endTime: input.endTime,
  };

  if (input.room !== undefined) {
    createData.room = input.room;
  }

  if (input.meetingUrl !== undefined) {
    createData.meetingUrl = input.meetingUrl;
  }

  return db.orm.public.ClassSchedule.create(createData);
}

export async function updateClassSchedule(
  instituteId: string,
  scheduleId: string,
  input: UpdateClassScheduleInput,
) {
  const schedule = await db.orm.public.ClassSchedule.first({
    id: scheduleId,
    instituteId,
  });

  if (!schedule) {
    throw new ClassScheduleNotFoundError();
  }

  const day = input.day ?? schedule.day;
  const startTime = input.startTime ?? schedule.startTime;
  const endTime = input.endTime ?? schedule.endTime;

  if (startTime >= endTime) {
    throw new ClassScheduleConflictError("End time must be after start time");
  }

  await validateScheduleConflict(
    instituteId,
    schedule.classId,
    day,
    startTime,
    endTime,
    scheduleId,
  );

  const updateData: {
    day?:
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday";
    startTime?: string;
    endTime?: string;
    room?: string | null;
    meetingUrl?: string | null;
  } = {};

  if (input.day !== undefined) {
    updateData.day = input.day;
  }

  if (input.startTime !== undefined) {
    updateData.startTime = input.startTime;
  }

  if (input.endTime !== undefined) {
    updateData.endTime = input.endTime;
  }

  if (input.room !== undefined) {
    updateData.room = input.room;
  }

  if (input.meetingUrl !== undefined) {
    updateData.meetingUrl = input.meetingUrl;
  }

  return db.orm.public.ClassSchedule.where({
    id: scheduleId,
    instituteId,
  }).update(updateData);
}

export async function deleteClassSchedule(
  instituteId: string,
  scheduleId: string,
) {
  const schedule = await db.orm.public.ClassSchedule.first({
    id: scheduleId,
    instituteId,
  });

  if (!schedule) {
    throw new ClassScheduleNotFoundError();
  }

  await db.orm.public.ClassSchedule.where({
    id: scheduleId,
    instituteId,
  }).delete();

  return {
    id: scheduleId,
  };
}
