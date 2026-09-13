import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { requireTenant } from "../../middleware/tenant.middleware.js";

import {
  createTeacher,
  getTeacher,
  listTeachers,
  updateTeacher,
  TeacherConflictError,
  TeacherNotFoundError,
} from "./teacher.service.js";

import { createTeacherSchema, updateTeacherSchema } from "./teacher.schema.js";

export const teacherRouter = Router();

/*
 * GET /api/teachers
 */
teacherRouter.get(
  "/",
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

      const teachers = await listTeachers(auth.instituteId);

      response.status(200).json({
        data: {
          teachers,
        },
      });
    } catch (error) {
      console.error("GET /api/teachers error:", error);

      response.status(500).json({
        error: "Failed to load teachers",
      });
    }
  },
);

/*
 * GET /api/teachers/:id
 */
teacherRouter.get(
  "/:id",
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

      const teacherId = request.params.id;

      if (typeof teacherId !== "string") {
        response.status(400).json({
          error: "Teacher ID is required",
        });
        return;
      }

      const result = await getTeacher(auth.instituteId, teacherId);

      response.status(200).json({
        data: result,
      });
    } catch (error) {
      if (error instanceof TeacherNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      console.error("GET /api/teachers/:id error:", error);

      response.status(500).json({
        error: "Failed to load teacher",
      });
    }
  },
);

/*
 * POST /api/teachers
 */
teacherRouter.post(
  "/",
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

      const parsed = createTeacherSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const result = await createTeacher(auth.instituteId, parsed.data);

      response.status(201).json({
        message: "Teacher created successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof TeacherConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("POST /api/teachers error:", error);

      response.status(500).json({
        error: "Failed to create teacher",
      });
    }
  },
);

/*
 * PATCH /api/teachers/:id
 */
teacherRouter.patch(
  "/:id",
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

      const teacherId = request.params.id;

      if (typeof teacherId !== "string") {
        response.status(400).json({
          error: "Teacher ID is required",
        });
        return;
      }

      const parsed = updateTeacherSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const result = await updateTeacher(
        auth.instituteId,
        teacherId,
        parsed.data,
      );

      response.status(200).json({
        message: "Teacher updated successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof TeacherNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof TeacherConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("PATCH /api/teachers/:id error:", error);

      response.status(500).json({
        error: "Failed to update teacher",
      });
    }
  },
);
