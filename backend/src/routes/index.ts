import { Router } from "express";
import authRoutes from "./auth.routes.js";
import vehicleRoutes from "./vehicle.routes.js";
import bookingRoutes from "./booking.routes.js";
import agencyRoutes from "./agency.routes.js";
import adminRoutes from "./admin.routes.js";
import uploadRoutes from "./upload.routes.js";
import { isPostgresConnected } from "../config/db.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/bookings", bookingRoutes);
router.use("/agencies", agencyRoutes);
router.use("/admin", adminRoutes);
router.use("/upload", uploadRoutes);

// Health and readiness check endpoint
router.get("/health", async (req, res) => {
  const probeStart = Date.now();
  const dbConnected = await isPostgresConnected();
  const latencyMs = Math.max(1, Date.now() - probeStart);
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !dbConnected) {
    return res.status(503).json({
      status: "Unavailable",
      service: "RentiGo API",
      database: "disconnected",
      latencyMs,
      uptimeSeconds: Math.floor(process.uptime()),
      message: "PostgreSQL database readiness check failed in production",
      timestamp: new Date().toISOString(),
    });
  }

  const status = !dbConnected ? "Degraded" : latencyMs > 1000 ? "Degraded" : "Healthy";

  res.json({
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    latencyMs,
    service: "RentiGo API",
    version: "1.0.0",
    database: dbConnected ? "connected" : "in-memory-dev",
  });
});

export default router;
