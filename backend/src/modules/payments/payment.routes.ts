import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { requireTenant } from "../../middleware/tenant.middleware.js";

import {
  createPayment,
  getPayment,
  listPayments,
  updatePayment,
  PaymentAmountExceededError,
  PaymentCancelledInvoiceError,
  PaymentInvoiceNotFoundError,
  PaymentNotFoundError,
} from "./payment.service.js";

import { createPaymentSchema, updatePaymentSchema } from "./payment.schema.js";

const paymentRouter = Router();

/*
 * GET /api/payments
 */
paymentRouter.get(
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

      const payments = await listPayments(request.auth.instituteId);

      return response.status(200).json({
        data: payments,
      });
    } catch (error) {
      console.error("List payments error:", error);

      return response.status(500).json({
        error: "Failed to load payments",
      });
    }
  },
);

/*
 * GET /api/payments/:id
 */
paymentRouter.get(
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

      const paymentId = request.params.id;

      if (typeof paymentId !== "string") {
        return response.status(400).json({
          error: "Invalid payment ID",
        });
      }

      const payment = await getPayment(request.auth.instituteId, paymentId);

      return response.status(200).json({
        data: payment,
      });
    } catch (error) {
      if (error instanceof PaymentNotFoundError) {
        return response.status(404).json({
          error: error.message,
        });
      }

      console.error("Get payment error:", error);

      return response.status(500).json({
        error: "Failed to load payment",
      });
    }
  },
);

/*
 * POST /api/payments
 *
 * Owner and Staff can record payments.
 */
paymentRouter.post(
  "/",
  authenticate,
  requireTenant,
  authorize("owner", "staff"),
  async (request, response) => {
    const parsed = createPaymentSchema.safeParse(request.body);

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

      const payment = await createPayment(
        request.auth.instituteId,
        parsed.data,
      );

      return response.status(201).json({
        message: "Payment recorded successfully",
        data: payment,
      });
    } catch (error) {
      if (error instanceof PaymentInvoiceNotFoundError) {
        return response.status(404).json({
          error: error.message,
        });
      }

      if (
        error instanceof PaymentAmountExceededError ||
        error instanceof PaymentCancelledInvoiceError
      ) {
        return response.status(409).json({
          error: error.message,
        });
      }

      console.error("Create payment error:", error);

      return response.status(500).json({
        error: "Failed to record payment",
      });
    }
  },
);

/*
 * PATCH /api/payments/:id
 *
 * Owner and Staff can update payment details/status.
 */
paymentRouter.patch(
  "/:id",
  authenticate,
  requireTenant,
  authorize("owner", "staff"),
  async (request, response) => {
    const parsed = updatePaymentSchema.safeParse(request.body);

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

      const paymentId = request.params.id;

      if (typeof paymentId !== "string") {
        return response.status(400).json({
          error: "Invalid payment ID",
        });
      }

      const payment = await updatePayment(
        request.auth.instituteId,
        paymentId,
        parsed.data,
      );

      return response.status(200).json({
        message: "Payment updated successfully",
        data: payment,
      });
    } catch (error) {
      if (error instanceof PaymentNotFoundError) {
        return response.status(404).json({
          error: error.message,
        });
      }

      console.error("Update payment error:", error);

      return response.status(500).json({
        error: "Failed to update payment",
      });
    }
  },
);

export { paymentRouter };
