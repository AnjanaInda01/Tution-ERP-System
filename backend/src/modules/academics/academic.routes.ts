import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { requireTenant } from "../../middleware/tenant.middleware.js";

import {
  createEducationLevel,
  EducationLevelConflictError,
  EducationLevelNotFoundError,
  getEducationLevel,
  listEducationLevels,
  updateEducationLevel,
  createGrade,
  GradeConflictError,
  GradeNotFoundError,
  EducationLevelForGradeNotFoundError,
  getGrade,
  listGrades,
  updateGrade,
  listStreams,
  getStream,
  createStream,
  updateStream,
  StreamNotFoundError,
  StreamConflictError,
  createSubject,
  SubjectConflictError,
  SubjectNotFoundError,
  getSubject,
  listSubjects,
  updateSubject,
  createClass,
  ClassConflictError,
  ClassNotFoundError,
  TeacherForClassNotFoundError,
  SubjectForClassNotFoundError,
  GradeForClassNotFoundError,
  StreamForClassNotFoundError,
  getClass,
  listClasses,
  updateClass,
} from "./academic.service.js";

import {
  createEducationLevelSchema,
  updateEducationLevelSchema,
  createGradeSchema,
  updateGradeSchema,
  createStreamSchema,
  updateStreamSchema,
  createSubjectSchema,
  updateSubjectSchema,
  createClassSchema,
  updateClassSchema,
} from "./academic.schema.js";

export const academicRouter = Router();

/*
 * GET /api/academic/education-levels
 */
academicRouter.get(
  "/education-levels",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const educationLevels = await listEducationLevels(auth.instituteId);

      response.status(200).json({
        data: {
          educationLevels,
        },
      });
    } catch (error) {
      console.error("GET /api/academic/education-levels error:", error);

      response.status(500).json({
        error: "Failed to load education levels",
      });
    }
  },
);

/*
 * GET /api/academic/education-levels/:id
 */
academicRouter.get(
  "/education-levels/:id",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const educationLevelId = request.params.id;

      if (typeof educationLevelId !== "string") {
        response.status(400).json({
          error: "Education level ID is required",
        });
        return;
      }

      const educationLevel = await getEducationLevel(
        auth.instituteId,
        educationLevelId,
      );

      response.status(200).json({
        data: {
          educationLevel,
        },
      });
    } catch (error) {
      if (error instanceof EducationLevelNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      console.error("GET /api/academic/education-levels/:id error:", error);

      response.status(500).json({
        error: "Failed to load education level",
      });
    }
  },
);

/*
 * POST /api/academic/education-levels
 */
academicRouter.post(
  "/education-levels",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const parsed = createEducationLevelSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const educationLevel = await createEducationLevel(
        auth.instituteId,
        parsed.data,
      );

      response.status(201).json({
        message: "Education level created successfully",
        data: {
          educationLevel,
        },
      });
    } catch (error) {
      if (error instanceof EducationLevelConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("POST /api/academic/education-levels error:", error);

      response.status(500).json({
        error: "Failed to create education level",
      });
    }
  },
);

/*
 * PATCH /api/academic/education-levels/:id
 */
academicRouter.patch(
  "/education-levels/:id",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const parsed = updateEducationLevelSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const educationLevelId = request.params.id;

      if (typeof educationLevelId !== "string") {
        response.status(400).json({
          error: "Education level ID is required",
        });
        return;
      }

      const educationLevel = await updateEducationLevel(
        auth.instituteId,
        educationLevelId,
        parsed.data,
      );

      response.status(200).json({
        message: "Education level updated successfully",
        data: {
          educationLevel,
        },
      });
    } catch (error) {
      if (error instanceof EducationLevelNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof EducationLevelConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("PATCH /api/academic/education-levels/:id error:", error);

      response.status(500).json({
        error: "Failed to update education level",
      });
    }
  },
);

academicRouter.get(
  "/grades",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const grades = await listGrades(auth.instituteId);

      response.status(200).json({
        data: {
          grades,
        },
      });
    } catch (error) {
      console.error("GET /api/academic/grades error:", error);

      response.status(500).json({
        error: "Failed to load grades",
      });
    }
  },
);

academicRouter.get(
  "/grades/:id",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const gradeId = request.params.id;

      if (typeof gradeId !== "string") {
        response.status(400).json({
          error: "Grade ID is required",
        });
        return;
      }

      const grade = await getGrade(auth.instituteId, gradeId);

      response.status(200).json({
        data: {
          grade,
        },
      });
    } catch (error) {
      if (error instanceof GradeNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      console.error("GET /api/academic/grades/:id error:", error);

      response.status(500).json({
        error: "Failed to load grade",
      });
    }
  },
);

academicRouter.post(
  "/grades",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const parsed = createGradeSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const grade = await createGrade(auth.instituteId, parsed.data);

      response.status(201).json({
        message: "Grade created successfully",
        data: {
          grade,
        },
      });
    } catch (error) {
      if (error instanceof EducationLevelForGradeNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof GradeConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("POST /api/academic/grades error:", error);

      response.status(500).json({
        error: "Failed to create grade",
      });
    }
  },
);

academicRouter.patch(
  "/grades/:id",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const gradeId = request.params.id;

      if (typeof gradeId !== "string") {
        response.status(400).json({
          error: "Grade ID is required",
        });
        return;
      }

      const parsed = updateGradeSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const grade = await updateGrade(auth.instituteId, gradeId, parsed.data);

      response.status(200).json({
        message: "Grade updated successfully",
        data: {
          grade,
        },
      });
    } catch (error) {
      if (error instanceof GradeNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof EducationLevelForGradeNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof GradeConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("PATCH /api/academic/grades/:id error:", error);

      response.status(500).json({
        error: "Failed to update grade",
      });
    }
  },
);

academicRouter.get(
  "/streams",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const streams = await listStreams(auth.instituteId);

      response.status(200).json({
        data: {
          streams,
        },
      });
    } catch (error) {
      console.error("GET /api/academic/streams error:", error);

      response.status(500).json({
        error: "Failed to load streams",
      });
    }
  },
);

academicRouter.get(
  "/streams/:id",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const streamId = request.params.id;

      if (typeof streamId !== "string") {
        response.status(400).json({
          error: "Stream ID is required",
        });
        return;
      }

      const stream = await getStream(auth.instituteId, streamId);

      response.status(200).json({
        data: {
          stream,
        },
      });
    } catch (error) {
      if (error instanceof StreamNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      console.error("GET /api/academic/streams/:id error:", error);

      response.status(500).json({
        error: "Failed to load stream",
      });
    }
  },
);

academicRouter.post(
  "/streams",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const parsed = createStreamSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const stream = await createStream(auth.instituteId, parsed.data);

      response.status(201).json({
        message: "Stream created successfully",
        data: {
          stream,
        },
      });
    } catch (error) {
      if (error instanceof StreamConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof StreamConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("POST /api/academic/streams error:", error);

      response.status(500).json({
        error: "Failed to create stream",
      });
    }
  },
);

academicRouter.patch(
  "/streams/:id",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const streamId = request.params.id;

      if (typeof streamId !== "string") {
        response.status(400).json({
          error: "Stream ID is required",
        });
        return;
      }

      const parsed = updateStreamSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const stream = await updateStream(
        auth.instituteId,
        streamId,
        parsed.data,
      );

      response.status(200).json({
        message: "Stream updated successfully",
        data: {
          stream,
        },
      });
    } catch (error) {
      if (error instanceof StreamNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof StreamConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof StreamConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("PATCH /api/academic/streams/:id error:", error);

      response.status(500).json({
        error: "Failed to update stream",
      });
    }
  },
);

/*
 * GET /api/academic/subjects
 */
academicRouter.get(
  "/subjects",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const subjects = await listSubjects(auth.instituteId);

      response.status(200).json({
        data: {
          subjects,
        },
      });
    } catch (error) {
      console.error("GET /api/academic/subjects error:", error);

      response.status(500).json({
        error: "Failed to load subjects",
      });
    }
  },
);

/*
 * GET /api/academic/subjects/:id
 */
academicRouter.get(
  "/subjects/:id",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const subjectId = request.params.id;

      if (typeof subjectId !== "string") {
        response.status(400).json({
          error: "Subject ID is required",
        });
        return;
      }

      const subject = await getSubject(auth.instituteId, subjectId);

      response.status(200).json({
        data: {
          subject,
        },
      });
    } catch (error) {
      if (error instanceof SubjectNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      console.error("GET /api/academic/subjects/:id error:", error);

      response.status(500).json({
        error: "Failed to load subject",
      });
    }
  },
);

/*
 * POST /api/academic/subjects
 */
academicRouter.post(
  "/subjects",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const parsed = createSubjectSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const subject = await createSubject(auth.instituteId, parsed.data);

      response.status(201).json({
        message: "Subject created successfully",
        data: {
          subject,
        },
      });
    } catch (error) {
      if (error instanceof SubjectConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("POST /api/academic/subjects error:", error);

      response.status(500).json({
        error: "Failed to create subject",
      });
    }
  },
);

/*
 * PATCH /api/academic/subjects/:id
 */
academicRouter.patch(
  "/subjects/:id",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const subjectId = request.params.id;

      if (typeof subjectId !== "string") {
        response.status(400).json({
          error: "Subject ID is required",
        });
        return;
      }

      const parsed = updateSubjectSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const subject = await updateSubject(
        auth.instituteId,
        subjectId,
        parsed.data,
      );

      response.status(200).json({
        message: "Subject updated successfully",
        data: {
          subject,
        },
      });
    } catch (error) {
      if (error instanceof SubjectNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof SubjectConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("PATCH /api/academic/subjects/:id error:", error);

      response.status(500).json({
        error: "Failed to update subject",
      });
    }
  },
);

/*
 * GET /api/academic/classes
 */
academicRouter.get(
  "/classes",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const classes = await listClasses(auth.instituteId);

      response.status(200).json({
        data: {
          classes,
        },
      });
    } catch (error) {
      console.error("GET /api/academic/classes error:", error);

      response.status(500).json({
        error: "Failed to load classes",
      });
    }
  },
);

/*
 * GET /api/academic/classes/:id
 */
academicRouter.get(
  "/classes/:id",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const classId = request.params.id;

      if (typeof classId !== "string") {
        response.status(400).json({
          error: "Class ID is required",
        });
        return;
      }

      const classRecord = await getClass(auth.instituteId, classId);

      response.status(200).json({
        data: {
          class: classRecord,
        },
      });
    } catch (error) {
      if (error instanceof ClassNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      console.error("GET /api/academic/classes/:id error:", error);

      response.status(500).json({
        error: "Failed to load class",
      });
    }
  },
);

/*
 * POST /api/academic/classes
 */
academicRouter.post(
  "/classes",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const parsed = createClassSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const classRecord = await createClass(auth.instituteId, parsed.data);

      response.status(201).json({
        message: "Class created successfully",
        data: {
          class: classRecord,
        },
      });
    } catch (error) {
      if (error instanceof TeacherForClassNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof SubjectForClassNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof GradeForClassNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof StreamForClassNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof ClassConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("POST /api/academic/classes error:", error);

      response.status(500).json({
        error: "Failed to create class",
      });
    }
  },
);

/*
 * PATCH /api/academic/classes/:id
 */
academicRouter.patch(
  "/classes/:id",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    try {
      const auth = request.auth;

      if (!auth) {
        response.status(401).json({
          error: "Authentication required",
        });
        return;
      }

      const classId = request.params.id;

      if (typeof classId !== "string") {
        response.status(400).json({
          error: "Class ID is required",
        });
        return;
      }

      const parsed = updateClassSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const classRecord = await updateClass(
        auth.instituteId,
        classId,
        parsed.data,
      );

      response.status(200).json({
        message: "Class updated successfully",
        data: {
          class: classRecord,
        },
      });
    } catch (error) {
      if (error instanceof ClassNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof TeacherForClassNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof SubjectForClassNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof GradeForClassNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof StreamForClassNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof ClassConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("PATCH /api/academic/classes/:id error:", error);

      response.status(500).json({
        error: "Failed to update class",
      });
    }
  },
);
