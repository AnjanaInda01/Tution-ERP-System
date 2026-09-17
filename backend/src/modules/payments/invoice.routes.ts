import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { requireTenant } from "../../middleware/tenant.middleware.js";

import { createInvoiceSchema, updateInvoiceSchema } from "./invoice.schema.js";

import {
  createInvoice,
  EnrollmentForInvoiceNotFoundError,
  getInvoice,
  InvoiceClassFeeError,
  InvoiceConflictError,
  InvoiceNotFoundError,
  InvoiceStudentMismatchError,
  listInvoices,
  StudentForInvoiceNotFoundError,
  updateInvoice,
} from "./invoice.service.js";

const invoiceRouter = Router();

/*
 * GET /api/invoices
 *
 * List invoices for the current institute.
 */
invoiceRouter.get(
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

      const invoices = await listInvoices(request.auth.instituteId);

      return response.status(200).json({
        data: invoices,
      });
    } catch (error) {
      console.error("List invoices error:", error);

      return response.status(500).json({
        error: "Failed to load invoices",
      });
    }
  },
);

/*
 * GET /api/invoices/:id
 *
 * Get one invoice.
 */
invoiceRouter.get(
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

      const invoiceId = request.params.id;

      if (typeof invoiceId !== "string") {
        return response.status(400).json({
          error: "Invalid invoice ID",
        });
      }

      const invoice = await getInvoice(request.auth.instituteId, invoiceId);

      return response.status(200).json({
        data: invoice,
      });
    } catch (error) {
      if (error instanceof InvoiceNotFoundError) {
        return response.status(404).json({
          error: error.message,
        });
      }

      console.error("Get invoice error:", error);

      return response.status(500).json({
        error: "Failed to load invoice",
      });
    }
  },
);

/*
 * POST /api/invoices
 *
 * Create a monthly invoice.
 *
 * Owner only.
 */
invoiceRouter.post(
  "/",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    const parsed = createInvoiceSchema.safeParse(request.body);

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

      const result = await createInvoice(request.auth.instituteId, parsed.data);

      return response.status(201).json({
        message: "Invoice created successfully",
        data: result,
      });
    } catch (error) {
      if (
        error instanceof EnrollmentForInvoiceNotFoundError ||
        error instanceof StudentForInvoiceNotFoundError
      ) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof InvoiceConflictError ||
        error instanceof InvoiceStudentMismatchError
      ) {
        return response.status(409).json({
          error: error.message,
        });
      }

      if (error instanceof InvoiceClassFeeError) {
        return response.status(400).json({
          error: error.message,
        });
      }

      console.error("Create invoice error:", error);

      return response.status(500).json({
        error: "Failed to create invoice",
      });
    }
  },
);

/*
 * PATCH /api/invoices/:id
 *
 * Update invoice status/details.
 *
 * Owner only.
 */
invoiceRouter.patch(
  "/:id",
  authenticate,
  requireTenant,
  authorize("owner"),
  async (request, response) => {
    const parsed = updateInvoiceSchema.safeParse(request.body);

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

      const invoiceId = request.params.id;

      if (typeof invoiceId !== "string") {
        return response.status(400).json({
          error: "Invalid invoice ID",
        });
      }

      const result = await updateInvoice(
        request.auth.instituteId,
        invoiceId,
        parsed.data,
      );

      return response.status(200).json({
        message: "Invoice updated successfully",
        data: result,
      });
    } catch (error) {
      if (error instanceof InvoiceNotFoundError) {
        return response.status(404).json({
          error: error.message,
        });
      }

      console.error("Update invoice error:", error);

      return response.status(500).json({
        error: "Failed to update invoice",
      });
    }
  },
);

export { invoiceRouter };
