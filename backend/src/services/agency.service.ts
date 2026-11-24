import { prisma } from "../config/prisma.js";
import { memoryStore } from "../config/devStore.js";
import { isPostgresConnected } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

export class AgencyService {
  static async getAgencyByUserId(userId: string) {
    if (await isPostgresConnected()) {
      const agency = await prisma.agency.findUnique({
        where: { userId },
        include: { vehicles: { where: { isDeleted: false } } },
      });
      if (!agency) throw ApiError.notFound("Agency profile not found");
      return agency;
    }

    const agency = memoryStore.agencies.find((a) => a.userId === userId);
    if (!agency) throw ApiError.notFound("Agency profile not found");
    const vehicles = memoryStore.vehicles.filter((v) => v.agencyId === agency.id && !v.isDeleted);
    return { ...agency, vehicles };
  }

  static async getAgencyDashboardStats(agencyId: string) {
    if (await isPostgresConnected()) {
      const vehicles = await prisma.vehicle.findMany({
        where: { agencyId, isDeleted: false },
      });

      const bookings = await prisma.booking.findMany({
        where: { vehicle: { agencyId } },
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          vehicle: { select: { brand: true, model: true, vehicleNumber: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const totalVehicles = vehicles.length;
      const activeRentals = bookings.filter((b) => b.status === "ACTIVE").length;
      const pendingRequests = bookings.filter((b) => b.status === "PENDING").length;
      const completedRentals = bookings.filter((b) => b.status === "COMPLETED").length;

      const totalRevenue = bookings
        .filter((b) => ["ACTIVE", "COMPLETED"].includes(b.status))
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);

      const utilizationRate =
        totalVehicles > 0 ? Math.round((activeRentals / totalVehicles) * 100) : 0;

      return {
        totalVehicles,
        activeRentals,
        pendingRequests,
        completedRentals,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        utilizationRate,
        recentBookings: bookings.slice(0, 10),
      };
    }

    // Memory fallback
    const vehicles = memoryStore.vehicles.filter((v) => v.agencyId === agencyId && !v.isDeleted);
    const vehicleIds = new Set(vehicles.map((v) => v.id));

    const agencyBookings = memoryStore.bookings.filter((b) => vehicleIds.has(b.vehicleId));

    const totalVehicles = vehicles.length;
    const activeRentals = agencyBookings.filter((b) => b.status === "ACTIVE").length;
    const pendingRequests = agencyBookings.filter((b) => b.status === "PENDING").length;
    const completedRentals = agencyBookings.filter((b) => b.status === "COMPLETED").length;

    const totalRevenue = agencyBookings
      .filter((b) => ["ACTIVE", "COMPLETED"].includes(b.status))
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const utilizationRate =
      totalVehicles > 0 ? Math.round((activeRentals / totalVehicles) * 100) : 0;

    const recentBookings = agencyBookings.slice(0, 10).map((b) => {
      const customer = memoryStore.users.find((u) => u.id === b.customerId);
      const vehicle = memoryStore.vehicles.find((v) => v.id === b.vehicleId);
      return {
        ...b,
        customer: customer ? { firstName: customer.firstName, lastName: customer.lastName, email: customer.email } : null,
        vehicle: vehicle ? { brand: vehicle.brand, model: vehicle.model, vehicleNumber: vehicle.vehicleNumber } : null,
      };
    });

    return {
      totalVehicles,
      activeRentals,
      pendingRequests,
      completedRentals,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      utilizationRate,
      recentBookings,
    };
  }
}
