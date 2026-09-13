import { Temporal } from "temporal-polyfill";

import { db } from "../../db/db.js";

import type {
  CreateStudentInput,
  UpdateStudentInput,
} from "./student.schema.js";

export class StudentNotFoundError extends Error {
  constructor() {
    super("Student not found");
    this.name = "StudentNotFoundError";
  }
}

export class StudentConflictError extends Error {
  constructor(message = "Student already exists") {
    super(message);
    this.name = "StudentConflictError";
  }
}

export async function listStudents(instituteId: string) {
  const students = await db.orm.public.Student.where({
    instituteId,
  }).all();

  return Promise.all(
    students.map(async (student) => {
      const membership = await db.orm.public.InstituteMembership.first({
        id: student.membershipId,
        instituteId,
      });

      if (!membership) {
        return {
          student,
          user: null,
        };
      }

      const user = await db.orm.public.User.first({
        id: membership.userId,
      });

      return {
        student,
        user: user
          ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              phone: user.phone,
            }
          : null,
      };
    }),
  );
}

export async function getStudent(instituteId: string, studentId: string) {
  const student = await db.orm.public.Student.first({
    id: studentId,
    instituteId,
  });

  if (!student) {
    throw new StudentNotFoundError();
  }

  const membership = await db.orm.public.InstituteMembership.first({
    id: student.membershipId,
    instituteId,
  });

  if (!membership) {
    throw new StudentNotFoundError();
  }

  const user = await db.orm.public.User.first({
    id: membership.userId,
  });

  return {
    student,
    user: user
      ? {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        }
      : null,
  };
}

export async function createStudent(
  instituteId: string,
  input: CreateStudentInput,
) {
  /*
   * User email is globally unique.
   */
  const existingUser = await db.orm.public.User.first({
    email: input.email,
  });

  if (existingUser) {
    throw new StudentConflictError("An account with this email already exists");
  }

  /*
   * Student code is unique inside one institute.
   */
  const existingStudent = await db.orm.public.Student.first({
    instituteId,
    studentCode: input.studentCode,
  });

  if (existingStudent) {
    throw new StudentConflictError("A student with this code already exists");
  }

  const result = await db.transaction(async (tx) => {
    /*
     * Student accounts are created without a password.
     * The password/invitation flow will be implemented later.
     */
    const user = await tx.orm.public.User.create({
      email: input.email,
      firstName: input.firstName,
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      isPlatformAdmin: false,
    });

    const membership = await tx.orm.public.InstituteMembership.create({
      instituteId,
      userId: user.id,
      role: "student",
      status: "active",
      joinedAt: Temporal.Now.instant(),
    });

    const createData: {
      membershipId: string;
      instituteId: string;
      studentCode: string;
      dateOfBirth?: Temporal.Instant;
      gender?: "male" | "female" | "other" | "prefer_not_to_say";
      admissionAt?: Temporal.Instant;
      notes?: string;
      status: "active";
    } = {
      membershipId: membership.id,
      instituteId,
      studentCode: input.studentCode,
      status: "active",
    };

    if (input.dateOfBirth !== undefined) {
      createData.dateOfBirth = Temporal.Instant.from(
        `${input.dateOfBirth}T00:00:00Z`,
      );
    }

    if (input.gender !== undefined) {
      createData.gender = input.gender;
    }

    if (input.admissionAt !== undefined) {
      createData.admissionAt = Temporal.Instant.from(input.admissionAt);
    }

    if (input.notes !== undefined) {
      createData.notes = input.notes;
    }

    const student = await tx.orm.public.Student.create(createData);

    return {
      user,
      membership,
      student,
    };
  });

  return {
    student: result.student,
    user: {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      phone: result.user.phone,
    },
    membership: {
      id: result.membership.id,
      role: result.membership.role,
      status: result.membership.status,
      joinedAt: result.membership.joinedAt,
    },
  };
}

export async function updateStudent(
  instituteId: string,
  studentId: string,
  input: UpdateStudentInput,
) {
  const student = await db.orm.public.Student.first({
    id: studentId,
    instituteId,
  });

  if (!student) {
    throw new StudentNotFoundError();
  }

  const membership = await db.orm.public.InstituteMembership.first({
    id: student.membershipId,
    instituteId,
  });

  if (!membership) {
    throw new StudentNotFoundError();
  }

  if (
    input.studentCode !== undefined &&
    input.studentCode !== student.studentCode
  ) {
    const existingStudent = await db.orm.public.Student.first({
      instituteId,
      studentCode: input.studentCode,
    });

    if (existingStudent && existingStudent.id !== studentId) {
      throw new StudentConflictError("A student with this code already exists");
    }
  }

  return db.transaction(async (tx) => {
    /*
     * Update User information.
     */
    const userUpdateData: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    } = {};

    if (input.firstName !== undefined) {
      userUpdateData.firstName = input.firstName;
    }

    if (input.lastName !== undefined) {
      userUpdateData.lastName = input.lastName;
    }

    if (input.phone !== undefined) {
      userUpdateData.phone = input.phone;
    }

    if (Object.keys(userUpdateData).length > 0) {
      await tx.orm.public.User.where({
        id: membership.userId,
      }).update(userUpdateData);
    }

    /*
     * Update Student profile.
     */
    const studentUpdateData: {
      studentCode?: string;
      dateOfBirth?: Temporal.Instant | null;
      gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
      admissionAt?: Temporal.Instant;
      status?: "active" | "inactive" | "suspended" | "left";
      notes?: string | null;
    } = {};

    if (input.studentCode !== undefined) {
      studentUpdateData.studentCode = input.studentCode;
    }

    if (input.dateOfBirth !== undefined) {
      studentUpdateData.dateOfBirth =
        input.dateOfBirth === null
          ? null
          : Temporal.Instant.from(`${input.dateOfBirth}T00:00:00Z`);
    }

    if (input.gender !== undefined) {
      studentUpdateData.gender = input.gender;
    }

    if (input.admissionAt !== undefined) {
      studentUpdateData.admissionAt = Temporal.Instant.from(input.admissionAt);
    }

    if (input.status !== undefined) {
      studentUpdateData.status = input.status;
    }

    if (input.notes !== undefined) {
      studentUpdateData.notes = input.notes;
    }

    let updatedStudent = student;

    if (Object.keys(studentUpdateData).length > 0) {
      const updated = await tx.orm.public.Student.where({
        id: studentId,
        instituteId,
      }).update(studentUpdateData);

      if (!updated) {
        throw new StudentNotFoundError();
      }

      updatedStudent = updated;
    }

    const updatedUser = await tx.orm.public.User.first({
      id: membership.userId,
    });

    return {
      student: updatedStudent,
      user: updatedUser
        ? {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phone: updatedUser.phone,
          }
        : null,
    };
  });
}
