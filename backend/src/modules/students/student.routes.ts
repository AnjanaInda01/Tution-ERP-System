import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { requireTenant } from "../../middleware/tenant.middleware.js";

import { createStudentSchema, updateStudentSchema } from "./student.schema.js";

import {
  createStudent,
  getStudent,
  listStudents,
  StudentConflictError,
  StudentNotFoundError,
  updateStudent,
} from "./student.service.js";

const studentRouter = Router();

/*
 * GET /api/students
 * List all students in the current institute.
 */
studentRouter.get(
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

      const students = await listStudents(request.auth.instituteId);

      return response.status(200).json({
        data: students,
      });
    } catch (error) {
      console.error("List students error:", error);

      return response.status(500).json({
        error: "Failed to load students",
      });
    }
  },
);

/*
 * GET /api/students/:id
 * Get one student.
 */
studentRouter.get(
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

      const studentId = request.params.id;

      if (typeof studentId !== "string") {
        return response.status(400).json({
          error: "Invalid student ID",
        });
      }

      const student = await getStudent(request.auth.instituteId, studentId);

      return response.status(200).json({
        data: student,
      });
    } catch (error) {
      if (error instanceof StudentNotFoundError) {
        return response.status(404).json({
          error: error.message,
        });
      }

      console.error("Get student error:", error);

      return response.status(500).json({
        error: "Failed to load student",
      });
    }
  },
);

/*
 * POST /api/students
 * Create a student.
 *
 * Owner only.
 */
studentRouter.post(
  "/",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    const parsed = createStudentSchema.safeParse(request.body);

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

      const result = await createStudent(request.auth.instituteId, parsed.data);

      return response.status(201).json({
        message: "Student created successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof StudentConflictError) {
        return response.status(409).json({
          error: error.message,
        });
      }

      console.error("Create student error:", error);

      return response.status(500).json({
        error: "Failed to create student",
      });
    }
  },
);

/*
 * PATCH /api/students/:id
 * Update a student.
 *
 * Owner only.
 */
studentRouter.patch(
  "/:id",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    const parsed = updateStudentSchema.safeParse(request.body);

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

      const studentId = request.params.id;

      if (typeof studentId !== "string") {
        return response.status(400).json({
          error: "Invalid student ID",
        });
      }

      const result = await updateStudent(
        request.auth.instituteId,
        studentId,
        parsed.data,
      );

      return response.status(200).json({
        message: "Student updated successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof StudentNotFoundError) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (error instanceof StudentConflictError) {
        return response.status(409).json({
          error: error.message,
        });
      }

      console.error("Update student error:", error);

      return response.status(500).json({
        error: "Failed to update student",
      });
    }
  },
);

export { studentRouter };
