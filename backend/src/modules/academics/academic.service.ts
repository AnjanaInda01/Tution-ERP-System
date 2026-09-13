import { db } from "../../db/db.js";
import { Temporal } from "temporal-polyfill";

import type {
  CreateEducationLevelInput,
  UpdateEducationLevelInput,
  CreateGradeInput,
  UpdateGradeInput,
  CreateStreamInput,
  UpdateStreamInput,
  CreateSubjectInput,
  UpdateSubjectInput,
  CreateClassInput,
  UpdateClassInput,
} from "./academic.schema.js";

export class EducationLevelNotFoundError extends Error {
  constructor() {
    super("Education level not found");
    this.name = "EducationLevelNotFoundError";
  }
}

export class EducationLevelConflictError extends Error {
  constructor(message = "Education level code already exists") {
    super(message);
    this.name = "EducationLevelConflictError";
  }
}

export async function listEducationLevels(instituteId: string) {
  return db.orm.public.EducationLevel.where({
    instituteId,
  }).all();
}

export async function getEducationLevel(
  instituteId: string,
  educationLevelId: string,
) {
  const educationLevel = await db.orm.public.EducationLevel.first({
    id: educationLevelId,
    instituteId,
  });

  if (!educationLevel) {
    throw new EducationLevelNotFoundError();
  }

  return educationLevel;
}

export async function createEducationLevel(
  instituteId: string,
  input: CreateEducationLevelInput,
) {
  const existing = await db.orm.public.EducationLevel.first({
    instituteId,
    code: input.code,
  });

  if (existing) {
    throw new EducationLevelConflictError();
  }

  return db.orm.public.EducationLevel.create({
    instituteId,
    name: input.name,
    code: input.code,
    displayOrder: input.displayOrder,
  });
}

export async function updateEducationLevel(
  instituteId: string,
  educationLevelId: string,
  input: UpdateEducationLevelInput,
) {
  const educationLevel = await db.orm.public.EducationLevel.first({
    id: educationLevelId,
    instituteId,
  });

  if (!educationLevel) {
    throw new EducationLevelNotFoundError();
  }

  if (input.code !== undefined && input.code !== educationLevel.code) {
    const existing = await db.orm.public.EducationLevel.first({
      instituteId,
      code: input.code,
    });

    if (existing && existing.id !== educationLevelId) {
      throw new EducationLevelConflictError();
    }
  }

  const updateData: {
    name?: string;
    code?: string;
    displayOrder?: number;
    status?: "active" | "inactive";
  } = {};

  if (input.name !== undefined) {
    updateData.name = input.name;
  }

  if (input.code !== undefined) {
    updateData.code = input.code;
  }

  if (input.displayOrder !== undefined) {
    updateData.displayOrder = input.displayOrder;
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  return db.orm.public.EducationLevel.where({
    id: educationLevelId,
    instituteId,
  }).update(updateData);
}

export class GradeNotFoundError extends Error {
  constructor() {
    super("Grade not found");
    this.name = "GradeNotFoundError";
  }
}

export class GradeConflictError extends Error {
  constructor(message = "Grade code already exists") {
    super(message);
    this.name = "GradeConflictError";
  }
}

export class EducationLevelForGradeNotFoundError extends Error {
  constructor() {
    super("Education level not found");
    this.name = "EducationLevelForGradeNotFoundError";
  }
}

export async function listGrades(instituteId: string) {
  return db.orm.public.Grade.where({
    instituteId,
  }).all();
}

export async function getGrade(instituteId: string, gradeId: string) {
  const grade = await db.orm.public.Grade.first({
    id: gradeId,
    instituteId,
  });

  if (!grade) {
    throw new GradeNotFoundError();
  }

  return grade;
}

export async function createGrade(
  instituteId: string,
  input: CreateGradeInput,
) {
  /*
   * Verify that the Education Level belongs
   * to the same institute.
   */
  const educationLevel = await db.orm.public.EducationLevel.first({
    id: input.educationLevelId,
    instituteId,
  });

  if (!educationLevel) {
    throw new EducationLevelForGradeNotFoundError();
  }

  /*
   * Grade codes are unique inside one institute.
   */
  const existing = await db.orm.public.Grade.first({
    instituteId,
    code: input.code,
  });

  if (existing) {
    throw new GradeConflictError();
  }

  return db.orm.public.Grade.create({
    instituteId,
    educationLevelId: input.educationLevelId,
    name: input.name,
    code: input.code,
    displayOrder: input.displayOrder,
  });
}

export async function updateGrade(
  instituteId: string,
  gradeId: string,
  input: UpdateGradeInput,
) {
  const grade = await db.orm.public.Grade.first({
    id: gradeId,
    instituteId,
  });

  if (!grade) {
    throw new GradeNotFoundError();
  }

  /*
   * If the education level is changing,
   * make sure the new education level belongs
   * to this same institute.
   */
  if (
    input.educationLevelId !== undefined &&
    input.educationLevelId !== grade.educationLevelId
  ) {
    const educationLevel = await db.orm.public.EducationLevel.first({
      id: input.educationLevelId,
      instituteId,
    });

    if (!educationLevel) {
      throw new EducationLevelForGradeNotFoundError();
    }
  }

  /*
   * Check duplicate grade code.
   */
  if (input.code !== undefined && input.code !== grade.code) {
    const existing = await db.orm.public.Grade.first({
      instituteId,
      code: input.code,
    });

    if (existing && existing.id !== gradeId) {
      throw new GradeConflictError();
    }
  }

  const updateData: {
    educationLevelId?: string;
    name?: string;
    code?: string;
    displayOrder?: number;
    status?: "active" | "inactive";
  } = {};

  if (input.educationLevelId !== undefined) {
    updateData.educationLevelId = input.educationLevelId;
  }

  if (input.name !== undefined) {
    updateData.name = input.name;
  }

  if (input.code !== undefined) {
    updateData.code = input.code;
  }

  if (input.displayOrder !== undefined) {
    updateData.displayOrder = input.displayOrder;
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  return db.orm.public.Grade.where({
    id: gradeId,
    instituteId,
  }).update(updateData);
}

export class StreamNotFoundError extends Error {
  constructor() {
    super("Stream not found");
    this.name = "StreamNotFoundError";
  }
}

export class StreamConflictError extends Error {
  constructor(message = "Stream code already exists") {
    super(message);
    this.name = "StreamConflictError";
  }
}

export async function listStreams(instituteId: string) {
  return db.orm.public.Stream.where({
    instituteId,
  }).all();
}

export async function getStream(instituteId: string, streamId: string) {
  const stream = await db.orm.public.Stream.first({
    id: streamId,
    instituteId,
  });

  if (!stream) {
    throw new StreamNotFoundError();
  }

  return stream;
}

export async function createStream(
  instituteId: string,
  input: CreateStreamInput,
) {
  /*
   * Stream belongs directly to the institute.
   * The current Prisma contract does not have gradeId
   * on the Stream model.
   */

  const existing = await db.orm.public.Stream.first({
    instituteId,
    code: input.code,
  });

  if (existing) {
    throw new StreamConflictError();
  }

  return db.orm.public.Stream.create({
    instituteId,
    name: input.name,
    code: input.code,
    displayOrder: input.displayOrder,
  });
}

export async function updateStream(
  instituteId: string,
  streamId: string,
  input: UpdateStreamInput,
) {
  const stream = await db.orm.public.Stream.first({
    id: streamId,
    instituteId,
  });

  if (!stream) {
    throw new StreamNotFoundError();
  }

  /*
   * Check duplicate stream code.
   */
  if (input.code !== undefined && input.code !== stream.code) {
    const existing = await db.orm.public.Stream.first({
      instituteId,
      code: input.code,
    });

    if (existing && existing.id !== streamId) {
      throw new StreamConflictError();
    }
  }

  const updateData: {
    name?: string;
    code?: string;
    displayOrder?: number;
    status?: "active" | "inactive";
  } = {};

  if (input.name !== undefined) {
    updateData.name = input.name;
  }

  if (input.code !== undefined) {
    updateData.code = input.code;
  }

  if (input.displayOrder !== undefined) {
    updateData.displayOrder = input.displayOrder;
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  return db.orm.public.Stream.where({
    id: streamId,
    instituteId,
  }).update(updateData);
}

export class SubjectNotFoundError extends Error {
  constructor() {
    super("Subject not found");
    this.name = "SubjectNotFoundError";
  }
}

export class SubjectConflictError extends Error {
  constructor(message = "Subject code already exists") {
    super(message);
    this.name = "SubjectConflictError";
  }
}

export async function listSubjects(instituteId: string) {
  return db.orm.public.Subject.where({
    instituteId,
  }).all();
}

export async function getSubject(instituteId: string, subjectId: string) {
  const subject = await db.orm.public.Subject.first({
    id: subjectId,
    instituteId,
  });

  if (!subject) {
    throw new SubjectNotFoundError();
  }

  return subject;
}

export async function createSubject(
  instituteId: string,
  input: CreateSubjectInput,
) {
  const existing = await db.orm.public.Subject.first({
    instituteId,
    code: input.code,
  });

  if (existing) {
    throw new SubjectConflictError();
  }

  const createData: {
    instituteId: string;
    name: string;
    code: string;
    description?: string;
  } = {
    instituteId,
    name: input.name,
    code: input.code,
  };

  if (input.description !== undefined) {
    createData.description = input.description;
  }

  return db.orm.public.Subject.create(createData);
}

export async function updateSubject(
  instituteId: string,
  subjectId: string,
  input: UpdateSubjectInput,
) {
  const subject = await db.orm.public.Subject.first({
    id: subjectId,
    instituteId,
  });

  if (!subject) {
    throw new SubjectNotFoundError();
  }

  if (input.code !== undefined && input.code !== subject.code) {
    const existing = await db.orm.public.Subject.first({
      instituteId,
      code: input.code,
    });

    if (existing && existing.id !== subjectId) {
      throw new SubjectConflictError();
    }
  }

  const updateData: {
    name?: string;
    code?: string;
    description?: string;
    status?: "active" | "inactive";
  } = {};

  if (input.name !== undefined) {
    updateData.name = input.name;
  }

  if (input.code !== undefined) {
    updateData.code = input.code;
  }

  if (input.description !== undefined) {
    updateData.description = input.description;
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  return db.orm.public.Subject.where({
    id: subjectId,
    instituteId,
  }).update(updateData);
}

export class ClassNotFoundError extends Error {
  constructor() {
    super("Class not found");
    this.name = "ClassNotFoundError";
  }
}

export class ClassConflictError extends Error {
  constructor(message = "Class code already exists") {
    super(message);
    this.name = "ClassConflictError";
  }
}

export class TeacherForClassNotFoundError extends Error {
  constructor() {
    super("Teacher not found in this institute");
    this.name = "TeacherForClassNotFoundError";
  }
}

export class SubjectForClassNotFoundError extends Error {
  constructor() {
    super("Subject not found in this institute");
    this.name = "SubjectForClassNotFoundError";
  }
}

export class GradeForClassNotFoundError extends Error {
  constructor() {
    super("Grade not found in this institute");
    this.name = "GradeForClassNotFoundError";
  }
}

export class StreamForClassNotFoundError extends Error {
  constructor() {
    super("Stream not found in this institute");
    this.name = "StreamForClassNotFoundError";
  }
}

export async function listClasses(instituteId: string) {
  return db.orm.public.Class.where({
    instituteId,
  }).all();
}

export async function getClass(instituteId: string, classId: string) {
  const classRecord = await db.orm.public.Class.first({
    id: classId,
    instituteId,
  });

  if (!classRecord) {
    throw new ClassNotFoundError();
  }

  return classRecord;
}

async function validateClassReferences(
  instituteId: string,
  input: {
    teacherId: string;
    subjectId: string;
    gradeId: string;
    streamId?: string | null;
  },
) {
  const teacher = await db.orm.public.Teacher.first({
    id: input.teacherId,
    instituteId,
  });

  if (!teacher) {
    throw new TeacherForClassNotFoundError();
  }

  const subject = await db.orm.public.Subject.first({
    id: input.subjectId,
    instituteId,
  });

  if (!subject) {
    throw new SubjectForClassNotFoundError();
  }

  const grade = await db.orm.public.Grade.first({
    id: input.gradeId,
    instituteId,
  });

  if (!grade) {
    throw new GradeForClassNotFoundError();
  }

  if (input.streamId !== undefined && input.streamId !== null) {
    const stream = await db.orm.public.Stream.first({
      id: input.streamId,
      instituteId,
    });

    if (!stream) {
      throw new StreamForClassNotFoundError();
    }
  }
}

export async function createClass(
  instituteId: string,
  input: CreateClassInput,
) {
  const referenceData: {
    teacherId: string;
    subjectId: string;
    gradeId: string;
    streamId?: string | null;
  } = {
    teacherId: input.teacherId,
    subjectId: input.subjectId,
    gradeId: input.gradeId,
  };

  if (input.streamId !== undefined) {
    referenceData.streamId = input.streamId;
  }

  await validateClassReferences(instituteId, referenceData);

  const existing = await db.orm.public.Class.first({
    instituteId,
    code: input.code,
  });

  if (existing) {
    throw new ClassConflictError();
  }

  const createData: {
    instituteId: string;
    teacherId: string;
    subjectId: string;
    gradeId: string;
    streamId?: string;
    name: string;
    code: string;
    monthlyFee?: string;
    capacity?: number;
    deliveryMode: "physical" | "online" | "hybrid";
    startsAt?: Temporal.Instant;
    endsAt?: Temporal.Instant;
  } = {
    instituteId,
    teacherId: input.teacherId,
    subjectId: input.subjectId,
    gradeId: input.gradeId,
    name: input.name,
    code: input.code,
    deliveryMode: input.deliveryMode,
  };

  if (input.streamId !== undefined) {
    createData.streamId = input.streamId;
  }

  if (input.monthlyFee !== undefined) {
    createData.monthlyFee = input.monthlyFee.toString();
  }

  if (input.capacity !== undefined) {
    createData.capacity = input.capacity;
  }

  if (input.startsAt !== undefined) {
    createData.startsAt = Temporal.Instant.from(input.startsAt);
  }

  if (input.endsAt !== undefined) {
    createData.endsAt = Temporal.Instant.from(input.endsAt);
  }

  return db.orm.public.Class.create(createData);
}

export async function updateClass(
  instituteId: string,
  classId: string,
  input: UpdateClassInput,
) {
  const classRecord = await db.orm.public.Class.first({
    id: classId,
    instituteId,
  });

  if (!classRecord) {
    throw new ClassNotFoundError();
  }

  const teacherId = input.teacherId ?? classRecord.teacherId;

  const subjectId = input.subjectId ?? classRecord.subjectId;

  const gradeId = input.gradeId ?? classRecord.gradeId;

  const streamId =
    input.streamId !== undefined ? input.streamId : classRecord.streamId;

  await validateClassReferences(instituteId, {
    teacherId,
    subjectId,
    gradeId,
    streamId,
  });

  if (input.code !== undefined && input.code !== classRecord.code) {
    const existing = await db.orm.public.Class.first({
      instituteId,
      code: input.code,
    });

    if (existing && existing.id !== classId) {
      throw new ClassConflictError();
    }
  }

  const updateData: {
    teacherId?: string;
    subjectId?: string;
    gradeId?: string;
    streamId?: string | null;
    name?: string;
    code?: string;
    monthlyFee?: string | null;
    capacity?: number | null;
    deliveryMode?: "physical" | "online" | "hybrid";
    status?: "draft" | "active" | "completed" | "cancelled" | "archived";
    startsAt?: Temporal.Instant | null;
    endsAt?: Temporal.Instant | null;
  } = {};

  if (input.teacherId !== undefined) {
    updateData.teacherId = input.teacherId;
  }

  if (input.subjectId !== undefined) {
    updateData.subjectId = input.subjectId;
  }

  if (input.gradeId !== undefined) {
    updateData.gradeId = input.gradeId;
  }

  if (input.streamId !== undefined) {
    updateData.streamId = input.streamId;
  }

  if (input.name !== undefined) {
    updateData.name = input.name;
  }

  if (input.code !== undefined) {
    updateData.code = input.code;
  }

  if (input.monthlyFee !== undefined) {
    updateData.monthlyFee =
      input.monthlyFee === null ? null : input.monthlyFee.toString();
  }

  if (input.capacity !== undefined) {
    updateData.capacity = input.capacity;
  }

  if (input.deliveryMode !== undefined) {
    updateData.deliveryMode = input.deliveryMode;
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  if (input.startsAt !== undefined) {
    updateData.startsAt =
      input.startsAt === null ? null : Temporal.Instant.from(input.startsAt);
  }

  if (input.endsAt !== undefined) {
    updateData.endsAt =
      input.endsAt === null ? null : Temporal.Instant.from(input.endsAt);
  }

  return db.orm.public.Class.where({
    id: classId,
    instituteId,
  }).update(updateData);
}
