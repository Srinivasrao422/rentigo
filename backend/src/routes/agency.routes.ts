import { Router } from "express";
import { AgencyController } from "../controllers/agency.controller.js";
import { VehicleController } from "../controllers/vehicle.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate, authorizeRoles("AGENCY_OWNER", "ADMIN"));

router.get("/profile", AgencyController.getProfile);
router.get("/dashboard", AgencyController.getDashboard);
router.get("/vehicles", VehicleController.getAgencyVehicles);

export default router;
