import { Router } from "express";
import authRoutes from "./auth.routes.js";
import vehicleRoutes from "./vehicle.routes.js";
import bookingRoutes from "./booking.routes.js";
import agencyRoutes from "./agency.routes.js";
import adminRoutes from "./admin.routes.js";
import uploadRoutes from "./upload.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/bookings", bookingRoutes);
router.use("/agencies", agencyRoutes);
router.use("/admin", adminRoutes);
router.use("/upload", uploadRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: "RentiGo API",
    version: "1.0.0",
  });
});

export default router;
