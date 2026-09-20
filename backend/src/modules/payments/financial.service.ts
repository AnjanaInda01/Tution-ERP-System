import { db } from "../../db/db.js";

function toNumber(value: unknown): number {
  return Number(String(value));
}

export async function getFinancialDashboard(
  instituteId: string,
  billingYear?: number,
  billingMonth?: number,
) {
  const invoiceFilters: {
    instituteId: string;
    billingYear?: number;
    billingMonth?: number;
  } = {
    instituteId,
  };

  if (billingYear !== undefined) {
    invoiceFilters.billingYear = billingYear;
  }

  if (billingMonth !== undefined) {
    invoiceFilters.billingMonth = billingMonth;
  }

  const invoices = await db.orm.public.Invoice.where(invoiceFilters).all();

  const payments = await db.orm.public.Payment.where({
    instituteId,
    status: "completed",
  }).all();

  let totalInvoiced = 0;
  let pendingInvoices = 0;
  let partiallyPaidInvoices = 0;
  let paidInvoices = 0;
  let cancelledInvoices = 0;

  for (const invoice of invoices) {
    const amount = toNumber(invoice.amount);

    if (invoice.status !== "cancelled") {
      totalInvoiced += amount;
    }

    switch (invoice.status) {
      case "pending":
      case "overdue":
        pendingInvoices++;
        break;

      case "partially_paid":
        partiallyPaidInvoices++;
        break;

      case "paid":
        paidInvoices++;
        break;

      case "cancelled":
        cancelledInvoices++;
        break;
    }
  }

  let totalCollected = 0;
  let teacherEarnings = 0;
  let instituteEarnings = 0;

  for (const payment of payments) {
    /*
     * If a billing period was supplied, only count payments
     * belonging to invoices in that period.
     */
    if (billingYear !== undefined || billingMonth !== undefined) {
      const invoice = invoices.find((item) => item.id === payment.invoiceId);

      if (!invoice) {
        continue;
      }
    }

    const amount = toNumber(payment.amount);

    totalCollected += amount;
    teacherEarnings += toNumber(payment.teacherAmount);
    instituteEarnings += toNumber(payment.instituteAmount);
  }

  const outstanding = Math.max(totalInvoiced - totalCollected, 0);

  return {
    period: {
      billingYear: billingYear ?? null,
      billingMonth: billingMonth ?? null,
    },

    summary: {
      totalInvoiced,
      totalCollected,
      outstanding,
    },

    distribution: {
      teacherEarnings,
      instituteEarnings,
    },

    invoices: {
      total: invoices.length,
      pending: pendingInvoices,
      partiallyPaid: partiallyPaidInvoices,
      paid: paidInvoices,
      cancelled: cancelledInvoices,
    },
  };
}

export async function getMonthlyFinancialSummary(
  instituteId: string,
  year: number,
) {
  const invoices = await db.orm.public.Invoice.where({
    instituteId,
    billingYear: year,
  }).all();

  const payments = await db.orm.public.Payment.where({
    instituteId,
    status: "completed",
  }).all();

  const months = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    totalInvoiced: 0,
    totalCollected: 0,
    outstanding: 0,
    teacherEarnings: 0,
    instituteEarnings: 0,
  }));

  for (const invoice of invoices) {
    if (invoice.status === "cancelled") {
      continue;
    }

    const month = months[invoice.billingMonth - 1];

    if (!month) {
      continue;
    }

    month.totalInvoiced += toNumber(invoice.amount);
  }

  for (const payment of payments) {
    const invoice = invoices.find((item) => item.id === payment.invoiceId);

    if (!invoice || invoice.status === "cancelled") {
      continue;
    }

    const month = months[invoice.billingMonth - 1];

    if (!month) {
      continue;
    }

    month.totalCollected += toNumber(payment.amount);
    month.teacherEarnings += toNumber(payment.teacherAmount);
    month.instituteEarnings += toNumber(payment.instituteAmount);
  }

  for (const month of months) {
    month.outstanding = Math.max(month.totalInvoiced - month.totalCollected, 0);
  }

  return {
    year,
    months,
  };
}

export async function getOutstandingInvoices(instituteId: string) {
  const invoices = await db.orm.public.Invoice.where({
    instituteId,
  }).all();

  const payments = await db.orm.public.Payment.where({
    instituteId,
    status: "completed",
  }).all();

  const result = [];

  for (const invoice of invoices) {
    if (invoice.status === "cancelled") {
      continue;
    }

    const invoicePayments = payments.filter(
      (payment) => payment.invoiceId === invoice.id,
    );

    let paidAmount = 0;

    for (const payment of invoicePayments) {
      paidAmount += toNumber(payment.amount);
    }

    const invoiceAmount = toNumber(invoice.amount);
    const outstanding = Math.max(invoiceAmount - paidAmount, 0);

    if (outstanding <= 0) {
      continue;
    }

    result.push({
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      enrollmentId: invoice.enrollmentId,

      billingYear: invoice.billingYear,
      billingMonth: invoice.billingMonth,

      invoiceAmount,
      paidAmount,
      outstanding,

      status: invoice.status,
      dueDate: invoice.dueDate,
      description: invoice.description,
    });
  }

  return result;
}

export async function getTeacherFinancialSummary(
  instituteId: string,
  teacherId: string,
) {
  const payments = await db.orm.public.Payment.where({
    instituteId,
    status: "completed",
  }).all();

  const enrollments = await db.orm.public.Enrollment.where({
    instituteId,
  }).all();

  /*
   * Enrollment does not contain teacherId.
   *
   * Relationship:
   *
   * Payment
   *   -> Enrollment
   *      -> Class
   *         -> teacherId
   */
  const classes = await db.orm.public.Class.where({
    instituteId,
    teacherId,
  }).all();

  const teacherClassIds = new Set(classes.map((classRecord) => classRecord.id));

  let totalCollected = 0;
  let teacherEarnings = 0;

  const paymentDetails = [];

  for (const payment of payments) {
    const enrollment = enrollments.find(
      (item) => item.id === payment.enrollmentId,
    );

    if (!enrollment) {
      continue;
    }

    /*
     * Check whether the enrollment's class belongs
     * to the requested teacher.
     */
    if (!teacherClassIds.has(enrollment.classId)) {
      continue;
    }

    const paymentAmount = toNumber(payment.amount);
    const teacherAmount = toNumber(payment.teacherAmount);

    totalCollected += paymentAmount;
    teacherEarnings += teacherAmount;

    paymentDetails.push({
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      studentId: payment.studentId,
      enrollmentId: payment.enrollmentId,

      amount: paymentAmount,

      teacherPercentage: toNumber(payment.teacherPercentage),

      teacherAmount,

      paymentDate: payment.paymentDate,
      method: payment.method,
      reference: payment.reference,
    });
  }

  return {
    teacherId,

    totalCollected,
    teacherEarnings,

    payments: paymentDetails,
  };
}

export async function getStudentFinancialSummary(
  instituteId: string,
  studentId: string,
) {
  const invoices = await db.orm.public.Invoice.where({
    instituteId,
    studentId,
  }).all();

  const payments = await db.orm.public.Payment.where({
    instituteId,
    studentId,
    status: "completed",
  }).all();

  let totalInvoiced = 0;
  let totalPaid = 0;

  const invoiceDetails = [];

  for (const invoice of invoices) {
    /*
     * Cancelled invoices do not contribute to
     * the student's financial balance.
     */
    if (invoice.status === "cancelled") {
      continue;
    }

    const invoiceAmount = toNumber(invoice.amount);

    const invoicePayments = payments.filter(
      (payment) => payment.invoiceId === invoice.id,
    );

    let paidAmount = 0;

    for (const payment of invoicePayments) {
      paidAmount += toNumber(payment.amount);
    }

    const outstanding = Math.max(invoiceAmount - paidAmount, 0);

    totalInvoiced += invoiceAmount;
    totalPaid += paidAmount;

    invoiceDetails.push({
      invoiceId: invoice.id,

      billingYear: invoice.billingYear,
      billingMonth: invoice.billingMonth,

      invoiceAmount,
      paidAmount,
      outstanding,

      status: invoice.status,
      dueDate: invoice.dueDate,
      description: invoice.description,
    });
  }

  return {
    studentId,

    totalInvoiced,
    totalPaid,

    outstanding: Math.max(totalInvoiced - totalPaid, 0),

    invoices: invoiceDetails,
  };
}
