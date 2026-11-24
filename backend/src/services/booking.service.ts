import { prisma } from "../config/prisma.js";
import { memoryStore } from "../config/devStore.js";
import { isPostgresConnected } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import {
  calculateBestPrice,
  calculateTotalDays,
  doDateRangesOverlap,
  validateDateRange,
} from "../utils/date.js";
import { BookingStatus, AuthenticatedUser } from "../types/index.js";
import { NotificationService } from "./notification.service.js";

export const CUSTOMER_SAFE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  avatarUrl: true,
};

export function sanitizeCustomer(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || null,
    avatarUrl: user.avatarUrl || null,
  };
}

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED"],
  REJECTED: [],
  CANCELLED: [],
  COMPLETED: [],
};

export class BookingService {
  /**
   * Check if vehicle is available between two dates
   */
  static async checkAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<{ available: boolean; conflictReason?: string }> {
    const rangeCheck = validateDateRange(startDate, endDate);
    if (!rangeCheck.isValid) {
      return { available: false, conflictReason: rangeCheck.message };
    }

    if (await isPostgresConnected()) {
      // 1. Check vehicle operational status and agency eligibility
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: { agency: true },
      });
      if (!vehicle || vehicle.isDeleted || vehicle.status !== "AVAILABLE" || vehicle.approvalStatus !== "APPROVED") {
        return { available: false, conflictReason: "Vehicle is currently not available for rent." };
      }
      if (!vehicle.agency || !vehicle.agency.isApproved) {
        return { available: false, conflictReason: "Rental agency is currently not authorized." };
      }

      // 2. Check overlapping bookings (PENDING, APPROVED, ACTIVE)
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          vehicleId,
          ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
          status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
          AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
        },
      });

      if (conflictingBooking) {
        return {
          available: false,
          conflictReason: `Reserved from ${new Date(conflictingBooking.startDate).toLocaleDateString()} to ${new Date(conflictingBooking.endDate).toLocaleDateString()}`,
        };
      }

      // 3. Check maintenance blocks
      const maintenanceConflict = await prisma.maintenanceBlock.findFirst({
        where: {
          vehicleId,
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
        },
      });

      if (maintenanceConflict) {
        return {
          available: false,
          conflictReason: `Scheduled maintenance: ${maintenanceConflict.reason}`,
        };
      }

      return { available: true };
    }

    // Memory fallback
    const vehicle = memoryStore.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle || vehicle.isDeleted || vehicle.status !== "AVAILABLE" || vehicle.approvalStatus !== "APPROVED") {
      return { available: false, conflictReason: "Vehicle is currently not available for rent." };
    }
    const agency = memoryStore.agencies.find((a) => a.id === vehicle.agencyId);
    if (!agency || !agency.isApproved) {
      return { available: false, conflictReason: "Rental agency is currently not authorized." };
    }

    const conflictingBooking = memoryStore.bookings.find(
      (b) =>
        b.vehicleId === vehicleId &&
        b.id !== excludeBookingId &&
        ["PENDING", "APPROVED", "ACTIVE"].includes(b.status) &&
        doDateRangesOverlap(startDate, endDate, new Date(b.startDate), new Date(b.endDate))
    );

    if (conflictingBooking) {
      return {
        available: false,
        conflictReason: `Reserved from ${new Date(conflictingBooking.startDate).toLocaleDateString()} to ${new Date(conflictingBooking.endDate).toLocaleDateString()}`,
      };
    }

    const maintenanceConflict = memoryStore.maintenance.find(
      (m) =>
        m.vehicleId === vehicleId &&
        ["SCHEDULED", "IN_PROGRESS"].includes(m.status) &&
        doDateRangesOverlap(startDate, endDate, new Date(m.startDate), new Date(m.endDate))
    );

    if (maintenanceConflict) {
      return {
        available: false,
        conflictReason: `Scheduled maintenance: ${maintenanceConflict.reason}`,
      };
    }

    return { available: true };
  }

  /**
   * Price quote with smart tiered breakdown (daily/weekly/monthly savings)
   */
  static async calculateQuote(vehicleId: string, startDate: Date, endDate: Date) {
    const rangeCheck = validateDateRange(startDate, endDate);
    if (!rangeCheck.isValid) {
      throw ApiError.badRequest(rangeCheck.message || "Invalid date range");
    }

    if (await isPostgresConnected()) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
        include: { pricing: true, agency: true },
      });
      if (!vehicle || !vehicle.pricing || vehicle.isDeleted || vehicle.status !== "AVAILABLE" || vehicle.approvalStatus !== "APPROVED" || !vehicle.agency?.isApproved) {
        throw ApiError.notFound("Vehicle not eligible for quote or booking");
      }

      const breakdown = calculateBestPrice(startDate, endDate, {
        dailyRate: Number(vehicle.pricing.dailyRate),
        weeklyRate: Number(vehicle.pricing.weeklyRate),
        monthlyRate: Number(vehicle.pricing.monthlyRate),
        securityDeposit: Number(vehicle.pricing.securityDeposit),
      });

      const availability = await this.checkAvailability(vehicleId, startDate, endDate);
      return { ...breakdown, isAvailable: availability.available, conflictReason: availability.conflictReason };
    }

    // Memory fallback
    const vehicle = memoryStore.vehicles.find((v) => v.id === vehicleId);
    const agency = vehicle ? memoryStore.agencies.find((a) => a.id === vehicle.agencyId) : null;
    if (!vehicle || !vehicle.pricing || vehicle.isDeleted || vehicle.status !== "AVAILABLE" || vehicle.approvalStatus !== "APPROVED" || !agency?.isApproved) {
      throw ApiError.notFound("Vehicle not eligible for quote or booking");
    }

    const breakdown = calculateBestPrice(startDate, endDate, {
      dailyRate: vehicle.pricing.dailyRate,
      weeklyRate: vehicle.pricing.weeklyRate,
      monthlyRate: vehicle.pricing.monthlyRate,
      securityDeposit: vehicle.pricing.securityDeposit,
    });

    const availability = await this.checkAvailability(vehicleId, startDate, endDate);
    return { ...breakdown, isAvailable: availability.available, conflictReason: availability.conflictReason };
  }

  /**
   * Create booking using ACID transaction to prevent double booking race conditions
   */
  static async createBooking(
    customerId: string,
    data: {
      vehicleId: string;
      startDate: string;
      endDate: string;
      pickupLocation: string;
      dropoffLocation: string;
      notes?: string;
    }
  ) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    const rangeCheck = validateDateRange(start, end);
    if (!rangeCheck.isValid) {
      throw ApiError.badRequest(rangeCheck.message || "Invalid booking duration");
    }

    if (await isPostgresConnected()) {
      // Execute within PostgreSQL Serializable Transaction to prevent race conditions & double-booking
      const result = await prisma.$transaction(
        async (tx) => {
          // 1. Fetch vehicle and re-verify all eligibility under transaction boundary
          const vehicle = await tx.vehicle.findUnique({
            where: { id: data.vehicleId },
            include: { pricing: true, agency: true },
          });

          if (!vehicle || vehicle.isDeleted) {
            throw ApiError.notFound("Vehicle not found or listing has been archived");
          }

          if (vehicle.status !== "AVAILABLE") {
            throw ApiError.badRequest(`Vehicle is currently not available for rent (status: ${vehicle.status})`);
          }

          if (vehicle.approvalStatus !== "APPROVED") {
            throw ApiError.badRequest("Vehicle listing is pending administrator approval and cannot be reserved");
          }

          if (!vehicle.agency || !vehicle.agency.isApproved) {
            throw ApiError.badRequest("Rental agency is currently suspended or unauthorized to take bookings");
          }

          if (!vehicle.pricing) {
            throw ApiError.badRequest("Vehicle pricing schedule is not configured");
          }

          // 2. Re-check overlapping bookings (PENDING, APPROVED, ACTIVE) under serializable lock
          const conflictingBooking = await tx.booking.findFirst({
            where: {
              vehicleId: data.vehicleId,
              status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
              AND: [{ startDate: { lt: end } }, { endDate: { gt: start } }],
            },
          });

          if (conflictingBooking) {
            throw ApiError.conflict(
              `Booking conflict: Vehicle is already reserved for the selected dates (${new Date(conflictingBooking.startDate).toLocaleDateString()} - ${new Date(conflictingBooking.endDate).toLocaleDateString()}). Please select different dates.`
            );
          }

          // 3. Re-check maintenance blocks under transaction
          const maintenanceConflict = await tx.maintenanceBlock.findFirst({
            where: {
              vehicleId: data.vehicleId,
              status: { in: ["SCHEDULED", "IN_PROGRESS"] },
              AND: [{ startDate: { lt: end } }, { endDate: { gt: start } }],
            },
          });

          if (maintenanceConflict) {
            throw ApiError.conflict(`Vehicle is blocked for maintenance: ${maintenanceConflict.reason}`);
          }

          const quote = calculateBestPrice(start, end, {
            dailyRate: Number(vehicle.pricing.dailyRate),
            weeklyRate: Number(vehicle.pricing.weeklyRate),
            monthlyRate: Number(vehicle.pricing.monthlyRate),
            securityDeposit: Number(vehicle.pricing.securityDeposit),
          });

          const bookingNumber = `RGO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

          const booking = await tx.booking.create({
            data: {
              bookingNumber,
              customerId,
              vehicleId: data.vehicleId,
              startDate: start,
              endDate: end,
              totalDays: quote.totalDays,
              durationType: quote.durationType,
              basePrice: quote.basePrice,
              securityDeposit: quote.securityDeposit,
              taxAmount: quote.taxAmount,
              discountAmount: quote.discountAmount,
              totalAmount: quote.totalAmount,
              status: "PENDING",
              paymentStatus: "PENDING",
              pickupLocation: data.pickupLocation,
              dropoffLocation: data.dropoffLocation,
              notes: data.notes,
            },
            include: {
              vehicle: { include: { pricing: true, images: true, agency: true } },
              customer: { select: CUSTOMER_SAFE_SELECT },
            },
          });

          return { booking, customer: booking.customer, vehicle, agency: vehicle.agency };
        },
        { isolationLevel: "Serializable" as any }
      );

      // Fire asynchronous email notification
      NotificationService.notifyBookingCreated(result.booking, result.customer, result.vehicle, result.agency);

      return result.booking;
    }

    // Memory transaction fallback with atomic conflict check
    const vehicle = memoryStore.vehicles.find((v) => v.id === data.vehicleId);
    if (!vehicle || vehicle.isDeleted) throw ApiError.notFound("Vehicle not found");
    if (vehicle.status !== "AVAILABLE") throw ApiError.badRequest("Vehicle is currently not available");
    if (vehicle.approvalStatus !== "APPROVED") throw ApiError.badRequest("Vehicle listing is pending approval");

    const agency = memoryStore.agencies.find((a) => a.id === vehicle.agencyId);
    if (!agency || !agency.isApproved) throw ApiError.badRequest("Rental agency is currently unauthorized");

    const availability = await this.checkAvailability(data.vehicleId, start, end);
    if (!availability.available) {
      throw ApiError.conflict(availability.conflictReason || "Vehicle unavailable for these dates.");
    }

    const customer = memoryStore.users.find((u) => u.id === customerId);
    if (!customer) throw ApiError.notFound("Customer not found");

    const quote = calculateBestPrice(start, end, {
      dailyRate: vehicle.pricing.dailyRate,
      weeklyRate: vehicle.pricing.weeklyRate,
      monthlyRate: vehicle.pricing.monthlyRate,
      securityDeposit: vehicle.pricing.securityDeposit,
    });

    const bookingId = `bk-${Date.now()}`;
    const bookingNumber = `RGO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking = {
      id: bookingId,
      bookingNumber,
      customerId,
      vehicleId: data.vehicleId,
      startDate: start,
      endDate: end,
      totalDays: quote.totalDays,
      durationType: quote.durationType,
      basePrice: quote.basePrice,
      securityDeposit: quote.securityDeposit,
      taxAmount: quote.taxAmount,
      discountAmount: quote.discountAmount,
      totalAmount: quote.totalAmount,
      status: "PENDING" as const,
      paymentStatus: "PENDING" as const,
      rejectionReason: null,
      cancellationReason: null,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStore.bookings.unshift(newBooking);

    const safeCustomer = sanitizeCustomer(customer)!;

    // Notify agency
    if (agency) {
      NotificationService.notifyBookingCreated(newBooking, safeCustomer, vehicle, agency);
    }

    return {
      ...newBooking,
      vehicle: { ...vehicle, agency },
      customer: safeCustomer,
    };
  }

  static async getCustomerBookings(customerId: string) {
    if (await isPostgresConnected()) {
      return prisma.booking.findMany({
        where: { customerId },
        include: {
          vehicle: {
            include: {
              pricing: true,
              images: true,
              agency: true,
            },
          },
          review: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return memoryStore.bookings
      .filter((b) => b.customerId === customerId)
      .map((b) => {
        const vehicle = memoryStore.vehicles.find((v) => v.id === b.vehicleId);
        const agency = vehicle ? memoryStore.agencies.find((a) => a.id === vehicle.agencyId) : null;
        const review = memoryStore.reviews.find((r) => r.bookingId === b.id);
        return {
          ...b,
          vehicle: vehicle ? { ...vehicle, agency } : null,
          review: review || null,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getAgencyBookings(agencyId: string) {
    if (await isPostgresConnected()) {
      return prisma.booking.findMany({
        where: { vehicle: { agencyId } },
        include: {
          customer: { select: CUSTOMER_SAFE_SELECT },
          vehicle: { include: { pricing: true, images: true } },
          review: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return memoryStore.bookings
      .filter((b) => {
        const vehicle = memoryStore.vehicles.find((v) => v.id === b.vehicleId);
        return vehicle && vehicle.agencyId === agencyId;
      })
      .map((b) => {
        const customer = memoryStore.users.find((u) => u.id === b.customerId);
        const vehicle = memoryStore.vehicles.find((v) => v.id === b.vehicleId);
        const review = memoryStore.reviews.find((r) => r.bookingId === b.id);
        return {
          ...b,
          customer: sanitizeCustomer(customer),
          vehicle,
          review: review || null,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async getAllBookings() {
    if (await isPostgresConnected()) {
      return prisma.booking.findMany({
        include: {
          customer: { select: CUSTOMER_SAFE_SELECT },
          vehicle: { include: { pricing: true, images: true, agency: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return memoryStore.bookings
      .map((b) => {
        const customer = memoryStore.users.find((u) => u.id === b.customerId);
        const vehicle = memoryStore.vehicles.find((v) => v.id === b.vehicleId);
        const agency = vehicle ? memoryStore.agencies.find((a) => a.id === vehicle.agencyId) : null;
        return {
          ...b,
          customer: sanitizeCustomer(customer),
          vehicle: vehicle ? { ...vehicle, agency } : null,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static async updateBookingStatus(
    bookingId: string,
    user: AuthenticatedUser,
    status: BookingStatus,
    reason?: string
  ) {
    if (await isPostgresConnected()) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { vehicle: { include: { agency: true } }, customer: { select: CUSTOMER_SAFE_SELECT } },
      });

      if (!booking) throw ApiError.notFound("Booking not found");

      // Validate transition matrix
      const allowedNextStatuses = VALID_STATUS_TRANSITIONS[booking.status] || [];
      if (!allowedNextStatuses.includes(status)) {
        throw ApiError.badRequest(
          `Invalid status transition from ${booking.status} to ${status}. Allowed next states: ${allowedNextStatuses.join(", ") || "none"}`
        );
      }

      // Authorization checks
      if (user.role === "CUSTOMER") {
        if (booking.customerId !== user.id) {
          throw ApiError.forbidden("You do not own this booking");
        }
        if (status !== "CANCELLED") {
          throw ApiError.badRequest("Customers may only cancel pending or confirmed bookings");
        }
        if (!reason) {
          reason = "Customer cancelled reservation request";
        }
      } else if (user.role === "AGENCY_OWNER") {
        if (booking.vehicle.agencyId !== user.agencyId) {
          throw ApiError.forbidden("Access denied: You do not own this vehicle");
        }
        if (status === "REJECTED" && !reason) {
          throw ApiError.badRequest("A rejection reason is required when declining a booking request");
        }
      } else if (user.role === "ADMIN") {
        if ((status === "REJECTED" || status === "CANCELLED") && !reason) {
          reason = `Administrative action by ${user.email}`;
        }
      }

      // Explicitly separate rental status from payment status.
      // Payment status is NOT marked as PAID when status becomes ACTIVE.
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: status as any,
          ...(status === "REJECTED" ? { rejectionReason: reason } : {}),
          ...(status === "CANCELLED" ? { cancellationReason: reason } : {}),
        },
        include: { vehicle: true, customer: { select: CUSTOMER_SAFE_SELECT } },
      });

      NotificationService.notifyBookingStatusChange(
        updated,
        updated.customer,
        updated.vehicle,
        status,
        reason
      );

      return updated;
    }

    // Memory fallback
    const booking = memoryStore.bookings.find((b) => b.id === bookingId);
    if (!booking) throw ApiError.notFound("Booking not found");

    const vehicle = memoryStore.vehicles.find((v) => v.id === booking.vehicleId);
    const customer = memoryStore.users.find((u) => u.id === booking.customerId);

    // Validate transition matrix
    const allowedNextStatuses = VALID_STATUS_TRANSITIONS[booking.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      throw ApiError.badRequest(
        `Invalid status transition from ${booking.status} to ${status}. Allowed next states: ${allowedNextStatuses.join(", ") || "none"}`
      );
    }

    if (user.role === "CUSTOMER") {
      if (booking.customerId !== user.id) throw ApiError.forbidden("You do not own this booking");
      if (status !== "CANCELLED") throw ApiError.badRequest("Customers can only cancel bookings");
      if (!reason) reason = "Customer cancelled reservation";
    } else if (user.role === "AGENCY_OWNER") {
      if (!vehicle || vehicle.agencyId !== user.agencyId) {
        throw ApiError.forbidden("Access denied");
      }
      if (status === "REJECTED" && !reason) {
        throw ApiError.badRequest("A rejection reason is required when declining a booking request");
      }
    }

    booking.status = status;
    if (status === "REJECTED") booking.rejectionReason = reason || null;
    if (status === "CANCELLED") booking.cancellationReason = reason || null;
    // Payment status remains separated from rental status
    booking.updatedAt = new Date();

    const safeCustomer = sanitizeCustomer(customer);
    if (safeCustomer && vehicle) {
      NotificationService.notifyBookingStatusChange(
        booking,
        safeCustomer,
        vehicle,
        status,
        reason
      );
    }

    return {
      ...booking,
      customer: safeCustomer,
      vehicle,
    };
  }

  static async createReview(
    customerId: string,
    bookingId: string,
    data: { rating: number; comment?: string }
  ) {
    if (await isPostgresConnected()) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.customerId !== customerId) {
        throw ApiError.forbidden("You can only review your own bookings");
      }
      if (booking.status !== "COMPLETED") {
        throw ApiError.badRequest("You can only review completed rentals");
      }

      return prisma.review.create({
        data: {
          bookingId,
          vehicleId: booking.vehicleId,
          customerId,
          rating: data.rating,
          comment: data.comment,
        },
      });
    }

    const booking = memoryStore.bookings.find((b) => b.id === bookingId);
    if (!booking || booking.customerId !== customerId) {
      throw ApiError.forbidden("You can only review your own bookings");
    }
    if (booking.status !== "COMPLETED") {
      throw ApiError.badRequest("You can only review completed rentals");
    }

    const review = {
      id: `rev-${Date.now()}`,
      bookingId,
      vehicleId: booking.vehicleId,
      customerId,
      rating: data.rating,
      comment: data.comment || "",
      createdAt: new Date(),
    };
    memoryStore.reviews.push(review);
    return review;
  }
}
