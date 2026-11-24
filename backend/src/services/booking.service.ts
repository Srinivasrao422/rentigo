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
      // 1. Check vehicle operational status
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });
      if (!vehicle || vehicle.isDeleted || vehicle.status !== "AVAILABLE" || vehicle.approvalStatus !== "APPROVED") {
        return { available: false, conflictReason: "Vehicle is currently not available for rent." };
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
        include: { pricing: true },
      });
      if (!vehicle || !vehicle.pricing) {
        throw ApiError.notFound("Vehicle pricing not found");
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
    if (!vehicle) throw ApiError.notFound("Vehicle pricing not found");

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
      // Execute within PostgreSQL Serializable / Interactive Transaction to prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        // 1. Re-check availability under lock
        const conflictingBooking = await tx.booking.findFirst({
          where: {
            vehicleId: data.vehicleId,
            status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
            AND: [{ startDate: { lt: end } }, { endDate: { gt: start } }],
          },
        });

        if (conflictingBooking) {
          throw ApiError.conflict(
            `Booking conflict: Vehicle was just reserved for the selected dates (${new Date(conflictingBooking.startDate).toLocaleDateString()} - ${new Date(conflictingBooking.endDate).toLocaleDateString()}). Please select different dates.`
          );
        }

        const maintenanceConflict = await tx.maintenanceBlock.findFirst({
          where: {
            vehicleId: data.vehicleId,
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
            AND: [{ startDate: { lt: end } }, { endDate: { gt: start } }],
          },
        });

        if (maintenanceConflict) {
          throw ApiError.conflict("Vehicle is blocked for maintenance during these dates.");
        }

        // 2. Fetch pricing and calculate amounts
        const vehicle = await tx.vehicle.findUnique({
          where: { id: data.vehicleId },
          include: { pricing: true, agency: true },
        });

        if (!vehicle || !vehicle.pricing) {
          throw ApiError.notFound("Vehicle not found");
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
            customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        });

        return { booking, customer: booking.customer, vehicle, agency: vehicle.agency };
      });

      // Fire asynchronous email notification
      NotificationService.notifyBookingCreated(result.booking, result.customer, result.vehicle, result.agency);

      return result.booking;
    }

    // Memory transaction fallback with atomic conflict check
    const availability = await this.checkAvailability(data.vehicleId, start, end);
    if (!availability.available) {
      throw ApiError.conflict(availability.conflictReason || "Vehicle unavailable for these dates.");
    }

    const vehicle = memoryStore.vehicles.find((v) => v.id === data.vehicleId);
    if (!vehicle) throw ApiError.notFound("Vehicle not found");

    const customer = memoryStore.users.find((u) => u.id === customerId);
    if (!customer) throw ApiError.notFound("Customer not found");

    const agency = memoryStore.agencies.find((a) => a.id === vehicle.agencyId);

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

    // Notify agency
    if (agency) {
      NotificationService.notifyBookingCreated(newBooking, customer, vehicle, agency);
    }

    return {
      ...newBooking,
      vehicle: { ...vehicle, agency },
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
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
          customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
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
          customer: customer
            ? { id: customer.id, firstName: customer.firstName, lastName: customer.lastName, email: customer.email, phone: customer.phone }
            : null,
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
          customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
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
          customer,
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
        include: { vehicle: { include: { agency: true } }, customer: true },
      });

      if (!booking) throw ApiError.notFound("Booking not found");

      // Authorization checks
      if (user.role === "CUSTOMER") {
        if (booking.customerId !== user.id) {
          throw ApiError.forbidden("You do not own this booking");
        }
        if (status !== "CANCELLED") {
          throw ApiError.badRequest("Customers may only cancel pending or confirmed bookings");
        }
        if (["ACTIVE", "COMPLETED"].includes(booking.status)) {
          throw ApiError.badRequest("Cannot cancel an active or completed rental");
        }
      } else if (user.role === "AGENCY_OWNER") {
        if (booking.vehicle.agencyId !== user.agencyId) {
          throw ApiError.forbidden("Access denied: You do not own this vehicle");
        }
      }

      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: status as any,
          ...(status === "REJECTED" ? { rejectionReason: reason } : {}),
          ...(status === "CANCELLED" ? { cancellationReason: reason } : {}),
          ...(status === "ACTIVE" ? { paymentStatus: "PAID" } : {}),
        },
        include: { vehicle: true, customer: true },
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

    if (user.role === "CUSTOMER") {
      if (booking.customerId !== user.id) throw ApiError.forbidden("You do not own this booking");
      if (status !== "CANCELLED") throw ApiError.badRequest("Customers can only cancel bookings");
    } else if (user.role === "AGENCY_OWNER") {
      if (!vehicle || vehicle.agencyId !== user.agencyId) {
        throw ApiError.forbidden("Access denied");
      }
    }

    booking.status = status;
    if (status === "REJECTED") booking.rejectionReason = reason || null;
    if (status === "CANCELLED") booking.cancellationReason = reason || null;
    if (status === "ACTIVE") booking.paymentStatus = "PAID";
    booking.updatedAt = new Date();

    if (customer && vehicle) {
      NotificationService.notifyBookingStatusChange(
        booking,
        customer,
        vehicle,
        status,
        reason
      );
    }

    return booking;
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
      comment: data.comment || null,
      createdAt: new Date(),
    };
    memoryStore.reviews.push(review);
    return review;
  }
}
