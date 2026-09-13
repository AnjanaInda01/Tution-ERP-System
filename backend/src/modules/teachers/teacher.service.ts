import { Temporal } from "temporal-polyfill";

import { db } from "../../db/db.js";
import type {
  CreateTeacherInput,
  UpdateTeacherInput,
} from "./teacher.schema.js";

export class TeacherNotFoundError extends Error {
  constructor() {
    super("Teacher not found");
    this.name = "TeacherNotFoundError";
  }
}

export class TeacherConflictError extends Error {
  constructor(message = "Teacher already exists") {
    super(message);
    this.name = "TeacherConflictError";
  }
}

export async function listTeachers(instituteId: string) {
  const teachers = await db.orm.public.Teacher.where({
    instituteId,
  }).all();

  return Promise.all(
    teachers.map(async (teacher) => {
      const membership = await db.orm.public.InstituteMembership.first({
        id: teacher.membershipId,
        instituteId,
      });

      if (!membership) {
        return {
          teacher,
          user: null,
        };
      }

      const user = await db.orm.public.User.first({
        id: membership.userId,
      });

      return {
        teacher,
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

export async function getTeacher(instituteId: string, teacherId: string) {
  const teacher = await db.orm.public.Teacher.first({
    id: teacherId,
    instituteId,
  });

  if (!teacher) {
    throw new TeacherNotFoundError();
  }

  const membership = await db.orm.public.InstituteMembership.first({
    id: teacher.membershipId,
    instituteId,
  });

  if (!membership) {
    throw new TeacherNotFoundError();
  }

  const user = await db.orm.public.User.first({
    id: membership.userId,
  });

  return {
    teacher,
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

export async function createTeacher(
  instituteId: string,
  input: CreateTeacherInput,
) {
  /*
   * Email belongs to the global User account.
   * Do not create another User with the same email.
   */
  const existingUser = await db.orm.public.User.first({
    email: input.email,
  });

  if (existingUser) {
    throw new TeacherConflictError("An account with this email already exists");
  }

  /*
   * Teacher code is unique inside one institute.
   */
  const existingTeacher = await db.orm.public.Teacher.first({
    instituteId,
    teacherCode: input.teacherCode,
  });

  if (existingTeacher) {
    throw new TeacherConflictError("A teacher with this code already exists");
  }

  /*
   * Create User + Membership + Teacher profile
   * as one atomic transaction.
   */
  const result = await db.transaction(async (tx) => {
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
      role: "teacher",
      status: "active",
      joinedAt: Temporal.Now.instant(),
    });

    const teacher = await tx.orm.public.Teacher.create({
      membershipId: membership.id,
      instituteId,
      teacherCode: input.teacherCode,
      ...(input.qualification !== undefined
        ? { qualification: input.qualification }
        : {}),
      ...(input.specialization !== undefined
        ? { specialization: input.specialization }
        : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      teacherType: input.teacherType,
      status: "active",
      joinedAt: Temporal.Now.instant(),
    });

    return {
      user,
      membership,
      teacher,
    };
  });

  return {
    teacher: result.teacher,
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

export async function updateTeacher(
  instituteId: string,
  teacherId: string,
  input: UpdateTeacherInput,
) {
  const teacher = await db.orm.public.Teacher.first({
    id: teacherId,
    instituteId,
  });

  if (!teacher) {
    throw new TeacherNotFoundError();
  }

  const membership = await db.orm.public.InstituteMembership.first({
    id: teacher.membershipId,
    instituteId,
  });

  if (!membership) {
    throw new TeacherNotFoundError();
  }

  /*
   * Teacher code must remain unique within the institute.
   */
  if (
    input.teacherCode !== undefined &&
    input.teacherCode !== teacher.teacherCode
  ) {
    const existingTeacher = await db.orm.public.Teacher.first({
      instituteId,
      teacherCode: input.teacherCode,
    });

    if (existingTeacher && existingTeacher.id !== teacherId) {
      throw new TeacherConflictError("A teacher with this code already exists");
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
     * Update Teacher profile.
     */
    const teacherUpdateData: {
      teacherCode?: string;
      qualification?: string;
      specialization?: string;
      bio?: string;
      teacherType?: "permanent" | "part_time" | "visiting" | "contract";
      status?: "active" | "inactive" | "suspended" | "left";
      leftAt?: Temporal.Instant | null;
    } = {};

    if (input.teacherCode !== undefined) {
      teacherUpdateData.teacherCode = input.teacherCode;
    }

    if (input.qualification !== undefined) {
      teacherUpdateData.qualification = input.qualification;
    }

    if (input.specialization !== undefined) {
      teacherUpdateData.specialization = input.specialization;
    }

    if (input.bio !== undefined) {
      teacherUpdateData.bio = input.bio;
    }

    if (input.teacherType !== undefined) {
      teacherUpdateData.teacherType = input.teacherType;
    }

    if (input.status !== undefined) {
      teacherUpdateData.status = input.status;

      /*
       * Automatically record when a teacher leaves.
       */
      if (input.status === "left") {
        teacherUpdateData.leftAt = Temporal.Now.instant();
      } else if (teacher.status === "left") {
        teacherUpdateData.leftAt = null;
      }
    }

    let updatedTeacher = teacher;

    if (Object.keys(teacherUpdateData).length > 0) {
      const updated = await tx.orm.public.Teacher.where({
        id: teacherId,
        instituteId,
      }).update(teacherUpdateData);

      if (!updated) {
        throw new TeacherNotFoundError();
      }

      updatedTeacher = updated;
    }

    const updatedUser = await tx.orm.public.User.first({
      id: membership.userId,
    });

    return {
      teacher: updatedTeacher,
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
