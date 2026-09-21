import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { requireTenant } from "../../middleware/tenant.middleware.js";

import {
  createAttendanceRecordSchema,
  createAttendanceSessionSchema,
  updateAttendanceRecordSchema,
  updateAttendanceSessionSchema,
} from "./attendance.schema.js";

import {
  createAttendanceRecord,
  createAttendanceSession,
  getAttendanceSession,
  getClassAttendance,
  getStudentAttendance,
  listAttendanceSessions,
  updateAttendanceRecord,
  updateAttendanceSession,
} from "./attendance.service.js";

const attendanceRouter = Router();

/*
 * GET /api/attendance/sessions
 *
 * Owner / Staff:
 *   View all attendance sessions.
 *
 * Teacher:
 *   View sessions belonging to their classes.
 *
 * Student:
 *   View sessions belonging to their enrolled classes.
 */
attendanceRouter.get(
  "/sessions",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      if (!request.auth) {
        return response.status(401).json({
          error: "Authentication required",
        });
      }

      const sessions = await listAttendanceSessions(request.auth);

      return response.status(200).json({
        data: sessions,
      });
    } catch (error) {
      console.error("GET /api/attendance/sessions error:", error);

      return response.status(500).json({
        error: "Failed to load attendance sessions",
      });
    }
  },
);

/*
 * POST /api/attendance/sessions
 *
 * Owner / Staff / Teacher.
 */
attendanceRouter.post(
  "/sessions",
  authenticate,
  requireTenant,
  authorize("owner", "staff", "teacher"),
  async (request, response) => {
    try {
      if (!request.auth) {
        return response.status(401).json({
          error: "Authentication required",
        });
      }

      const parsed = createAttendanceSessionSchema.safeParse(
        request.body,
      );

      if (!parsed.success) {
        return response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const session = await createAttendanceSession(
        request.auth,
        parsed.data,
      );

      return response.status(201).json({
        message: "Attendance session created successfully",
        data: {
          session,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Class not found"
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "You do not have access to this class"
      ) {
        return response.status(403).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "Attendance session already exists for this class and date"
      ) {
        return response.status(409).json({
          error: error.message,
        });
      }

      console.error(
        "POST /api/attendance/sessions error:",
        error,
      );

      return response.status(500).json({
        error: "Failed to create attendance session",
      });
    }
  },
);

/*
 * GET /api/attendance/sessions/:id
 *
 * All authenticated roles.
 */
attendanceRouter.get(
  "/sessions/:id",
  authenticate,
  requireTenant,
  async (request, response) => {
    try {
      if (!request.auth) {
        return response.status(401).json({
          error: "Authentication required",
        });
      }

      const sessionId = request.params.id;

      if (typeof sessionId !== "string") {
        return response.status(400).json({
          error: "Invalid attendance session ID",
        });
      }

      const result = await getAttendanceSession(
        request.auth,
        sessionId,
      );

      return response.status(200).json({
        data: result,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Attendance session not found"
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message === "Class not found"
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "You do not have access to this class"
      ) {
        return response.status(403).json({
          error: error.message,
        });
      }

      console.error(
        "GET /api/attendance/sessions/:id error:",
        error,
      );

      return response.status(500).json({
        error: "Failed to load attendance session",
      });
    }
  },
);

/*
 * PATCH /api/attendance/sessions/:id
 *
 * Owner / Staff / Teacher.
 */
attendanceRouter.patch(
  "/sessions/:id",
  authenticate,
  requireTenant,
  authorize("owner", "staff", "teacher"),
  async (request, response) => {
    try {
      if (!request.auth) {
        return response.status(401).json({
          error: "Authentication required",
        });
      }

      const sessionId = request.params.id;

      if (typeof sessionId !== "string") {
        return response.status(400).json({
          error: "Invalid attendance session ID",
        });
      }

      const parsed = updateAttendanceSessionSchema.safeParse(
        request.body,
      );

      if (!parsed.success) {
        return response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const session = await updateAttendanceSession(
        request.auth,
        sessionId,
        parsed.data,
      );

      return response.status(200).json({
        message: "Attendance session updated successfully",
        data: {
          session,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Attendance session not found"
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message === "Class not found"
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "You do not have access to this class"
      ) {
        return response.status(403).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "Attendance session already exists for this class and date"
      ) {
        return response.status(409).json({
          error: error.message,
        });
      }

      console.error(
        "PATCH /api/attendance/sessions/:id error:",
        error,
      );

      return response.status(500).json({
        error: "Failed to update attendance session",
      });
    }
  },
);

/*
 * POST /api/attendance/sessions/:id/records
 *
 * Owner / Staff / Teacher.
 */
attendanceRouter.post(
  "/sessions/:id/records",
  authenticate,
  requireTenant,
  authorize("owner", "staff", "teacher"),
  async (request, response) => {
    try {
      if (!request.auth) {
        return response.status(401).json({
          error: "Authentication required",
        });
      }

      const sessionId = request.params.id;

      if (typeof sessionId !== "string") {
        return response.status(400).json({
          error: "Invalid attendance session ID",
        });
      }

      const parsed = createAttendanceRecordSchema.safeParse(
        request.body,
      );

      if (!parsed.success) {
        return response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const record = await createAttendanceRecord(
        request.auth,
        sessionId,
        parsed.data,
      );

      return response.status(201).json({
        message: "Attendance record created successfully",
        data: {
          record,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Attendance session not found"
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message === "Class not found"
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "You do not have access to this class"
      ) {
        return response.status(403).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "Student is not actively enrolled in this class"
      ) {
        return response.status(400).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "Attendance record already exists for this student"
      ) {
        return response.status(409).json({
          error: error.message,
        });
      }

      console.error(
        "POST /api/attendance/sessions/:id/records error:",
        error,
      );

      return response.status(500).json({
        error: "Failed to create attendance record",
      });
    }
  },
);

/*
 * PATCH /api/attendance/records/:id
 *
 * Owner / Staff / Teacher.
 */
attendanceRouter.patch(
  "/records/:id",
  authenticate,
  requireTenant,
  authorize("owner", "staff", "teacher"),
  async (request, response) => {
    try {
      if (!request.auth) {
        return response.status(401).json({
          error: "Authentication required",
        });
      }

      const recordId = request.params.id;

      if (typeof recordId !== "string") {
        return response.status(400).json({
          error: "Invalid attendance record ID",
        });
      }

      const parsed = updateAttendanceRecordSchema.safeParse(
        request.body,
      );

      if (!parsed.success) {
        return response.status(400).json({
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const record = await updateAttendanceRecord(
        request.auth,
        recordId,
        parsed.data,
      );

      return response.status(200).json({
        message: "Attendance record updated successfully",
        data: {
          record,
        },
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Attendance record not found"
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message === "Attendance session not found"
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message === "Class not found"
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "You do not have access to this class"
      ) {
        return response.status(403).json({
          error: error.message,
        });
      }

      console.error(
        "PATCH /api/attendance/records/:id error:",
        error,
      );

      return response.status(500).json({
        error: "Failed to update attendance record",
      });
    }
  },
);

/*
 * GET /api/attendance/classes/:classId
 *
 * Owner / Staff / Teacher.
 *
 * Returns all attendance records for a class.
 */
attendanceRouter.get(
  "/classes/:classId",
  authenticate,
  requireTenant,
  authorize("owner", "staff", "teacher"),
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

      const records = await getClassAttendance(
        request.auth,
        classId,
      );

      return response.status(200).json({
        data: records,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Class not found"
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "You do not have access to this class"
      ) {
        return response.status(403).json({
          error: error.message,
        });
      }

      console.error(
        "GET /api/attendance/classes/:classId error:",
        error,
      );

      return response.status(500).json({
        error: "Failed to load class attendance",
      });
    }
  },
);

/*
 * GET /api/attendance/students/:studentId
 *
 * Owner / Staff / Teacher / Student.
 *
 * Student can only access their own attendance.
 */
attendanceRouter.get(
  "/students/:studentId",
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

      const records = await getStudentAttendance(
        request.auth,
        studentId,
      );

      return response.status(200).json({
        data: records,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Student not found"
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message ===
          "You can only view your own attendance"
      ) {
        return response.status(403).json({
          error: error.message,
        });
      }

      console.error(
        "GET /api/attendance/students/:studentId error:",
        error,
      );

      return response.status(500).json({
        error: "Failed to load student attendance",
      });
    }
  },
);

export { attendanceRouter };