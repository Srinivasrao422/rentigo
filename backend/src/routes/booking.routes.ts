import { Router } from "express";
import { BookingController } from "../controllers/booking.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  createBookingSchema,
  updateBookingStatusSchema,
  checkAvailabilityQuerySchema,
  createReviewSchema,
} from "../validators/booking.validator.js";

const router = Router();

// Availability and pricing quote (Public / Customer)
router.get(
  "/availability",
  validateRequest(checkAvailabilityQuerySchema, "query"),
  BookingController.checkAvailability
);

router.get(
  "/quote",
  validateRequest(checkAvailabilityQuerySchema, "query"),
  BookingController.calculateQuote
);

// Customer bookings
router.post(
  "/",
  authenticate,
  authorizeRoles("CUSTOMER", "ADMIN"),
  validateRequest(createBookingSchema),
  BookingController.createBooking
);

router.get(
  "/customer",
  authenticate,
  authorizeRoles("CUSTOMER"),
  BookingController.getCustomerBookings
);

// Agency bookings
router.get(
  "/agency",
  authenticate,
  authorizeRoles("AGENCY_OWNER", "ADMIN"),
  BookingController.getAgencyBookings
);

// Admin all bookings
router.get(
  "/all",
  authenticate,
  authorizeRoles("ADMIN"),
  BookingController.getAllBookings
);

// Update status (Customer cancel, Agency approve/reject/start/finish, Admin override)
router.patch(
  "/:id/status",
  authenticate,
  validateRequest(updateBookingStatusSchema),
  BookingController.updateStatus
);

// Review
router.post(
  "/:id/review",
  authenticate,
  authorizeRoles("CUSTOMER"),
  validateRequest(createReviewSchema),
  BookingController.createReview
);

export default router;
