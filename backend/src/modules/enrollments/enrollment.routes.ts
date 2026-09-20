import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { requireTenant } from "../../middleware/tenant.middleware.js";

import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
} from "./enrollment.schema.js";

import {
  ClassForEnrollmentNotFoundError,
  createEnrollment,
  EnrollmentConflictError,
  EnrollmentNotFoundError,
  getEnrollment,
  listClassEnrollments,
  listEnrollments,
  listStudentEnrollments,
  StudentForEnrollmentNotFoundError,
  updateEnrollment,
} from "./enrollment.service.js";

const enrollmentRouter = Router();

/*
 * GET /api/enrollments
 * List all enrollments for the current institute.
 */
enrollmentRouter.get(
  "/",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      if (!request.auth) {
        return response.status(401).json({
          error: "Authentication required",
        });
      }

      const enrollments = await listEnrollments(request.auth.instituteId);

      return response.status(200).json({
        data: enrollments,
      });
    } catch (error) {
      console.error("List enrollments error:", error);

      return response.status(500).json({
        error: "Failed to load enrollments",
      });
    }
  },
);

/*
 * GET /api/enrollments/student/:studentId
 * List enrollments of one student.
 */
enrollmentRouter.get(
  "/student/:studentId",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      if (!request.auth) {
        return response.status(401).json({
          error: "Authentication required",
        });
      }

      const studentId = request.params.studentId;

      if (typeof studentId !== "string") {
        return response.status(400).json({
          error: "Invalid student ID",
        });
      }

      const enrollments = await listStudentEnrollments(
        request.auth.instituteId,
        studentId,
      );

      return response.status(200).json({
        data: enrollments,
      });
    } catch (error) {
      if (error instanceof StudentForEnrollmentNotFoundError) {
        return response.status(404).json({
          error: error.message,
        });
      }

      console.error("List student enrollments error:", error);

      return response.status(500).json({
        error: "Failed to load student enrollments",
      });
    }
  },
);

/*
 * GET /api/enrollments/class/:classId
 * List students enrolled in one class.
 */
enrollmentRouter.get(
  "/class/:classId",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      if (!request.auth) {
        return response.status(401).json({
          error: "Authentication required",
        });
      }

      const classId = request.params.classId;

      if (typeof classId !== "string") {
        return response.status(400).json({
          error: "Invalid class ID",
        });
      }

      const enrollments = await listClassEnrollments(
        request.auth.instituteId,
        classId,
      );

      return response.status(200).json({
        data: enrollments,
      });
    } catch (error) {
      if (error instanceof ClassForEnrollmentNotFoundError) {
        return response.status(404).json({
          error: error.message,
        });
      }

      console.error("List class enrollments error:", error);

      return response.status(500).json({
        error: "Failed to load class enrollments",
      });
    }
  },
);

/*
 * GET /api/enrollments/:id
 * Get one enrollment.
 */
enrollmentRouter.get(
  "/:id",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      if (!request.auth) {
        return response.status(401).json({
          error: "Authentication required",
        });
      }

      const enrollmentId = request.params.id;

      if (typeof enrollmentId !== "string") {
        return response.status(400).json({
          error: "Invalid enrollment ID",
        });
      }

      const result = await getEnrollment(
        request.auth.instituteId,
        enrollmentId,
      );

      return response.status(200).json({
        data: result,
      });
    } catch (error) {
      if (error instanceof EnrollmentNotFoundError) {
        return response.status(404).json({
          error: error.message,
        });
      }

      console.error("Get enrollment error:", error);

      return response.status(500).json({
        error: "Failed to load enrollment",
      });
    }
  },
);

/*
 * POST /api/enrollments
 * Enroll a student into a class.
 *
 * Owner only.
 */
enrollmentRouter.post(
  "/",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    const parsed = createEnrollmentSchema.safeParse(request.body);

    if (!parsed.success) {
      return response.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    try {
      if (!request.auth) {
        return response.status(401).json({
          error: "Authentication required",
        });
      }

      const result = await createEnrollment(
        request.auth.instituteId,
        parsed.data,
      );

      return response.status(201).json({
        message: "Student enrolled successfully",
        data: result,
      });
    } catch (error) {
      if (
        error instanceof StudentForEnrollmentNotFoundError ||
        error instanceof ClassForEnrollmentNotFoundError
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (error instanceof EnrollmentConflictError) {
        return response.status(409).json({
          error: error.message,
        });
      }

      console.error("Create enrollment error:", error);

      return response.status(500).json({
        error: "Failed to create enrollment",
      });
    }
  },
);

/*
 * PATCH /api/enrollments/:id
 * Update enrollment status/details.
 *
 * Owner only.
 */
enrollmentRouter.patch(
  "/:id",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    const parsed = updateEnrollmentSchema.safeParse(request.body);

    if (!parsed.success) {
      return response.status(400).json({
        error: "Validation failed",
        details: parsed.error.flatten(),
      });
    }

    try {
      if (!request.auth) {
        return response.status(401).json({
          error: "Authentication required",
        });
      }

      const enrollmentId = request.params.id;

      if (typeof enrollmentId !== "string") {
        return response.status(400).json({
          error: "Invalid enrollment ID",
        });
      }

      const result = await updateEnrollment(
        request.auth.instituteId,
        enrollmentId,
        parsed.data,
      );

      return response.status(200).json({
        message: "Enrollment updated successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof EnrollmentNotFoundError) {
        return response.status(404).json({
          error: error.message,
        });
      }

      console.error("Update enrollment error:", error);

      return response.status(500).json({
        error: "Failed to update enrollment",
      });
    }
  },
);

export { enrollmentRouter };
