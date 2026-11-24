import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate, authorizeRoles("ADMIN"));

router.get("/analytics", AdminController.getAnalytics);
router.get("/users", AdminController.getUsers);
router.patch("/users/:id/status", AdminController.toggleUserStatus);
router.get("/agencies", AdminController.getAgencies);
router.patch("/agencies/:id/approval", AdminController.approveAgency);
router.get("/vehicles", AdminController.getVehicles);

export default router;
