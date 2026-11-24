import { Router } from "express";
import { VehicleController } from "../controllers/vehicle.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
  updateVehicleStatusSchema,
  adminApprovalSchema,
  maintenanceBlockSchema,
  vehicleQuerySchema,
} from "../validators/vehicle.validator.js";

const router = Router();

// Public routes
router.get("/", validateRequest(vehicleQuerySchema, "query"), VehicleController.getPublicVehicles);
router.get("/:id", VehicleController.getVehicleById);

// Agency routes
router.post(
  "/",
  authenticate,
  authorizeRoles("AGENCY_OWNER", "ADMIN"),
  validateRequest(createVehicleSchema),
  VehicleController.createVehicle
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("AGENCY_OWNER", "ADMIN"),
  validateRequest(updateVehicleSchema),
  VehicleController.updateVehicle
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("AGENCY_OWNER", "ADMIN"),
  VehicleController.deleteVehicle
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("AGENCY_OWNER", "ADMIN"),
  validateRequest(updateVehicleStatusSchema),
  VehicleController.updateStatus
);

router.post(
  "/:id/maintenance",
  authenticate,
  authorizeRoles("AGENCY_OWNER", "ADMIN"),
  validateRequest(maintenanceBlockSchema),
  VehicleController.addMaintenance
);

// Admin routes
router.patch(
  "/:id/approval",
  authenticate,
  authorizeRoles("ADMIN"),
  validateRequest(adminApprovalSchema),
  VehicleController.adminApproval
);

export default router;
