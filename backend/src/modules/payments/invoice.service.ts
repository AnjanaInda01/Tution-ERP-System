import { Temporal } from "temporal-polyfill";

import { db } from "../../db/db.js";

import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
} from "./invoice.schema.js";

export class InvoiceNotFoundError extends Error {
  constructor() {
    super("Invoice not found");
    this.name = "InvoiceNotFoundError";
  }
}

export class InvoiceConflictError extends Error {
  constructor(
    message = "An invoice already exists for this enrollment and billing period",
  ) {
    super(message);
    this.name = "InvoiceConflictError";
  }
}

export class EnrollmentForInvoiceNotFoundError extends Error {
  constructor() {
    super("Enrollment not found");
    this.name = "EnrollmentForInvoiceNotFoundError";
  }
}

export class StudentForInvoiceNotFoundError extends Error {
  constructor() {
    super("Student not found");
    this.name = "StudentForInvoiceNotFoundError";
  }
}

export class InvoiceStudentMismatchError extends Error {
  constructor() {
    super("The student does not belong to the selected enrollment");
    this.name = "InvoiceStudentMismatchError";
  }
}

export class InvoiceClassFeeError extends Error {
  constructor() {
    super("This class does not have a monthly fee configured");
    this.name = "InvoiceClassFeeError";
  }
}

export async function listInvoices(instituteId: string) {
  const invoices = await db.orm.public.Invoice.where({
    instituteId,
  }).all();

  return Promise.all(
    invoices.map(async (invoice) => {
      const student = await db.orm.public.Student.first({
        id: invoice.studentId,
        instituteId,
      });

      const enrollment = await db.orm.public.Enrollment.first({
        id: invoice.enrollmentId,
        instituteId,
      });

      let classRecord = null;

      if (enrollment) {
        classRecord = await db.orm.public.Class.first({
          id: enrollment.classId,
          instituteId,
        });
      }

      return {
        invoice,
        student,
        enrollment,
        class: classRecord,
      };
    }),
  );
}

export async function getInvoice(instituteId: string, invoiceId: string) {
  const invoice = await db.orm.public.Invoice.first({
    id: invoiceId,
    instituteId,
  });

  if (!invoice) {
    throw new InvoiceNotFoundError();
  }

  const student = await db.orm.public.Student.first({
    id: invoice.studentId,
    instituteId,
  });

  const enrollment = await db.orm.public.Enrollment.first({
    id: invoice.enrollmentId,
    instituteId,
  });

  let classRecord = null;

  if (enrollment) {
    classRecord = await db.orm.public.Class.first({
      id: enrollment.classId,
      instituteId,
    });
  }

  const payments = await db.orm.public.Payment.where({
    instituteId,
    invoiceId,
  }).all();

  return {
    invoice,
    student,
    enrollment,
    class: classRecord,
    payments,
  };
}

export async function createInvoice(
  instituteId: string,
  input: CreateInvoiceInput,
) {
  const enrollment = await db.orm.public.Enrollment.first({
    id: input.enrollmentId,
    instituteId,
  });

  if (!enrollment) {
    throw new EnrollmentForInvoiceNotFoundError();
  }

  if (enrollment.studentId !== input.studentId) {
    throw new InvoiceStudentMismatchError();
  }

  const student = await db.orm.public.Student.first({
    id: input.studentId,
    instituteId,
  });

  if (!student) {
    throw new StudentForInvoiceNotFoundError();
  }

  const classRecord = await db.orm.public.Class.first({
    id: enrollment.classId,
    instituteId,
  });

  if (!classRecord) {
    throw new EnrollmentForInvoiceNotFoundError();
  }

  if (classRecord.monthlyFee === null) {
    throw new InvoiceClassFeeError();
  }

  /*
   * Prevent duplicate monthly invoices.
   */
  const existingInvoice = await db.orm.public.Invoice.first({
    enrollmentId: input.enrollmentId,
    billingYear: input.billingYear,
    billingMonth: input.billingMonth,
  });

  if (existingInvoice) {
    throw new InvoiceConflictError();
  }

  /*
   * Snapshot the class revenue percentages.
   *
   * These values are stored on the invoice so historical
   * invoices are not affected if the class percentages change later.
   */
  const teacherPercentage = classRecord.teacherPercentage;
  const institutePercentage = classRecord.institutePercentage;

  const invoice = await db.orm.public.Invoice.create({
    instituteId,
    studentId: input.studentId,
    enrollmentId: input.enrollmentId,
    billingYear: input.billingYear,
    billingMonth: input.billingMonth,
    amount: input.amount.toString(),
    teacherPercentage,
    institutePercentage,
    status: "pending",
    ...(input.dueDate !== undefined
      ? {
          dueDate: Temporal.Instant.from(`${input.dueDate}T00:00:00Z`),
        }
      : {}),
    ...(input.description !== undefined
      ? {
          description: input.description,
        }
      : {}),
  });

  return {
    invoice,
    student,
    enrollment,
    class: classRecord,
  };
}

export async function updateInvoice(
  instituteId: string,
  invoiceId: string,
  input: UpdateInvoiceInput,
) {
  const invoice = await db.orm.public.Invoice.first({
    id: invoiceId,
    instituteId,
  });

  if (!invoice) {
    throw new InvoiceNotFoundError();
  }

  const updateData: {
    status?: "pending" | "partially_paid" | "paid" | "cancelled" | "overdue";
    dueDate?: Temporal.Instant | null;
    description?: string | null;
  } = {};

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  if (input.dueDate !== undefined) {
    updateData.dueDate =
      input.dueDate === null
        ? null
        : Temporal.Instant.from(`${input.dueDate}T00:00:00Z`);
  }

  if (input.description !== undefined) {
    updateData.description = input.description;
  }

  let updatedInvoice = invoice;

  if (Object.keys(updateData).length > 0) {
    const updated = await db.orm.public.Invoice.where({
      id: invoiceId,
      instituteId,
    }).update(updateData);

    if (!updated) {
      throw new InvoiceNotFoundError();
    }

    updatedInvoice = updated;
  }

  return getInvoice(instituteId, updatedInvoice.id);
}
