import express from "express";
import { config } from "dotenv";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { logger } from "./utils/logger.js";

// ── Load environment variables ─────────────────────────────────
config();
connectDB();

const app = express();

// ── Middleware ─────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// ── API v1 Routes ─────────────────────────────────────────────
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import patientRoutes from "./modules/patient/patient.routes.js";
import coupleRoutes from "./modules/couple/couple.routes.js";
import cycleRoutes from "./modules/cycle/cycle.routes.js";
import cryoRoutes from "./modules/cryo/cryo.routes.js";
import investigationRoutes from "./modules/investigation/investigation.routes.js";
import appointmentRoutes from "./modules/appointment/appointment.routes.js";
import billingRoutes from "./modules/billing/billing.routes.js";
import reportRoutes from "./modules/report/report.routes.js";
import taskRoutes from "./modules/task/task.routes.js";
import embryologyRoutes from "./modules/embryology/embryology.routes.js";
import permissionRoutes from "./modules/permission/permission.routes.js";
import roleRoutes from "./modules/role/role.routes.js";
import clinicRoutes from "./modules/clinic/clinic.routes.js";
import prescriptionRoutes from "./modules/prescription/prescription.routes.js";
import selectionOptionRoutes from "./modules/selectionOption/selectionOption.routes.js";

const api = "/api/v1";
app.use(`${api}/auth`, authRoutes);
app.use(`${api}/users`, userRoutes);
app.use(`${api}/roles`, roleRoutes);
app.use(`${api}/patients`, patientRoutes);
app.use(`${api}/couples`, coupleRoutes);
app.use(`${api}/cycles`, cycleRoutes);
app.use(`${api}/cryo`, cryoRoutes);
app.use(`${api}/investigations`, investigationRoutes);
app.use(`${api}/appointments`, appointmentRoutes);
app.use(`${api}/invoices`, billingRoutes);
app.use(`${api}/reports`, reportRoutes);
app.use(`${api}/tasks`, taskRoutes);
app.use(`${api}/embryology`, embryologyRoutes);
app.use(`${api}/permissions`, permissionRoutes);
app.use(`${api}/prescriptions`, prescriptionRoutes);
app.use(`${api}/clinics`, clinicRoutes);
app.use(`${api}/selection-options`, selectionOptionRoutes);

// ── Health Check ──────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Life's Spring Women Center - Fertility HMS API",
    version: "1.0.0",
  });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}...`);
});

// ── Graceful Shutdown ─────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    const { disconnectDB } = await import("./config/db.js");
    await disconnectDB();
    process.exit(0);
  });
};

process.on("unhandledRejection", (error) => {
  logger.error("Unhandled Rejection:", error);
  server.close(async () => {
    const { disconnectDB } = await import("./config/db.js");
    await disconnectDB();
    process.exit(1);
  });
});

process.on("uncaughtException", async (error) => {
  logger.error("Uncaught Exception:", error);
  const { disconnectDB } = await import("./config/db.js");
  await disconnectDB();
  process.exit(1);
});

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
