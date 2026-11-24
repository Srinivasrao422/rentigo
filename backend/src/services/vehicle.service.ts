import { prisma } from "../config/prisma.js";
import { memoryStore } from "../config/devStore.js";
import { isPostgresConnected } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { VehicleFilterParams, VehicleStatus, ApprovalStatus } from "../types/index.js";
import { doDateRangesOverlap } from "../utils/date.js";

export class VehicleService {
  static async createVehicle(agencyId: string, data: any) {
    const usePg = await isPostgresConnected();
    if (usePg) {
      return prisma.vehicle.create({
        data: {
          agencyId,
          vehicleNumber: data.vehicleNumber,
          brand: data.brand,
          model: data.model,
          year: data.year,
          type: data.type,
          category: data.category,
          fuelType: data.fuelType,
          transmission: data.transmission,
          seatingCapacity: data.seatingCapacity,
          mileage: data.mileage,
          description: data.description,
          features: data.features || [],
          status: "AVAILABLE",
          approvalStatus: "APPROVED", // Auto-approved or PENDING
          pricing: {
            create: {
              dailyRate: data.pricing.dailyRate,
              weeklyRate: data.pricing.weeklyRate,
              monthlyRate: data.pricing.monthlyRate,
              securityDeposit: data.pricing.securityDeposit || 0,
              lateFeePerHour: data.pricing.lateFeePerHour || 0,
            },
          },
          ...(data.images?.length
            ? {
                images: {
                  create: data.images.map((img: any) => ({
                    url: img.url,
                    publicId: img.publicId,
                    isPrimary: img.isPrimary || false,
                    caption: img.caption,
                  })),
                },
              }
            : {}),
        },
        include: { pricing: true, images: true, agency: true },
      });
    }

    // Memory fallback
    const id = `veh-${Date.now()}`;
    const newVehicle = {
      id,
      agencyId,
      vehicleNumber: data.vehicleNumber,
      brand: data.brand,
      model: data.model,
      year: Number(data.year),
      type: data.type,
      category: data.category,
      fuelType: data.fuelType,
      transmission: data.transmission,
      seatingCapacity: Number(data.seatingCapacity || 4),
      mileage: data.mileage || null,
      description: data.description,
      features: data.features || [],
      status: "AVAILABLE" as const,
      approvalStatus: "APPROVED" as const,
      rejectionReason: null,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      pricing: {
        dailyRate: Number(data.pricing.dailyRate),
        weeklyRate: Number(data.pricing.weeklyRate),
        monthlyRate: Number(data.pricing.monthlyRate),
        securityDeposit: Number(data.pricing.securityDeposit || 0),
        lateFeePerHour: Number(data.pricing.lateFeePerHour || 0),
        currency: "USD",
      },
      images: data.images?.length
        ? data.images.map((img: any, idx: number) => ({
            id: `img-${Date.now()}-${idx}`,
            url: img.url,
            isPrimary: img.isPrimary ?? idx === 0,
            caption: img.caption || null,
          }))
        : [
            {
              id: `img-${Date.now()}-0`,
              url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
              isPrimary: true,
              caption: "Vehicle Exterior",
            },
          ],
    };

    memoryStore.vehicles.unshift(newVehicle);
    const agency = memoryStore.agencies.find((a) => a.id === agencyId);
    return { ...newVehicle, agency };
  }

  static async updateVehicle(vehicleId: string, agencyId: string, data: any) {
    if (await isPostgresConnected()) {
      const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!existing || existing.agencyId !== agencyId) {
        throw ApiError.forbidden("You do not have permission to edit this vehicle");
      }

      return prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          brand: data.brand,
          model: data.model,
          year: data.year,
          type: data.type,
          category: data.category,
          fuelType: data.fuelType,
          transmission: data.transmission,
          seatingCapacity: data.seatingCapacity,
          mileage: data.mileage,
          description: data.description,
          features: data.features,
          ...(data.pricing
            ? {
                pricing: {
                  update: {
                    dailyRate: data.pricing.dailyRate,
                    weeklyRate: data.pricing.weeklyRate,
                    monthlyRate: data.pricing.monthlyRate,
                    securityDeposit: data.pricing.securityDeposit,
                    lateFeePerHour: data.pricing.lateFeePerHour,
                  },
                },
              }
            : {}),
        },
        include: { pricing: true, images: true, agency: true },
      });
    }

    const veh = memoryStore.vehicles.find((v) => v.id === vehicleId);
    if (!veh || veh.agencyId !== agencyId) {
      throw ApiError.forbidden("You do not have permission to edit this vehicle");
    }

    Object.assign(veh, {
      ...data,
      updatedAt: new Date(),
    });
    if (data.pricing) {
      veh.pricing = { ...veh.pricing, ...data.pricing };
    }
    return veh;
  }

  static async deleteVehicle(vehicleId: string, agencyId: string) {
    if (await isPostgresConnected()) {
      const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!existing || existing.agencyId !== agencyId) {
        throw ApiError.forbidden("You do not have permission to delete this vehicle");
      }
      return prisma.vehicle.update({
        where: { id: vehicleId },
        data: { isDeleted: true },
      });
    }

    const veh = memoryStore.vehicles.find((v) => v.id === vehicleId);
    if (!veh || veh.agencyId !== agencyId) {
      throw ApiError.forbidden("You do not have permission to delete this vehicle");
    }
    veh.isDeleted = true;
    return veh;
  }

  static async updateVehicleStatus(
    vehicleId: string,
    agencyId: string,
    status: VehicleStatus
  ) {
    if (await isPostgresConnected()) {
      const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!existing || existing.agencyId !== agencyId) {
        throw ApiError.forbidden("You do not have permission to update this vehicle");
      }
      return prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: status as any },
      });
    }

    const veh = memoryStore.vehicles.find((v) => v.id === vehicleId);
    if (!veh || veh.agencyId !== agencyId) {
      throw ApiError.forbidden("You do not have permission to update this vehicle");
    }
    veh.status = status;
    return veh;
  }

  static async getAgencyVehicles(agencyId: string) {
    if (await isPostgresConnected()) {
      return prisma.vehicle.findMany({
        where: { agencyId, isDeleted: false },
        include: {
          pricing: true,
          images: true,
          bookings: {
            where: { status: { in: ["PENDING", "APPROVED", "ACTIVE"] } },
            take: 5,
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return memoryStore.vehicles
      .filter((v) => v.agencyId === agencyId && !v.isDeleted)
      .map((v) => ({
        ...v,
        bookings: memoryStore.bookings.filter(
          (b) => b.vehicleId === v.id && ["PENDING", "APPROVED", "ACTIVE"].includes(b.status)
        ),
      }));
  }

  static async getPublicVehicles(query: VehicleFilterParams) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    if (await isPostgresConnected()) {
      const where: any = {
        isDeleted: false,
        approvalStatus: "APPROVED",
        status: "AVAILABLE",
      };

      if (query.type) where.type = query.type;
      if (query.category) where.category = query.category;
      if (query.fuelType) where.fuelType = query.fuelType;
      if (query.transmission) where.transmission = query.transmission;
      if (query.agencyId) where.agencyId = query.agencyId;

      if (query.search) {
        where.OR = [
          { brand: { contains: query.search, mode: "insensitive" } },
          { model: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
        ];
      }

      if (query.city) {
        where.agency = { city: { contains: query.city, mode: "insensitive" } };
      }

      if (query.minPrice || query.maxPrice) {
        where.pricing = {
          dailyRate: {
            ...(query.minPrice ? { gte: Number(query.minPrice) } : {}),
            ...(query.maxPrice ? { lte: Number(query.maxPrice) } : {}),
          },
        };
      }

      // Check date range conflict if dates provided
      if (query.startDate && query.endDate) {
        const start = new Date(query.startDate);
        const end = new Date(query.endDate);
        where.bookings = {
          none: {
            status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
            AND: [{ startDate: { lt: end } }, { endDate: { gt: start } }],
          },
        };
        where.maintenanceBlocks = {
          none: {
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
            AND: [{ startDate: { lt: end } }, { endDate: { gt: start } }],
          },
        };
      }

      const total = await prisma.vehicle.count({ where });
      const vehicles = await prisma.vehicle.findMany({
        where,
        include: {
          pricing: true,
          images: true,
          agency: {
            select: { id: true, name: true, city: true, state: true, logoUrl: true },
          },
          reviews: {
            select: { rating: true },
          },
        },
        skip,
        take: limit,
        orderBy:
          query.sortBy === "dailyRate"
            ? { pricing: { dailyRate: query.sortOrder || "asc" } }
            : { createdAt: query.sortOrder || "desc" },
      });

      return {
        vehicles: vehicles.map((v) => {
          const avgRating =
            v.reviews.length > 0
              ? v.reviews.reduce((acc, r) => acc + r.rating, 0) / v.reviews.length
              : 4.8;
          return { ...v, averageRating: Math.round(avgRating * 10) / 10, totalReviews: v.reviews.length };
        }),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Memory fallback with complete filtering logic
    let filtered = memoryStore.vehicles.filter(
      (v) => !v.isDeleted && v.approvalStatus === "APPROVED" && v.status === "AVAILABLE"
    );

    if (query.type) {
      filtered = filtered.filter((v) => v.type === query.type);
    }
    if (query.category) {
      filtered = filtered.filter((v) => v.category === query.category);
    }
    if (query.fuelType) {
      filtered = filtered.filter((v) => v.fuelType === query.fuelType);
    }
    if (query.transmission) {
      filtered = filtered.filter((v) => v.transmission === query.transmission);
    }
    if (query.minPrice) {
      filtered = filtered.filter((v) => v.pricing.dailyRate >= Number(query.minPrice));
    }
    if (query.maxPrice) {
      filtered = filtered.filter((v) => v.pricing.dailyRate <= Number(query.maxPrice));
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.brand.toLowerCase().includes(s) ||
          v.model.toLowerCase().includes(s) ||
          v.description.toLowerCase().includes(s)
      );
    }
    if (query.city) {
      const city = query.city.toLowerCase();
      filtered = filtered.filter((v) => {
        const ag = memoryStore.agencies.find((a) => a.id === v.agencyId);
        return ag && ag.city.toLowerCase().includes(city);
      });
    }

    // Date range conflict filter
    if (query.startDate && query.endDate) {
      const reqStart = new Date(query.startDate);
      const reqEnd = new Date(query.endDate);

      filtered = filtered.filter((v) => {
        // Check conflicting active bookings
        const hasBookingConflict = memoryStore.bookings.some(
          (b) =>
            b.vehicleId === v.id &&
            ["PENDING", "APPROVED", "ACTIVE"].includes(b.status) &&
            doDateRangesOverlap(reqStart, reqEnd, new Date(b.startDate), new Date(b.endDate))
        );

        // Check conflicting maintenance
        const hasMaintConflict = memoryStore.maintenance.some(
          (m) =>
            m.vehicleId === v.id &&
            ["SCHEDULED", "IN_PROGRESS"].includes(m.status) &&
            doDateRangesOverlap(reqStart, reqEnd, new Date(m.startDate), new Date(m.endDate))
        );

        return !hasBookingConflict && !hasMaintConflict;
      });
    }

    // Sorting
    if (query.sortBy === "dailyRate") {
      filtered.sort((a, b) =>
        query.sortOrder === "desc"
          ? b.pricing.dailyRate - a.pricing.dailyRate
          : a.pricing.dailyRate - b.pricing.dailyRate
      );
    } else {
      filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit).map((v) => {
      const agency = memoryStore.agencies.find((a) => a.id === v.agencyId);
      const vehicleReviews = memoryStore.reviews.filter((r) => r.vehicleId === v.id);
      const avgRating =
        vehicleReviews.length > 0
          ? vehicleReviews.reduce((sum, r) => sum + r.rating, 0) / vehicleReviews.length
          : 4.9;

      return {
        ...v,
        agency: agency
          ? { id: agency.id, name: agency.name, city: agency.city, state: agency.state, logoUrl: agency.logoUrl }
          : null,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: vehicleReviews.length,
      };
    });

    return {
      vehicles: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getVehicleById(id: string) {
    if (await isPostgresConnected()) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
          pricing: true,
          images: true,
          agency: true,
          reviews: {
            include: {
              customer: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          maintenanceBlocks: {
            where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
          },
        },
      });

      if (!vehicle || vehicle.isDeleted) {
        throw ApiError.notFound("Vehicle not found");
      }

      const avgRating =
        vehicle.reviews.length > 0
          ? vehicle.reviews.reduce((acc, r) => acc + r.rating, 0) / vehicle.reviews.length
          : 4.9;

      return { ...vehicle, averageRating: Math.round(avgRating * 10) / 10 };
    }

    const veh = memoryStore.vehicles.find((v) => v.id === id && !v.isDeleted);
    if (!veh) {
      throw ApiError.notFound("Vehicle not found");
    }

    const agency = memoryStore.agencies.find((a) => a.id === veh.agencyId);
    const reviews = memoryStore.reviews
      .filter((r) => r.vehicleId === id)
      .map((r) => {
        const customer = memoryStore.users.find((u) => u.id === r.customerId);
        return {
          ...r,
          customer: customer
            ? { firstName: customer.firstName, lastName: customer.lastName, avatarUrl: customer.avatarUrl }
            : null,
        };
      });

    const maintenance = memoryStore.maintenance.filter(
      (m) => m.vehicleId === id && ["SCHEDULED", "IN_PROGRESS"].includes(m.status)
    );

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 4.9;

    return {
      ...veh,
      agency,
      reviews,
      maintenanceBlocks: maintenance,
      averageRating: Math.round(avgRating * 10) / 10,
    };
  }

  static async adminApproveVehicle(
    vehicleId: string,
    status: ApprovalStatus,
    rejectionReason?: string
  ) {
    if (await isPostgresConnected()) {
      return prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          approvalStatus: status as any,
          rejectionReason: status === "REJECTED" ? rejectionReason : null,
        },
      });
    }

    const veh = memoryStore.vehicles.find((v) => v.id === vehicleId);
    if (!veh) throw ApiError.notFound("Vehicle not found");
    veh.approvalStatus = status;
    veh.rejectionReason = status === "REJECTED" ? rejectionReason || null : null;
    return veh;
  }

  static async addMaintenanceBlock(agencyId: string, vehicleId: string, data: any) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (await isPostgresConnected()) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (!vehicle || vehicle.agencyId !== agencyId) {
        throw ApiError.forbidden("Access denied");
      }

      // Check if active bookings conflict with maintenance
      const conflict = await prisma.booking.findFirst({
        where: {
          vehicleId,
          status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
          AND: [{ startDate: { lt: end } }, { endDate: { gt: start } }],
        },
      });

      if (conflict) {
        throw ApiError.conflict(
          `Cannot block dates: Existing booking #${conflict.bookingNumber} is active during this period.`
        );
      }

      return prisma.maintenanceBlock.create({
        data: {
          vehicleId,
          startDate: start,
          endDate: end,
          reason: data.reason,
          notes: data.notes,
        },
      });
    }

    const veh = memoryStore.vehicles.find((v) => v.id === vehicleId);
    if (!veh || veh.agencyId !== agencyId) throw ApiError.forbidden("Access denied");

    const conflict = memoryStore.bookings.find(
      (b) =>
        b.vehicleId === vehicleId &&
        ["PENDING", "APPROVED", "ACTIVE"].includes(b.status) &&
        doDateRangesOverlap(start, end, new Date(b.startDate), new Date(b.endDate))
    );

    if (conflict) {
      throw ApiError.conflict(
        `Cannot block dates: Existing booking #${conflict.bookingNumber} is active during this period.`
      );
    }

    const block = {
      id: `maint-${Date.now()}`,
      vehicleId,
      startDate: start,
      endDate: end,
      reason: data.reason,
      status: "SCHEDULED" as const,
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.maintenance.push(block);
    return block;
  }
}
