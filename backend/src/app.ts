import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { instituteRouter } from "./modules/institutes/institute.routes.js";
import { academicRouter } from "./modules/academics/academic.routes.js";
import { teacherRouter } from "./modules/teachers/teacher.routes.js";
import { classRouter } from "./modules/classes/class.routes.js";
import { studentRouter } from "./modules/students/student.routes.js";
import { enrollmentRouter } from "./modules/enrollments/enrollment.routes.js";
import { invoiceRouter } from "./modules/payments/invoice.routes.js";
import { paymentRouter } from "./modules/payments/payment.routes.js";
import { financialRouter } from "./modules/payments/financial.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/institute", instituteRouter);
  app.use("/api/academic", academicRouter);
  app.use("/api/teachers", teacherRouter);
  app.use("/api/classes", classRouter);
  app.use("/api/students", studentRouter);
  app.use("/api/enrollments", enrollmentRouter);
  app.use("/api/invoices", invoiceRouter);
  app.use("/api/payments", paymentRouter);
  app.use("/api/financial", financialRouter);

  app.use((_request, response) => {
    response.status(404).json({ error: "Route not found" });
  });

  return app;
}
