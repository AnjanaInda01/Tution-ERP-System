import { Temporal } from "temporal-polyfill";

import { db } from "../../db/db.js";

import type {
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
} from "./enrollment.schema.js";

export class EnrollmentNotFoundError extends Error {
  constructor() {
    super("Enrollment not found");
    this.name = "EnrollmentNotFoundError";
  }
}

export class EnrollmentConflictError extends Error {
  constructor(message = "Student is already enrolled in this class") {
    super(message);
    this.name = "EnrollmentConflictError";
  }
}

export class StudentForEnrollmentNotFoundError extends Error {
  constructor() {
    super("Student not found");
    this.name = "StudentForEnrollmentNotFoundError";
  }
}

export class ClassForEnrollmentNotFoundError extends Error {
  constructor() {
    super("Class not found");
    this.name = "ClassForEnrollmentNotFoundError";
  }
}

export async function listEnrollments(instituteId: string) {
  const enrollments = await db.orm.public.Enrollment.where({
    instituteId,
  }).all();

  return Promise.all(
    enrollments.map(async (enrollment) => {
      const student = await db.orm.public.Student.first({
        id: enrollment.studentId,
        instituteId,
      });

      const classRecord = await db.orm.public.Class.first({
        id: enrollment.classId,
        instituteId,
      });

      return {
        enrollment,
        student,
        class: classRecord,
      };
    }),
  );
}

export async function listStudentEnrollments(
  instituteId: string,
  studentId: string,
) {
  const student = await db.orm.public.Student.first({
    id: studentId,
    instituteId,
  });

  if (!student) {
    throw new StudentForEnrollmentNotFoundError();
  }

  const enrollments = await db.orm.public.Enrollment.where({
    instituteId,
    studentId,
  }).all();

  return Promise.all(
    enrollments.map(async (enrollment) => {
      const classRecord = await db.orm.public.Class.first({
        id: enrollment.classId,
        instituteId,
      });

      return {
        enrollment,
        class: classRecord,
      };
    }),
  );
}

export async function listClassEnrollments(
  instituteId: string,
  classId: string,
) {
  const classRecord = await db.orm.public.Class.first({
    id: classId,
    instituteId,
  });

  if (!classRecord) {
    throw new ClassForEnrollmentNotFoundError();
  }

  const enrollments = await db.orm.public.Enrollment.where({
    instituteId,
    classId,
  }).all();

  return Promise.all(
    enrollments.map(async (enrollment) => {
      const student = await db.orm.public.Student.first({
        id: enrollment.studentId,
        instituteId,
      });

      return {
        enrollment,
        student,
      };
    }),
  );
}

export async function getEnrollment(instituteId: string, enrollmentId: string) {
  const enrollment = await db.orm.public.Enrollment.first({
    id: enrollmentId,
    instituteId,
  });

  if (!enrollment) {
    throw new EnrollmentNotFoundError();
  }

  const student = await db.orm.public.Student.first({
    id: enrollment.studentId,
    instituteId,
  });

  const classRecord = await db.orm.public.Class.first({
    id: enrollment.classId,
    instituteId,
  });

  return {
    enrollment,
    student,
    class: classRecord,
  };
}

export async function createEnrollment(
  instituteId: string,
  input: CreateEnrollmentInput,
) {
  const student = await db.orm.public.Student.first({
    id: input.studentId,
    instituteId,
  });

  if (!student) {
    throw new StudentForEnrollmentNotFoundError();
  }

  const classRecord = await db.orm.public.Class.first({
    id: input.classId,
    instituteId,
  });

  if (!classRecord) {
    throw new ClassForEnrollmentNotFoundError();
  }

  /*
   * Prevent duplicate enrollment.
   */
  const existingEnrollment = await db.orm.public.Enrollment.first({
    studentId: input.studentId,
    classId: input.classId,
  });

  if (existingEnrollment) {
    throw new EnrollmentConflictError();
  }

  /*
   * Check class capacity if one is configured.
   */
  if (classRecord.capacity !== null) {
    const currentEnrollments = await db.orm.public.Enrollment.where({
      instituteId,
      classId: input.classId,
      status: "active",
    }).all();

    if (currentEnrollments.length >= classRecord.capacity) {
      throw new EnrollmentConflictError(
        "This class has reached its maximum capacity",
      );
    }
  }

  const enrollment = await db.orm.public.Enrollment.create({
    instituteId,
    studentId: input.studentId,
    classId: input.classId,
    status: "active",
    ...(input.enrolledAt !== undefined
      ? {
          enrolledAt: Temporal.Instant.from(input.enrolledAt),
        }
      : {}),
    ...(input.notes !== undefined
      ? {
          notes: input.notes,
        }
      : {}),
  });

  return {
    enrollment,
    student,
    class: classRecord,
  };
}

export async function updateEnrollment(
  instituteId: string,
  enrollmentId: string,
  input: UpdateEnrollmentInput,
) {
  const enrollment = await db.orm.public.Enrollment.first({
    id: enrollmentId,
    instituteId,
  });

  if (!enrollment) {
    throw new EnrollmentNotFoundError();
  }

  const updateData: {
    status?: "active" | "paused" | "completed" | "cancelled";
    enrolledAt?: Temporal.Instant;
    endedAt?: Temporal.Instant | null;
    notes?: string | null;
  } = {};

  if (input.status !== undefined) {
    updateData.status = input.status;

    /*
     * Automatically set endedAt when an enrollment ends.
     */
    if (input.status === "completed" || input.status === "cancelled") {
      updateData.endedAt =
        input.endedAt !== undefined
          ? input.endedAt === null
            ? null
            : Temporal.Instant.from(input.endedAt)
          : Temporal.Now.instant();
    }
  }

  if (input.enrolledAt !== undefined) {
    updateData.enrolledAt = Temporal.Instant.from(input.enrolledAt);
  }

  if (
    input.endedAt !== undefined &&
    input.status !== "completed" &&
    input.status !== "cancelled"
  ) {
    updateData.endedAt =
      input.endedAt === null ? null : Temporal.Instant.from(input.endedAt);
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }

  let updatedEnrollment = enrollment;

  if (Object.keys(updateData).length > 0) {
    const updated = await db.orm.public.Enrollment.where({
      id: enrollmentId,
      instituteId,
    }).update(updateData);

    if (!updated) {
      throw new EnrollmentNotFoundError();
    }

    updatedEnrollment = updated;
  }

  const student = await db.orm.public.Student.first({
    id: updatedEnrollment.studentId,
    instituteId,
  });

  const classRecord = await db.orm.public.Class.first({
    id: updatedEnrollment.classId,
    instituteId,
  });

  return {
    enrollment: updatedEnrollment,
    student,
    class: classRecord,
  };
}
