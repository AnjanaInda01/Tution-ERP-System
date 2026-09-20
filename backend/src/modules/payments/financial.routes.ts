import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { requireTenant } from "../../middleware/tenant.middleware.js";

import {
  getFinancialDashboard,
  getMonthlyFinancialSummary,
  getOutstandingInvoices,
  getTeacherFinancialSummary,
  getStudentFinancialSummary,
} from "./financial.service.js";

const financialRouter = Router();

financialRouter.use(authenticate);
financialRouter.use(requireTenant);
financialRouter.use(authorize("owner", "staff"));

/*
 * GET /api/financial/dashboard
 *
 * Optional:
 * ?year=2026&month=9
 */
financialRouter.get("/dashboard", async (request, response) => {
  try {
    if (!request.auth) {
      return response.status(401).json({
        error: "Authentication required",
      });
    }

    const yearParam = request.query.year;
    const monthParam = request.query.month;

    let year: number | undefined;
    let month: number | undefined;

    if (yearParam !== undefined) {
      if (typeof yearParam !== "string") {
        return response.status(400).json({
          error: "Invalid year",
        });
      }

      year = Number(yearParam);

      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return response.status(400).json({
          error: "Invalid year",
        });
      }
    }

    if (monthParam !== undefined) {
      if (typeof monthParam !== "string") {
        return response.status(400).json({
          error: "Invalid month",
        });
      }

      month = Number(monthParam);

      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return response.status(400).json({
          error: "Invalid month",
        });
      }
    }

    const data = await getFinancialDashboard(
      request.auth.instituteId,
      year,
      month,
    );

    return response.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Financial dashboard error:", error);

    return response.status(500).json({
      error: "Failed to load financial dashboard",
    });
  }
});

/*
 * GET /api/financial/monthly?year=2026
 */
financialRouter.get("/monthly", async (request, response) => {
  try {
    if (!request.auth) {
      return response.status(401).json({
        error: "Authentication required",
      });
    }

    const yearParam = request.query.year;

    if (typeof yearParam !== "string") {
      return response.status(400).json({
        error: "year query parameter is required",
      });
    }

    const year = Number(yearParam);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return response.status(400).json({
        error: "Invalid year",
      });
    }

    const data = await getMonthlyFinancialSummary(
      request.auth.instituteId,
      year,
    );

    return response.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Monthly financial error:", error);

    return response.status(500).json({
      error: "Failed to load monthly financial summary",
    });
  }
});

/*
 * GET /api/financial/outstanding
 */
financialRouter.get("/outstanding", async (request, response) => {
  try {
    if (!request.auth) {
      return response.status(401).json({
        error: "Authentication required",
      });
    }

    const data = await getOutstandingInvoices(request.auth.instituteId);

    return response.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Outstanding invoices error:", error);

    return response.status(500).json({
      error: "Failed to load outstanding invoices",
    });
  }
});

/*
 * GET /api/financial/teachers/:teacherId
 */
financialRouter.get("/teachers/:teacherId", async (request, response) => {
  try {
    if (!request.auth) {
      return response.status(401).json({
        error: "Authentication required",
      });
    }

    const teacherId = request.params.teacherId;

    if (typeof teacherId !== "string") {
      return response.status(400).json({
        error: "Invalid teacher ID",
      });
    }

    const data = await getTeacherFinancialSummary(
      request.auth.instituteId,
      teacherId,
    );

    return response.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Teacher financial error:", error);

    return response.status(500).json({
      error: "Failed to load teacher financial summary",
    });
  }
});

/*
 * GET /api/financial/students/:studentId
 */
financialRouter.get("/students/:studentId", async (request, response) => {
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

    const data = await getStudentFinancialSummary(
      request.auth.instituteId,
      studentId,
    );

    return response.status(200).json({
      data,
    });
  } catch (error) {
    console.error("Student financial error:", error);

    return response.status(500).json({
      error: "Failed to load student financial summary",
    });
  }
});

export { financialRouter };
