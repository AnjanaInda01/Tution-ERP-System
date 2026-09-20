import { Temporal } from "temporal-polyfill";

import { db } from "../../db/db.js";

import type {
  CreatePaymentInput,
  UpdatePaymentInput,
} from "./payment.schema.js";

export class PaymentNotFoundError extends Error {
  constructor() {
    super("Payment not found");
    this.name = "PaymentNotFoundError";
  }
}

export class PaymentInvoiceNotFoundError extends Error {
  constructor() {
    super("Invoice not found");
    this.name = "PaymentInvoiceNotFoundError";
  }
}

export class PaymentAmountExceededError extends Error {
  constructor() {
    super("Payment amount exceeds the remaining invoice balance");
    this.name = "PaymentAmountExceededError";
  }
}

export class PaymentCancelledInvoiceError extends Error {
  constructor() {
    super("Cannot record a payment for a cancelled invoice");
    this.name = "PaymentCancelledInvoiceError";
  }
}

function toNumber(value: unknown): number {
  return Number(String(value));
}

function calculateInvoiceStatus(
  invoiceAmount: number,
  paidAmount: number,
): "pending" | "partially_paid" | "paid" {
  if (paidAmount <= 0) {
    return "pending";
  }

  if (paidAmount >= invoiceAmount) {
    return "paid";
  }

  return "partially_paid";
}

/*
 * GET payments for one institute.
 */
export async function listPayments(instituteId: string) {
  return db.orm.public.Payment.where({
    instituteId,
  }).all();
}

/*
 * GET one payment.
 */
export async function getPayment(
  instituteId: string,
  paymentId: string,
) {
  const payment = await db.orm.public.Payment.first({
    id: paymentId,
    instituteId,
  });

  if (!payment) {
    throw new PaymentNotFoundError();
  }

  return payment;
}

/*
 * CREATE PAYMENT
 */
export async function createPayment(
  instituteId: string,
  input: CreatePaymentInput,
) {
  return db.transaction(async (tx) => {
    /*
     * Find invoice inside the current tenant.
     */
    const invoice = await tx.orm.public.Invoice.first({
      id: input.invoiceId,
      instituteId,
    });

    if (!invoice) {
      throw new PaymentInvoiceNotFoundError();
    }

    /*
     * Cannot pay cancelled invoice.
     */
    if (invoice.status === "cancelled") {
      throw new PaymentCancelledInvoiceError();
    }

    const invoiceAmount = toNumber(invoice.amount);

    /*
     * Get all completed payments for this invoice.
     */
    const existingPayments =
      await tx.orm.public.Payment.where({
        instituteId,
        invoiceId: invoice.id,
        status: "completed",
      }).all();

    let alreadyPaid = 0;

    for (const payment of existingPayments) {
      alreadyPaid += toNumber(payment.amount);
    }

    const remainingAmount = invoiceAmount - alreadyPaid;

    /*
     * Prevent overpayment.
     */
    if (input.amount > remainingAmount) {
      throw new PaymentAmountExceededError();
    }

    /*
     * Use the percentage snapshot stored on the invoice.
     */
    const teacherPercentage =
      toNumber(invoice.teacherPercentage);

    const institutePercentage =
      toNumber(invoice.institutePercentage);

    const teacherAmount =
      (input.amount * teacherPercentage) / 100;

    const instituteAmount =
      (input.amount * institutePercentage) / 100;

    /*
     * Payment date.
     */
    const paymentDate =
      input.paymentDate !== undefined
        ? Temporal.Instant.from(input.paymentDate)
        : Temporal.Now.instant();

    /*
     * Create payment.
     *
     * Prisma 8 ORM syntax:
     * Payment.create({...})
     */
    const payment = await tx.orm.public.Payment.create({
      instituteId,
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      enrollmentId: invoice.enrollmentId,

      amount: input.amount.toString(),

      teacherPercentage: teacherPercentage.toString(),
      institutePercentage: institutePercentage.toString(),

      teacherAmount: teacherAmount.toString(),
      instituteAmount: instituteAmount.toString(),

      method: input.method,
      status: "completed",

      paymentDate,

      ...(input.reference !== undefined
        ? {
            reference: input.reference,
          }
        : {}),

      ...(input.notes !== undefined
        ? {
            notes: input.notes,
          }
        : {}),
    });

    /*
     * Calculate new invoice status.
     */
    const totalPaid = alreadyPaid + input.amount;

    const invoiceStatus = calculateInvoiceStatus(
      invoiceAmount,
      totalPaid,
    );

    /*
     * Prisma 8 update syntax:
     *
     * Invoice.where({...}).update({...})
     */
    await tx.orm.public.Invoice.where({
      id: invoice.id,
      instituteId,
    }).update({
      status: invoiceStatus,
    });

    return payment;
  });
}

/*
 * UPDATE PAYMENT
 */
export async function updatePayment(
  instituteId: string,
  paymentId: string,
  input: UpdatePaymentInput,
) {
  return db.transaction(async (tx) => {
    const payment = await tx.orm.public.Payment.first({
      id: paymentId,
      instituteId,
    });

    if (!payment) {
      throw new PaymentNotFoundError();
    }

    const updateData: {
      status?: "pending" | "completed" | "failed" | "refunded";
      reference?: string | null;
      notes?: string | null;
    } = {};

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.reference !== undefined) {
      updateData.reference = input.reference;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    let updatedPayment = payment;

    if (Object.keys(updateData).length > 0) {
      const updated = await tx.orm.public.Payment.where({
        id: paymentId,
        instituteId,
      }).update(updateData);

      if (!updated) {
        throw new PaymentNotFoundError();
      }

      updatedPayment = updated;
    }

    /*
     * Recalculate invoice status.
     */
    const invoice = await tx.orm.public.Invoice.first({
      id: payment.invoiceId,
      instituteId,
    });

    if (invoice) {
      const completedPayments =
        await tx.orm.public.Payment.where({
          instituteId,
          invoiceId: invoice.id,
          status: "completed",
        }).all();

      let totalPaid = 0;

      for (const currentPayment of completedPayments) {
        totalPaid += toNumber(currentPayment.amount);
      }

      const invoiceStatus = calculateInvoiceStatus(
        toNumber(invoice.amount),
        totalPaid,
      );

      await tx.orm.public.Invoice.where({
        id: invoice.id,
        instituteId,
      }).update({
        status: invoiceStatus,
      });
    }

    return updatedPayment;
  });
}