import { db } from "../../db/db.js";
import type {
  CreateAttendanceRecordInput,
  CreateAttendanceSessionInput,
  UpdateAttendanceRecordInput,
  UpdateAttendanceSessionInput,
} from "./attendance.schema.js";
import "temporal-polyfill/full/global";

type AuthContext = {
  userId: string;
  instituteId: string;
  role: "owner" | "staff" | "teacher" | "student";
};

function sessionDateToInstant(sessionDate: string): Temporal.Instant {
  return Temporal.Instant.from(`${sessionDate}T00:00:00Z`);
}

async function getMembership(auth: AuthContext) {
  const membership = await db.orm.public.InstituteMembership.first({
    instituteId: auth.instituteId,
    userId: auth.userId,
  });

  if (!membership) {
    throw new Error("Institute membership not found");
  }

  return membership;
}

async function getCurrentTeacher(auth: AuthContext) {
  const membership = await getMembership(auth);

  const teacher = await db.orm.public.Teacher.first({
    instituteId: auth.instituteId,
    membershipId: membership.id,
  });

  if (!teacher) {
    throw new Error("Teacher profile not found");
  }

  return teacher;
}

async function getCurrentStudent(auth: AuthContext) {
  const membership = await getMembership(auth);

  const student = await db.orm.public.Student.first({
    instituteId: auth.instituteId,
    membershipId: membership.id,
  });

  if (!student) {
    throw new Error("Student profile not found");
  }

  return student;
}

async function verifyClassAccess(auth: AuthContext, classId: string) {
  const classItem = await db.orm.public.Class.first({
    id: classId,
    instituteId: auth.instituteId,
  });

  if (!classItem) {
    throw new Error("Class not found");
  }

  if (auth.role === "teacher") {
    const teacher = await getCurrentTeacher(auth);

    if (classItem.teacherId !== teacher.id) {
      throw new Error("You do not have access to this class");
    }
  }

  return classItem;
}

async function verifySessionAccess(auth: AuthContext, sessionId: string) {
  const session = await db.orm.public.AttendanceSession.first({
    id: sessionId,
    instituteId: auth.instituteId,
  });

  if (!session) {
    throw new Error("Attendance session not found");
  }

  await verifyClassAccess(auth, session.classId);

  return session;
}

export async function createAttendanceSession(
  auth: AuthContext,
  input: CreateAttendanceSessionInput,
) {
  await verifyClassAccess(auth, input.classId);

  const sessionDate = sessionDateToInstant(input.sessionDate);

  const existing = await db.orm.public.AttendanceSession.first({
    instituteId: auth.instituteId,
    classId: input.classId,
    sessionDate,
  });

  if (existing) {
    throw new Error(
      "Attendance session already exists for this class and date",
    );
  }

  return db.orm.public.AttendanceSession.create({
    instituteId: auth.instituteId,
    classId: input.classId,
    sessionDate,
    ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
    ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  });
}

export async function listAttendanceSessions(auth: AuthContext) {
  if (auth.role === "student") {
    const student = await getCurrentStudent(auth);

    const enrollments = await db.orm.public.Enrollment.where({
      instituteId: auth.instituteId,
      studentId: student.id,
      status: "active",
    }).all();

    const classIds = enrollments.map((enrollment) => enrollment.classId);

    if (classIds.length === 0) {
      return [];
    }

    const sessions = await db.orm.public.AttendanceSession.where({
      instituteId: auth.instituteId,
    }).all();

    return sessions.filter((session) => classIds.includes(session.classId));
  }

  if (auth.role === "teacher") {
    const teacher = await getCurrentTeacher(auth);

    const classes = await db.orm.public.Class.where({
      instituteId: auth.instituteId,
      teacherId: teacher.id,
    }).all();

    const classIds = classes.map((classItem) => classItem.id);

    if (classIds.length === 0) {
      return [];
    }

    const sessions = await db.orm.public.AttendanceSession.where({
      instituteId: auth.instituteId,
    }).all();

    return sessions.filter((session) => classIds.includes(session.classId));
  }

  return db.orm.public.AttendanceSession.where({
    instituteId: auth.instituteId,
  }).all();
}

export async function getAttendanceSession(
  auth: AuthContext,
  sessionId: string,
) {
  const session = await verifySessionAccess(auth, sessionId);

  const records = await db.orm.public.AttendanceRecord.where({
    instituteId: auth.instituteId,
    sessionId,
  }).all();

  return {
    session,
    records,
  };
}

export async function updateAttendanceSession(
  auth: AuthContext,
  sessionId: string,
  input: UpdateAttendanceSessionInput,
) {
  await verifySessionAccess(auth, sessionId);

  let sessionDate: Temporal.Instant | undefined;

  if (input.sessionDate) {
    sessionDate = sessionDateToInstant(input.sessionDate);

    const existing = await db.orm.public.AttendanceSession.first({
      instituteId: auth.instituteId,
      classId: (await db.orm.public.AttendanceSession.first({
        id: sessionId,
        instituteId: auth.instituteId,
      }))!.classId,
      sessionDate,
    });

    if (existing && existing.id !== sessionId) {
      throw new Error(
        "Attendance session already exists for this class and date",
      );
    }
  }

  return db.orm.public.AttendanceSession.where({
    id: sessionId,
    instituteId: auth.instituteId,
  }).update({
    ...(sessionDate !== undefined ? { sessionDate } : {}),
    ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
    ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  });
}

export async function createAttendanceRecord(
  auth: AuthContext,
  sessionId: string,
  input: CreateAttendanceRecordInput,
) {
  const session = await verifySessionAccess(auth, sessionId);

  const enrollment = await db.orm.public.Enrollment.first({
    instituteId: auth.instituteId,
    studentId: input.studentId,
    classId: session.classId,
  });

  if (!enrollment || enrollment.status !== "active") {
    throw new Error("Student is not actively enrolled in this class");
  }

  const existing = await db.orm.public.AttendanceRecord.first({
    instituteId: auth.instituteId,
    sessionId,
    studentId: input.studentId,
  });

  if (existing) {
    throw new Error("Attendance record already exists for this student");
  }

  return db.orm.public.AttendanceRecord.create({
    instituteId: auth.instituteId,
    sessionId,
    studentId: input.studentId,
    status: input.status,
    ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
  });
}

export async function updateAttendanceRecord(
  auth: AuthContext,
  recordId: string,
  input: UpdateAttendanceRecordInput,
) {
  const record = await db.orm.public.AttendanceRecord.first({
    id: recordId,
    instituteId: auth.instituteId,
  });

  if (!record) {
    throw new Error("Attendance record not found");
  }

  await verifySessionAccess(auth, record.sessionId);

  return db.orm.public.AttendanceRecord.where({
    id: recordId,
    instituteId: auth.instituteId,
  }).update({
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
  });
}

export async function getClassAttendance(auth: AuthContext, classId: string) {
  await verifyClassAccess(auth, classId);

  const sessions = await db.orm.public.AttendanceSession.where({
    instituteId: auth.instituteId,
    classId,
  }).all();

  const sessionIds = sessions.map((session) => session.id);

  if (sessionIds.length === 0) {
    return [];
  }

  const records = await db.orm.public.AttendanceRecord.where({
    instituteId: auth.instituteId,
  }).all();

  return records.filter((record) => sessionIds.includes(record.sessionId));
}

export async function getStudentAttendance(
  auth: AuthContext,
  studentId: string,
) {
  if (auth.role === "student") {
    const student = await getCurrentStudent(auth);

    if (student.id !== studentId) {
      throw new Error("You can only view your own attendance");
    }
  }

  const student = await db.orm.public.Student.first({
    id: studentId,
    instituteId: auth.instituteId,
  });

  if (!student) {
    throw new Error("Student not found");
  }

  return db.orm.public.AttendanceRecord.where({
    instituteId: auth.instituteId,
    studentId,
  }).all();
}
