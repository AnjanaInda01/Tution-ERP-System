import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { requireTenant } from "../../middleware/tenant.middleware.js";

import {
  ClassForScheduleNotFoundError,
  ClassScheduleConflictError,
  ClassScheduleNotFoundError,
  createClassSchedule,
  deleteClassSchedule,
  getClassSchedule,
  listClassSchedules,
  updateClassSchedule,
} from "./class.service.js";

import {
  createClassScheduleSchema,
  updateClassScheduleSchema,
} from "./class.schema.js";

export const classRouter = Router();

/*
 * GET /api/classes/schedules
 *
 * Get all schedules belonging to the current institute.
 */
classRouter.get(
  "/schedules",
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

      const schedules = await listClassSchedules(auth.instituteId);

      response.status(200).json({
        data: {
          schedules,
        },
      });
    } catch (error) {
      console.error("GET /api/classes/schedules error:", error);

      response.status(500).json({
        error: "Failed to load class schedules",
      });
    }
  },
);

/*
 * GET /api/classes/:classId/schedules
 *
 * Get schedules for one class.
 */
classRouter.get(
  "/:classId/schedules",
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

      const classId = request.params.classId;

      if (typeof classId !== "string") {
        response.status(400).json({
          error: "Class ID is required",
        });
        return;
      }

      const schedules = await listClassSchedules(auth.instituteId, classId);

      response.status(200).json({
        data: {
          schedules,
        },
      });
    } catch (error) {
      if (error instanceof ClassForScheduleNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      console.error("GET /api/classes/:classId/schedules error:", error);

      response.status(500).json({
        error: "Failed to load class schedules",
      });
    }
  },
);

/*
 * GET /api/classes/schedules/:id
 *
 * Get one schedule.
 */
classRouter.get(
  "/schedules/:id",
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

      const scheduleId = request.params.id;

      if (typeof scheduleId !== "string") {
        response.status(400).json({
          error: "Schedule ID is required",
        });
        return;
      }

      const schedule = await getClassSchedule(auth.instituteId, scheduleId);

      response.status(200).json({
        data: {
          schedule,
        },
      });
    } catch (error) {
      if (error instanceof ClassScheduleNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      console.error("GET /api/classes/schedules/:id error:", error);

      response.status(500).json({
        error: "Failed to load class schedule",
      });
    }
  },
);

/*
 * POST /api/classes/schedules
 */
classRouter.post(
  "/schedules",
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

      const parsed = createClassScheduleSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const schedule = await createClassSchedule(auth.instituteId, parsed.data);

      response.status(201).json({
        message: "Class schedule created successfully",
        data: {
          schedule,
        },
      });
    } catch (error) {
      if (error instanceof ClassForScheduleNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof ClassScheduleConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("POST /api/classes/schedules error:", error);

      response.status(500).json({
        error: "Failed to create class schedule",
      });
    }
  },
);

/*
 * PATCH /api/classes/schedules/:id
 */
classRouter.patch(
  "/schedules/:id",
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

      const scheduleId = request.params.id;

      if (typeof scheduleId !== "string") {
        response.status(400).json({
          error: "Schedule ID is required",
        });
        return;
      }

      const parsed = updateClassScheduleSchema.safeParse(request.body);

      if (!parsed.success) {
        response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
        return;
      }

      const schedule = await updateClassSchedule(
        auth.instituteId,
        scheduleId,
        parsed.data,
      );

      if (!schedule) {
        response.status(404).json({
          error: "Class schedule not found",
        });
        return;
      }

      response.status(200).json({
        message: "Class schedule updated successfully",
        data: {
          schedule,
        },
      });
    } catch (error) {
      if (error instanceof ClassScheduleNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      if (error instanceof ClassScheduleConflictError) {
        response.status(409).json({
          error: error.message,
        });
        return;
      }

      console.error("PATCH /api/classes/schedules/:id error:", error);

      response.status(500).json({
        error: "Failed to update class schedule",
      });
    }
  },
);

/*
 * DELETE /api/classes/schedules/:id
 */
classRouter.delete(
  "/schedules/:id",
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

      const scheduleId = request.params.id;

      if (typeof scheduleId !== "string") {
        response.status(400).json({
          error: "Schedule ID is required",
        });
        return;
      }

      await deleteClassSchedule(auth.instituteId, scheduleId);

      response.status(200).json({
        message: "Class schedule deleted successfully",
      });
    } catch (error) {
      if (error instanceof ClassScheduleNotFoundError) {
        response.status(404).json({
          error: error.message,
        });
        return;
      }

      console.error("DELETE /api/classes/schedules/:id error:", error);

      response.status(500).json({
        error: "Failed to delete class schedule",
      });
    }
  },
);
