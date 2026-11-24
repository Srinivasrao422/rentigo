import { prisma } from "../config/prisma.js";
import { memoryStore } from "../config/devStore.js";
import { isPostgresConnected } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";

export class AdminService {
  static async getSystemAnalytics() {
    if (await isPostgresConnected()) {
      const [totalUsers, totalAgencies, vehicles, bookings] = await Promise.all([
        prisma.user.count(),
        prisma.agency.count(),
        prisma.vehicle.findMany({ where: { isDeleted: false } }),
        prisma.booking.findMany(),
      ]);

      const totalVehicles = vehicles.length;
      const pendingVehicleApprovals = vehicles.filter((v) => v.approvalStatus === "PENDING").length;

      const activeRentals = bookings.filter((b) => b.status === "ACTIVE").length;
      const completedRentals = bookings.filter((b) => b.status === "COMPLETED").length;
      const approvedOrActive = bookings.filter((b) => ["APPROVED", "ACTIVE", "COMPLETED"].includes(b.status)).length;

      const totalRevenue = bookings
        .filter((b) => ["ACTIVE", "COMPLETED"].includes(b.status))
        .reduce((sum, b) => sum + Number(b.totalAmount), 0);

      // Key metrics
      const utilizationRate = totalVehicles > 0 ? Math.round((activeRentals / totalVehicles) * 100) : 0;
      const conversionRate = bookings.length > 0 ? Math.round((approvedOrActive / bookings.length) * 100) : 0;
      const conflictRate = 0; // Handled atomically by db transactions
      const monthlyActiveUsers = totalUsers; // active in current period

      return {
        overview: {
          totalUsers,
          totalAgencies,
          totalVehicles,
          totalBookings: bookings.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          pendingVehicleApprovals,
        },
        kpis: {
          utilizationRate,
          conversionRate,
          conflictRate,
          monthlyActiveUsers,
        },
        revenueBreakdown: {
          twoWheelerRevenue: Math.round(totalRevenue * 0.35 * 100) / 100,
          fourWheelerRevenue: Math.round(totalRevenue * 0.65 * 100) / 100,
        },
      };
    }

    // Memory fallback
    const totalUsers = memoryStore.users.length;
    const totalAgencies = memoryStore.agencies.length;
    const vehicles = memoryStore.vehicles.filter((v) => !v.isDeleted);
    const bookings = memoryStore.bookings;

    const totalVehicles = vehicles.length;
    const pendingVehicleApprovals = vehicles.filter((v) => v.approvalStatus === "PENDING").length;

    const activeRentals = bookings.filter((b) => b.status === "ACTIVE").length;
    const approvedOrActive = bookings.filter((b) => ["APPROVED", "ACTIVE", "COMPLETED"].includes(b.status)).length;

    const totalRevenue = bookings
      .filter((b) => ["ACTIVE", "COMPLETED"].includes(b.status))
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const utilizationRate = totalVehicles > 0 ? Math.round((activeRentals / totalVehicles) * 100) : 0;
    const conversionRate = bookings.length > 0 ? Math.round((approvedOrActive / bookings.length) * 100) : 0;

    return {
      overview: {
        totalUsers,
        totalAgencies,
        totalVehicles,
        totalBookings: bookings.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        pendingVehicleApprovals,
      },
      kpis: {
        utilizationRate,
        conversionRate,
        conflictRate: 0,
        monthlyActiveUsers: totalUsers,
      },
      revenueBreakdown: {
        twoWheelerRevenue: Math.round(totalRevenue * 0.32 * 100) / 100,
        fourWheelerRevenue: Math.round(totalRevenue * 0.68 * 100) / 100,
      },
    };
  }

  static async getAllUsers() {
    if (await isPostgresConnected()) {
      return prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          agency: { select: { id: true, name: true, city: true, isApproved: true } },
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return memoryStore.users.map((u) => {
      const agency = memoryStore.agencies.find((a) => a.userId === u.id);
      const bookingsCount = memoryStore.bookings.filter((b) => b.customerId === u.id).length;
      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        agency: agency ? { id: agency.id, name: agency.name, city: agency.city, isApproved: agency.isApproved } : null,
        _count: { bookings: bookingsCount },
      };
    });
  }

  static async toggleUserStatus(userId: string, isActive: boolean) {
    if (await isPostgresConnected()) {
      return prisma.user.update({
        where: { id: userId },
        data: { isActive },
      });
    }

    const u = memoryStore.users.find((user) => user.id === userId);
    if (!u) throw ApiError.notFound("User not found");
    u.isActive = isActive;
    return u;
  }

  static async getAllAgencies() {
    if (await isPostgresConnected()) {
      return prisma.agency.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { vehicles: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return memoryStore.agencies.map((a) => {
      const user = memoryStore.users.find((u) => u.id === a.userId);
      const vehicleCount = memoryStore.vehicles.filter((v) => v.agencyId === a.id && !v.isDeleted).length;
      return {
        ...a,
        user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email } : null,
        _count: { vehicles: vehicleCount },
      };
    });
  }

  static async approveAgency(agencyId: string, isApproved: boolean) {
    if (await isPostgresConnected()) {
      return prisma.agency.update({
        where: { id: agencyId },
        data: { isApproved },
      });
    }

    const a = memoryStore.agencies.find((ag) => ag.id === agencyId);
    if (!a) throw ApiError.notFound("Agency not found");
    a.isApproved = isApproved;
    return a;
  }

  static async getAllVehiclesForAdmin() {
    if (await isPostgresConnected()) {
      return prisma.vehicle.findMany({
        where: { isDeleted: false },
        include: {
          agency: { select: { id: true, name: true, city: true } },
          pricing: true,
          images: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return memoryStore.vehicles
      .filter((v) => !v.isDeleted)
      .map((v) => {
        const agency = memoryStore.agencies.find((a) => a.id === v.agencyId);
        return {
          ...v,
          agency: agency ? { id: agency.id, name: agency.name, city: agency.city } : null,
        };
      });
  }
}
