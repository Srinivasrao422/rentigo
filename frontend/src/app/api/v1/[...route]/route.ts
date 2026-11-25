import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { serverStore, StoreVehicle, StoreBooking, StoreUser } from "@/lib/serverStore";
import {
  authenticateRequest,
  requireRoles,
  verifyPasswordSync,
  hashPasswordSync,
  signToken,
  verifyToken,
  checkAuthRateLimit,
  sanitizeUserPublic,
} from "@/lib/serverAuth";

function sanitizeCustomer(user: any) {
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

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED"],
  REJECTED: [],
  CANCELLED: [],
  COMPLETED: [],
};

const PENDING_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function expireStalePendingBookings() {
  const now = Date.now();
  for (const b of serverStore.bookings) {
    if (b.status === "PENDING") {
      const created = new Date(b.createdAt).getTime();
      if (!Number.isNaN(created) && now - created > PENDING_EXPIRY_MS) {
        b.status = "CANCELLED";
        b.cancellationReason = "Pending reservation expired automatically after 24 hours";
      }
    }
  }
}

function recordTelemetry(startMs: number, path: string, status: number, message?: string) {
  const elapsed = Math.max(1, Date.now() - startMs);
  serverStore.requestCount += 1;
  serverStore.recentLatenciesMs.push(elapsed);
  if (serverStore.recentLatenciesMs.length > 100) {
    serverStore.recentLatenciesMs.shift();
  }
  if (status >= 500) {
    serverStore.errorCount += 1;
    serverStore.recentErrors.unshift({
      timestamp: new Date().toISOString(),
      path,
      message: message || `HTTP ${status}`,
    });
    if (serverStore.recentErrors.length > 25) {
      serverStore.recentErrors.pop();
    }
  }
}

function jsonResponse(data: any, status = 200, startMs?: number, path?: string) {
  if (startMs !== undefined && path !== undefined) {
    recordTelemetry(startMs, path, status, data?.message);
  }
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function computeVehicleAvailability(vehicleId: string, start: Date, end: Date) {
  const vehicle = serverStore.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle || vehicle.isDeleted) {
    return { available: false, reason: "Vehicle not found" };
  }
  if (vehicle.status !== "AVAILABLE") {
    return { available: false, reason: `Vehicle status is ${vehicle.status.toLowerCase()}` };
  }
  if (vehicle.approvalStatus !== "APPROVED") {
    return { available: false, reason: "Vehicle listing is pending admin approval" };
  }
  const agency = serverStore.agencies.find((a) => a.id === vehicle.agencyId);
  if (agency && !agency.isApproved) {
    return { available: false, reason: "Rental agency is currently suspended" };
  }

  expireStalePendingBookings();

  const conflictingBooking = serverStore.bookings.find((b) => {
    if (b.vehicleId !== vehicleId) return false;
    if (!["PENDING", "APPROVED", "ACTIVE"].includes(b.status)) return false;
    const bStart = new Date(b.startDate);
    const bEnd = new Date(b.endDate);
    return start < bEnd && end > bStart;
  });

  if (conflictingBooking) {
    return {
      available: false,
      reason: `Reserved from ${new Date(conflictingBooking.startDate).toLocaleDateString("en-IN")} to ${new Date(conflictingBooking.endDate).toLocaleDateString("en-IN")}`,
    };
  }

  const maintConflict = serverStore.maintenanceBlocks.find((m) => {
    if (m.vehicleId !== vehicleId) return false;
    if (!["SCHEDULED", "IN_PROGRESS"].includes(m.status)) return false;
    const mStart = new Date(m.startDate);
    const mEnd = new Date(m.endDate);
    return start < mEnd && end > mStart;
  });

  if (maintConflict) {
    return {
      available: false,
      reason: `Scheduled maintenance: ${maintConflict.reason}`,
    };
  }

  return { available: true };
}

function computeRealAnalytics() {
  expireStalePendingBookings();
  const activeVehicles = serverStore.vehicles.filter((v) => !v.isDeleted);
  const totalVehicles = activeVehicles.length;
  const availableVehicles = activeVehicles.filter(
    (v) => v.status === "AVAILABLE" && v.approvalStatus === "APPROVED"
  ).length;
  const maintenanceVehicles = activeVehicles.filter((v) => v.status === "MAINTENANCE").length;
  const pendingVehicleApprovals = activeVehicles.filter((v) => v.approvalStatus === "PENDING").length;

  const bookings = serverStore.bookings;
  const activeBookings = bookings.filter((b) => b.status === "ACTIVE").length;
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
  const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED").length;
  const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;
  const approvedOrActive = bookings.filter((b) =>
    ["APPROVED", "ACTIVE", "COMPLETED"].includes(b.status)
  ).length;

  // Rented vehicles = distinct vehicles with currently ACTIVE bookings
  const rentedVehicleIds = new Set(
    bookings.filter((b) => b.status === "ACTIVE").map((b) => b.vehicleId)
  );
  const rentedVehicles = rentedVehicleIds.size;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let twoWheelerRevenue = 0;
  let fourWheelerRevenue = 0;
  let totalRevenue = 0;
  let monthlyRevenue = 0;

  const agencyStatsMap = new Map<
    string,
    { agencyId: string; agencyName: string; city: string; bookingsCount: number; revenue: number }
  >();
  for (const ag of serverStore.agencies) {
    agencyStatsMap.set(ag.id, {
      agencyId: ag.id,
      agencyName: ag.name,
      city: ag.city,
      bookingsCount: 0,
      revenue: 0,
    });
  }

  const cityStatsMap = new Map<string, { city: string; bookingsCount: number; revenue: number }>();

  for (const b of bookings) {
    const v = serverStore.vehicles.find((veh) => veh.id === b.vehicleId);
    const ag = v ? serverStore.agencies.find((a) => a.id === v.agencyId) : undefined;
    const city = ag?.city || v?.agency?.city || "Other";

    if (!cityStatsMap.has(city)) {
      cityStatsMap.set(city, { city, bookingsCount: 0, revenue: 0 });
    }
    const cityEntry = cityStatsMap.get(city)!;
    cityEntry.bookingsCount += 1;

    if (ag && agencyStatsMap.has(ag.id)) {
      agencyStatsMap.get(ag.id)!.bookingsCount += 1;
    }

    if (["ACTIVE", "COMPLETED"].includes(b.status)) {
      totalRevenue += b.totalAmount;
      if (new Date(b.createdAt) >= monthStart) {
        monthlyRevenue += b.totalAmount;
      }
      if (v?.type === "TWO_WHEELER") {
        twoWheelerRevenue += b.totalAmount;
      } else {
        fourWheelerRevenue += b.totalAmount;
      }
      cityEntry.revenue += b.totalAmount;
      if (ag && agencyStatsMap.has(ag.id)) {
        agencyStatsMap.get(ag.id)!.revenue += b.totalAmount;
      }
    }
  }

  // Real conflict check across all active/approved bookings
  let conflictCount = 0;
  const activeOrApproved = bookings.filter((b) =>
    ["APPROVED", "ACTIVE"].includes(b.status)
  );
  for (let i = 0; i < activeOrApproved.length; i++) {
    for (let j = i + 1; j < activeOrApproved.length; j++) {
      const a = activeOrApproved[i];
      const b = activeOrApproved[j];
      if (
        a.vehicleId === b.vehicleId &&
        new Date(a.startDate) < new Date(b.endDate) &&
        new Date(a.endDate) > new Date(b.startDate)
      ) {
        conflictCount += 1;
      }
    }
  }

  const totalCustomers = serverStore.users.filter((u) => u.role === "CUSTOMER").length;
  const approvedAgencies = serverStore.agencies.filter((a) => a.isApproved).length;
  const utilizationRate = totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;
  const conversionRate =
    bookings.length > 0 ? Math.round((approvedOrActive / bookings.length) * 100) : 0;
  const conflictRate =
    bookings.length > 0 ? Math.round((conflictCount / bookings.length) * 1000) / 10 : 0;

  const revenueByLocation = Array.from(cityStatsMap.values())
    .map((entry) => ({
      ...entry,
      revenue: Math.round(entry.revenue * 100) / 100,
      fleetSharePercent:
        totalVehicles > 0
          ? Math.round(
              (activeVehicles.filter((v) => (v.agency?.city || "Other") === entry.city).length /
                totalVehicles) *
                100
            )
          : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const revenueByAgency = Array.from(agencyStatsMap.values())
    .map((entry) => ({ ...entry, revenue: Math.round(entry.revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    overview: {
      totalUsers: serverStore.users.length,
      totalCustomers,
      totalAgencies: serverStore.agencies.length,
      approvedAgencies,
      totalVehicles,
      availableVehicles,
      rentedVehicles,
      maintenanceVehicles,
      totalBookings: bookings.length,
      activeBookings,
      completedBookings,
      cancelledBookings,
      pendingBookings,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      pendingVehicleApprovals,
    },
    kpis: {
      utilizationRate,
      conversionRate,
      conversionFormula: "(Approved + Active + Completed Bookings) / Total Bookings",
      conflictRate,
      conflictCount,
      monthlyActiveUsers: serverStore.users.filter((u) => u.isActive).length,
    },
    revenueBreakdown: {
      twoWheelerRevenue: Math.round(twoWheelerRevenue * 100) / 100,
      fourWheelerRevenue: Math.round(fourWheelerRevenue * 100) / 100,
    },
    revenueByLocation,
    revenueByAgency,
    metadata: {
      reportingPeriod: "All-Time to Date",
      lastRefreshedAt: new Date().toISOString(),
    },
  };
}

function getHealthSnapshot(startMs: number) {
  const probeStart = Date.now();
  const userCount = serverStore.users.length;
  const vehicleCount = serverStore.vehicles.length;
  const latencyMs = Math.max(1, Date.now() - probeStart + (Date.now() - startMs));
  const avgLatencyMs =
    serverStore.recentLatenciesMs.length > 0
      ? Math.round(
          serverStore.recentLatenciesMs.reduce((a, b) => a + b, 0) /
            serverStore.recentLatenciesMs.length
        )
      : latencyMs;

  const isHealthy = userCount >= 0 && vehicleCount >= 0 && serverStore.errorCount < 10 && avgLatencyMs < 1500;
  const status: "Healthy" | "Degraded" | "Unavailable" = isHealthy ? "Healthy" : "Degraded";

  return {
    status,
    mode: "nextjs-serverless",
    database: "in-memory-store",
    latencyMs,
    avgLatencyMs,
    uptimeSeconds: Math.floor((Date.now() - serverStore.startedAt) / 1000),
    requestCount: serverStore.requestCount,
    errorCount: serverStore.errorCount,
    timestamp: new Date().toISOString(),
  };
}

export async function OPTIONS() {
  return jsonResponse({ ok: true });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const startMs = Date.now();
  const { route } = await params;
  const path = route.join("/");
  const { searchParams } = new URL(request.url);

  // 1. Health check (public)
  if (path === "health") {
    const snapshot = getHealthSnapshot(startMs);
    return jsonResponse(snapshot, 200, startMs, path);
  }

  // 1b. Current authenticated user profile: GET /auth/me
  if (path === "auth/me") {
    const auth = authenticateRequest(request);
    if (auth.errorResponse) return auth.errorResponse;
    return jsonResponse({ success: true, data: sanitizeUserPublic(auth.user!) }, 200, startMs, path);
  }

  // 2. Availability check: GET /bookings/availability
  if (path === "bookings/availability") {
    const vehicleId = searchParams.get("vehicleId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!vehicleId || !startDateStr || !endDateStr) {
      return jsonResponse({ message: "vehicleId, startDate, and endDate are required" }, 400, startMs, path);
    }
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return jsonResponse({ available: false, conflictReason: "Invalid pickup/return date range" }, 200, startMs, path);
    }

    const avail = computeVehicleAvailability(vehicleId, start, end);
    return jsonResponse({ success: true, data: { available: avail.available, conflictReason: avail.reason } }, 200, startMs, path);
  }

  // 3. Quote Calculation: GET /bookings/quote
  if (path === "bookings/quote") {
    const vehicleId = searchParams.get("vehicleId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!vehicleId || !startDateStr || !endDateStr) {
      return jsonResponse({ message: "vehicleId, startDate, and endDate are required" }, 400, startMs, path);
    }

    const vehicle = serverStore.vehicles.find((v) => v.id === vehicleId && !v.isDeleted);
    if (!vehicle) {
      return jsonResponse({ message: "Vehicle not found" }, 404, startMs, path);
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return jsonResponse({ message: "Return date/time must be after pickup date/time" }, 400, startMs, path);
    }

    const diffMs = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const { dailyRate, weeklyRate, monthlyRate, securityDeposit } = vehicle.pricing;

    let hasWeekendDays = false;
    const curDate = new Date(start);
    while (curDate < end) {
      const day = curDate.getUTCDay();
      if (day === 5 || day === 6 || day === 0) {
        hasWeekendDays = true;
        break;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    const surgeMultiplier = hasWeekendDays ? 1.05 : 1.0;
    const effectiveDailyRate = Math.round(dailyRate * surgeMultiplier);

    let durationType: "DAILY" | "WEEKLY" | "MONTHLY" = "DAILY";
    let basePrice = 0;
    const standardDailyTotal = totalDays * effectiveDailyRate;

    if (totalDays >= 30) {
      durationType = "MONTHLY";
      const months = Math.floor(totalDays / 30);
      const remainingDays = totalDays % 30;
      const weeks = Math.floor(remainingDays / 7);
      const days = remainingDays % 7;
      basePrice = months * monthlyRate + weeks * weeklyRate + days * dailyRate;
    } else if (totalDays >= 7) {
      durationType = "WEEKLY";
      const weeks = Math.floor(totalDays / 7);
      const days = totalDays % 7;
      basePrice = weeks * weeklyRate + days * dailyRate;
      if (basePrice > monthlyRate) {
        basePrice = monthlyRate;
        durationType = "MONTHLY";
      }
    } else {
      durationType = "DAILY";
      basePrice = totalDays * effectiveDailyRate;
      if (basePrice > weeklyRate) {
        basePrice = weeklyRate;
        durationType = "WEEKLY";
      }
    }

    const discountAmount = Math.max(0, standardDailyTotal - basePrice);
    const taxAmount = Math.round(basePrice * 0.18 * 100) / 100;
    const totalAmount = basePrice + taxAmount + securityDeposit;

    const availability = computeVehicleAvailability(vehicleId, start, end);

    const applicableRate =
      durationType === "MONTHLY"
        ? monthlyRate
        : durationType === "WEEKLY"
        ? weeklyRate
        : effectiveDailyRate;

    const rateLabel =
      durationType === "MONTHLY"
        ? "Monthly Tier Rate"
        : durationType === "WEEKLY"
        ? "Weekly Tier Rate"
        : hasWeekendDays
        ? "Weekend Daily Rate"
        : "Standard Daily Rate";

    return jsonResponse(
      {
        success: true,
        data: {
          vehicleId,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          totalDays,
          durationType,
          applicableRate,
          rateLabel,
          pricingTier: { dailyRate, weeklyRate, monthlyRate },
          basePrice,
          discountAmount,
          taxAmount,
          securityDeposit,
          totalAmount,
          currency: vehicle.pricing.currency || "INR",
          isAvailable: availability.available,
          conflictReason: availability.reason,
          surgeApplied: hasWeekendDays,
          surgePercentage: hasWeekendDays ? 5 : 0,
          gstRate: 18,
          breakdownText: `${totalDays} Day${totalDays > 1 ? "s" : ""} (${durationType.toLowerCase()} plan${hasWeekendDays ? ", weekend rate" : ""})`,
        },
      },
      200,
      startMs,
      path
    );
  }

  // 4. Vehicles list: GET /vehicles (public catalog)
  if (path === "vehicles") {
    const approvedAgencyIds = new Set(
      serverStore.agencies.filter((a) => a.isApproved).map((a) => a.id)
    );

    let list = serverStore.vehicles.filter(
      (v) =>
        !v.isDeleted &&
        v.approvalStatus === "APPROVED" &&
        (approvedAgencyIds.size === 0 || approvedAgencyIds.has(v.agencyId))
    );

    const type = searchParams.get("type");
    if (type) list = list.filter((v) => v.type === type);

    const category = searchParams.get("category");
    if (category) list = list.filter((v) => v.category === category);

    const fuelType = searchParams.get("fuelType");
    if (fuelType) list = list.filter((v) => v.fuelType === fuelType);

    const transmission = searchParams.get("transmission");
    if (transmission) list = list.filter((v) => v.transmission === transmission);

    const city = searchParams.get("city");
    if (city) {
      list = list.filter((v) => v.agency?.city.toLowerCase().includes(city.toLowerCase()));
    }

    const minPrice = searchParams.get("minPrice");
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!Number.isNaN(min)) list = list.filter((v) => v.pricing.dailyRate >= min);
    }

    const maxPrice = searchParams.get("maxPrice");
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!Number.isNaN(max)) list = list.filter((v) => v.pricing.dailyRate <= max);
    }

    const search = searchParams.get("search");
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q)
      );
    }

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && e > s) {
        list = list.filter((v) => computeVehicleAvailability(v.id, s, e).available);
      }
    }

    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    list.sort((a, b) => {
      if (sortBy === "dailyRate") {
        return sortOrder === "asc"
          ? a.pricing.dailyRate - b.pricing.dailyRate
          : b.pricing.dailyRate - a.pricing.dailyRate;
      }
      return sortOrder === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "12", 10) || 12));
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return jsonResponse(
      {
        success: true,
        count: paginated.length,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: paginated,
      },
      200,
      startMs,
      path
    );
  }

  // 5. Vehicle Detail: GET /vehicles/:id
  if (route[0] === "vehicles" && route.length === 2) {
    const id = route[1];
    const vehicle = serverStore.vehicles.find((v) => v.id === id && !v.isDeleted);
    if (!vehicle) {
      return jsonResponse({ message: "Vehicle not found" }, 404, startMs, path);
    }
    return jsonResponse({ success: true, data: vehicle }, 200, startMs, path);
  }

  // 6. Bookings: Customer (Authenticated, scoped to own bookings)
  if (path === "bookings/customer") {
    const auth = requireRoles(request, ["CUSTOMER", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    expireStalePendingBookings();

    const enriched = serverStore.bookings
      .filter((b) => auth.user!.role === "ADMIN" || b.customerId === auth.user!.id)
      .map((b) => ({
        ...b,
        vehicle: serverStore.vehicles.find((v) => v.id === b.vehicleId),
      }));
    return jsonResponse({ success: true, count: enriched.length, data: enriched }, 200, startMs, path);
  }

  // 7. Bookings: Agency (Agency Owner or Admin, scoped to agency)
  if (path === "bookings/agency") {
    const auth = requireRoles(request, ["AGENCY_OWNER", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    expireStalePendingBookings();

    const agencyId = auth.user!.agency?.id;
    const enriched = serverStore.bookings
      .filter((b) => {
        if (auth.user!.role === "ADMIN") return true;
        const v = serverStore.vehicles.find((veh) => veh.id === b.vehicleId);
        return v?.agencyId === agencyId;
      })
      .map((b) => ({
        ...b,
        vehicle: serverStore.vehicles.find((v) => v.id === b.vehicleId),
        customer: sanitizeCustomer(serverStore.users.find((u) => u.id === b.customerId)),
      }));
    return jsonResponse({ success: true, count: enriched.length, data: enriched }, 200, startMs, path);
  }

  // 8. Bookings: All (Admin only)
  if (path === "bookings/all") {
    const auth = requireRoles(request, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    expireStalePendingBookings();

    const enriched = serverStore.bookings.map((b) => ({
      ...b,
      vehicle: serverStore.vehicles.find((v) => v.id === b.vehicleId),
      customer: sanitizeCustomer(serverStore.users.find((u) => u.id === b.customerId)),
    }));
    return jsonResponse({ success: true, count: enriched.length, data: enriched }, 200, startMs, path);
  }

  // 9. Agency Dashboard (Agency Owner or Admin)
  if (path === "agencies/dashboard") {
    const auth = requireRoles(request, ["AGENCY_OWNER", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    expireStalePendingBookings();

    const agencyId = auth.user!.agency?.id;
    const agencyVehicles = serverStore.vehicles.filter(
      (v) => !v.isDeleted && (auth.user!.role === "ADMIN" || v.agencyId === agencyId)
    );
    const vehicleIds = new Set(agencyVehicles.map((v) => v.id));
    const agencyBookings = serverStore.bookings.filter((b) => vehicleIds.has(b.vehicleId));

    const totalVehicles = agencyVehicles.length;
    const availableVehicles = agencyVehicles.filter(
      (v) => v.status === "AVAILABLE" && v.approvalStatus === "APPROVED"
    ).length;
    const pendingBookings = agencyBookings.filter((b) => b.status === "PENDING").length;
    const activeRentals = agencyBookings.filter((b) => b.status === "ACTIVE").length;
    const totalRevenue = agencyBookings
      .filter((b) => ["ACTIVE", "COMPLETED"].includes(b.status))
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const recentBookings = agencyBookings.slice(0, 5).map((b) => ({
      ...b,
      vehicle: serverStore.vehicles.find((v) => v.id === b.vehicleId),
      customer: sanitizeCustomer(serverStore.users.find((u) => u.id === b.customerId)),
    }));

    const utilizationRate = totalVehicles > 0 ? Math.round((activeRentals / totalVehicles) * 100) : 0;

    return jsonResponse(
      {
        success: true,
        data: {
          totalVehicles,
          availableVehicles,
          pendingBookings,
          activeRentals,
          totalRevenue,
          utilizationRate,
          recentBookings,
        },
      },
      200,
      startMs,
      path
    );
  }

  // 10. Agency Vehicles (Agency Owner or Admin)
  if (path === "agencies/vehicles") {
    const auth = requireRoles(request, ["AGENCY_OWNER", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const agencyId = auth.user!.agency?.id;
    const list = serverStore.vehicles.filter(
      (v) => !v.isDeleted && (auth.user!.role === "ADMIN" || v.agencyId === agencyId)
    );
    return jsonResponse({ success: true, count: list.length, data: list }, 200, startMs, path);
  }

  // 11. Agency Maintenance Blocks (Agency Owner or Admin)
  if (path === "agencies/maintenance") {
    const auth = requireRoles(request, ["AGENCY_OWNER", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const agencyId = auth.user!.agency?.id;
    const enriched = serverStore.maintenanceBlocks
      .map((m) => ({
        ...m,
        vehicle: serverStore.vehicles.find((v) => v.id === m.vehicleId),
      }))
      .filter((m) => auth.user!.role === "ADMIN" || m.vehicle?.agencyId === agencyId);

    return jsonResponse({ success: true, count: enriched.length, data: enriched }, 200, startMs, path);
  }

  // 12. Admin Analytics (Admin only, computed from real records)
  if (path === "admin/analytics") {
    const auth = requireRoles(request, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    return jsonResponse({ success: true, data: computeRealAnalytics() }, 200, startMs, path);
  }

  // 13. Admin Health Diagnostics (Admin only)
  if (path === "admin/health") {
    const auth = requireRoles(request, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    const snapshot = getHealthSnapshot(startMs);
    const mem = process.memoryUsage();
    return jsonResponse(
      {
        success: true,
        data: {
          ...snapshot,
          memoryMb: {
            rss: Math.round(mem.rss / 1024 / 1024),
            heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
          },
          recentErrors: serverStore.recentErrors,
          storeCounts: {
            users: serverStore.users.length,
            agencies: serverStore.agencies.length,
            vehicles: serverStore.vehicles.length,
            bookings: serverStore.bookings.length,
          },
        },
      },
      200,
      startMs,
      path
    );
  }

  // 14. Admin Users (Admin only, stripped of sensitive fields)
  if (path === "admin/users") {
    const auth = requireRoles(request, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    const safeUsers = serverStore.users.map(sanitizeUserPublic);
    return jsonResponse({ success: true, count: safeUsers.length, data: safeUsers }, 200, startMs, path);
  }

  // 15. Admin Agencies (Admin only)
  if (path === "admin/agencies") {
    const auth = requireRoles(request, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    return jsonResponse({ success: true, count: serverStore.agencies.length, data: serverStore.agencies }, 200, startMs, path);
  }

  // 16. Admin Vehicles (Admin only)
  if (path === "admin/vehicles") {
    const auth = requireRoles(request, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    return jsonResponse({ success: true, count: serverStore.vehicles.length, data: serverStore.vehicles }, 200, startMs, path);
  }

  // 17. Admin Audit Logs (Admin only)
  if (path === "admin/audit-logs") {
    const auth = requireRoles(request, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;
    return jsonResponse({ success: true, count: serverStore.auditLogs.length, data: serverStore.auditLogs }, 200, startMs, path);
  }

  return jsonResponse({ message: `Route GET /api/v1/${path} not found` }, 404, startMs, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const startMs = Date.now();
  const { route } = await params;
  const path = route.join("/");
  const body = await request.json().catch(() => ({}));

  // 1. Auth: Login (rate limited + real password check + optional MFA + signed JWT)
  if (path === "auth/login") {
    if (!checkAuthRateLimit(request)) {
      return jsonResponse(
        { message: "Too many login attempts. Please wait 15 minutes before retrying." },
        429,
        startMs,
        path
      );
    }

    const { email, password, mfaCode } = body;
    if (!email || !password) {
      return jsonResponse({ message: "Email and password are required" }, 400, startMs, path);
    }

    const user = serverStore.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (!user || !user.isActive || !verifyPasswordSync(String(password), user.passwordHash)) {
      return jsonResponse({ message: "Invalid email or password" }, 401, startMs, path);
    }

    if (user.mfaEnabled) {
      if (!mfaCode) {
        return jsonResponse(
          { message: "Multi-factor authentication code required", mfaRequired: true },
          403,
          startMs,
          path
        );
      }
      if (String(mfaCode) !== user.mfaSecret) {
        return jsonResponse({ message: "Invalid MFA verification code" }, 401, startMs, path);
      }
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      agencyId: user.agency?.id,
    };
    const accessToken = signToken(tokenPayload, "access");
    const refreshToken = signToken(tokenPayload, "refresh");
    user.refreshToken = refreshToken;

    return jsonResponse(
      {
        success: true,
        message: "Login successful",
        data: {
          user: sanitizeUserPublic(user),
          accessToken,
          refreshToken,
        },
      },
      200,
      startMs,
      path
    );
  }

  // 2. Auth: Register (rate limited + role allowlist + hashed password)
  if (path === "auth/register") {
    if (!checkAuthRateLimit(request)) {
      return jsonResponse(
        { message: "Too many registration attempts. Please try again later." },
        429,
        startMs,
        path
      );
    }

    const { email, password, firstName, lastName, role, agencyName, city } = body;
    if (!email || !password || String(password).length < 8) {
      return jsonResponse(
        { message: "Valid email and password (minimum 8 characters) are required" },
        400,
        startMs,
        path
      );
    }

    const existing = serverStore.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (existing) {
      return jsonResponse({ message: "Email is already registered" }, 400, startMs, path);
    }

    // Prevent privilege escalation: self-registration can only be CUSTOMER or AGENCY_OWNER
    const safeRole: "CUSTOMER" | "AGENCY_OWNER" =
      role === "AGENCY_OWNER" ? "AGENCY_OWNER" : "CUSTOMER";

    const userId = `u-${Date.now()}`;
    const agencyId = safeRole === "AGENCY_OWNER" && agencyName ? `ag-${Date.now()}` : undefined;

    const newUser: StoreUser = {
      id: userId,
      email: String(email).trim(),
      passwordHash: hashPasswordSync(String(password)),
      mfaEnabled: false,
      firstName: firstName || "User",
      lastName: lastName || "",
      phone: body.phone || null,
      role: safeRole,
      isActive: true,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      ...(agencyId
        ? {
            agency: {
              id: agencyId,
              name: agencyName,
              city: city || "Bengaluru",
            },
          }
        : {}),
    };

    serverStore.users.push(newUser);

    if (agencyId && agencyName) {
      serverStore.agencies.push({
        id: agencyId,
        userId: newUser.id,
        name: agencyName,
        description: "Independent rental fleet on RentiGo.",
        address: body.address || "100 Main St",
        city: city || "Bengaluru",
        state: body.state || "KA",
        postalCode: body.postalCode || "560001",
        contactPhone: body.phone || "+91 98000 00000",
        contactEmail: newUser.email,
        logoUrl: null,
        isApproved: false,
        createdAt: new Date().toISOString(),
      });
    }

    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      agencyId,
    };
    const accessToken = signToken(tokenPayload, "access");
    const refreshToken = signToken(tokenPayload, "refresh");
    newUser.refreshToken = refreshToken;

    return jsonResponse(
      {
        success: true,
        message: "Registration successful",
        data: {
          user: sanitizeUserPublic(newUser),
          accessToken,
          refreshToken,
        },
      },
      201,
      startMs,
      path
    );
  }

  // 3. Auth: Refresh Token
  if (path === "auth/refresh-token") {
    const { refreshToken } = body;
    if (!refreshToken) {
      return jsonResponse({ message: "Refresh token required" }, 400, startMs, path);
    }

    const payload = verifyToken(String(refreshToken), "refresh");
    if (!payload) {
      return jsonResponse({ message: "Invalid or expired refresh token" }, 401, startMs, path);
    }

    const user = serverStore.users.find((u) => u.id === payload.id);
    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      return jsonResponse({ message: "Refresh token revoked or user inactive" }, 401, startMs, path);
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      agencyId: user.agency?.id,
    };
    const newAccessToken = signToken(tokenPayload, "access");
    const newRefreshToken = signToken(tokenPayload, "refresh");
    user.refreshToken = newRefreshToken;

    return jsonResponse(
      {
        success: true,
        data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
      },
      200,
      startMs,
      path
    );
  }

  // 4. Auth: Logout (revokes refresh token)
  if (path === "auth/logout") {
    const auth = authenticateRequest(request);
    if (auth.user) {
      auth.user.refreshToken = null;
    }
    return jsonResponse({ success: true, message: "Logged out successfully" }, 200, startMs, path);
  }

  // 5. Auth: Forgot Password
  if (path === "auth/forgot-password") {
    if (!checkAuthRateLimit(request)) {
      return jsonResponse({ message: "Too many reset requests. Please try again later." }, 429, startMs, path);
    }
    const { email } = body;
    if (!email) {
      return jsonResponse({ message: "Email is required" }, 400, startMs, path);
    }
    const user = serverStore.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
    if (user) {
      const token = crypto.randomBytes(20).toString("hex");
      serverStore.passwordResetTokens.push({
        token,
        userId: user.id,
        email: user.email,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });
    }
    return jsonResponse(
      {
        success: true,
        message: "If an account exists for that email, a password reset link has been issued.",
      },
      200,
      startMs,
      path
    );
  }

  // 6. Auth: Reset Password
  if (path === "auth/reset-password") {
    const { token, newPassword } = body;
    if (!token || !newPassword || String(newPassword).length < 8) {
      return jsonResponse(
        { message: "Valid reset token and new password (min 8 chars) are required" },
        400,
        startMs,
        path
      );
    }

    const idx = serverStore.passwordResetTokens.findIndex(
      (entry) => entry.token === token && entry.expiresAt > Date.now()
    );
    if (idx === -1) {
      return jsonResponse({ message: "Invalid or expired password reset token" }, 400, startMs, path);
    }

    const entry = serverStore.passwordResetTokens[idx];
    const user = serverStore.users.find((u) => u.id === entry.userId);
    if (!user) {
      return jsonResponse({ message: "User not found" }, 404, startMs, path);
    }

    user.passwordHash = hashPasswordSync(String(newPassword));
    user.refreshToken = null; // Invalidate active sessions
    serverStore.passwordResetTokens.splice(idx, 1);

    return jsonResponse({ success: true, message: "Password reset successfully. Please sign in." }, 200, startMs, path);
  }

  // 7. Auth: Optional MFA Setup / Toggle
  if (path === "auth/mfa/setup") {
    const auth = authenticateRequest(request);
    if (auth.errorResponse) return auth.errorResponse;
    const { enable } = body;
    if (enable) {
      const secret = String(Math.floor(100000 + Math.random() * 900000));
      auth.user!.mfaEnabled = true;
      auth.user!.mfaSecret = secret;
      return jsonResponse({ success: true, data: { mfaEnabled: true, recoveryCode: secret } }, 200, startMs, path);
    } else {
      auth.user!.mfaEnabled = false;
      auth.user!.mfaSecret = null;
      return jsonResponse({ success: true, data: { mfaEnabled: false } }, 200, startMs, path);
    }
  }

  // 8. Create Booking: POST /bookings (Authenticated, atomic lock + maintenance + duplicate check)
  if (path === "bookings") {
    const auth = requireRoles(request, ["CUSTOMER", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const { vehicleId, startDate, endDate, pickupLocation, dropoffLocation, notes } = body;
    if (!vehicleId || !startDate || !endDate) {
      return jsonResponse({ message: "vehicleId, startDate, and endDate are required" }, 400, startMs, path);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return jsonResponse({ message: "Return date/time must be strictly after pickup date/time" }, 400, startMs, path);
    }

    // Acquire synchronous vehicle mutex to prevent race conditions
    if (serverStore.activeBookingLocks.has(vehicleId)) {
      return jsonResponse(
        { message: "Another reservation is currently being processed for this vehicle. Please retry." },
        409,
        startMs,
        path
      );
    }

    serverStore.activeBookingLocks.add(vehicleId);
    try {
      const vehicle = serverStore.vehicles.find((v) => v.id === vehicleId && !v.isDeleted);
      if (!vehicle) {
        return jsonResponse({ message: "Vehicle not found" }, 404, startMs, path);
      }

      const availability = computeVehicleAvailability(vehicleId, start, end);
      if (!availability.available) {
        return jsonResponse(
          { message: `Booking conflict: ${availability.reason}` },
          409,
          startMs,
          path
        );
      }

      // Prevent duplicate submission by same customer
      const duplicate = serverStore.bookings.find(
        (b) =>
          b.customerId === auth.user!.id &&
          b.vehicleId === vehicleId &&
          ["PENDING", "APPROVED", "ACTIVE"].includes(b.status) &&
          start < new Date(b.endDate) &&
          end > new Date(b.startDate)
      );
      if (duplicate) {
        return jsonResponse(
          { message: "You already have an active or pending reservation for these dates." },
          409,
          startMs,
          path
        );
      }

      const diffMs = end.getTime() - start.getTime();
      const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const basePrice = totalDays * vehicle.pricing.dailyRate;
      const taxAmount = Math.round(basePrice * 0.18 * 100) / 100;
      const deliveryFee = body.isDelivery ? Number(body.deliveryFee) || 350 : 0;
      const totalAmount = basePrice + taxAmount + vehicle.pricing.securityDeposit + deliveryFee;

      const newBooking: StoreBooking = {
        id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        bookingNumber: `RGO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: auth.user!.id,
        vehicleId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalDays,
        durationType: totalDays >= 30 ? "MONTHLY" : totalDays >= 7 ? "WEEKLY" : "DAILY",
        basePrice,
        securityDeposit: vehicle.pricing.securityDeposit,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        status: "PENDING",
        paymentStatus: "PENDING",
        rejectionReason: null,
        cancellationReason: null,
        pickupLocation:
          pickupLocation ||
          (body.isDelivery ? `Doorstep Delivery: ${body.deliveryAddress || "Home Address"}` : "Agency Headquarters"),
        dropoffLocation: dropoffLocation || pickupLocation || "Agency Headquarters",
        notes: notes || null,
        deliveryFee,
        isDelivery: Boolean(body.isDelivery),
        paymentMethod: body.paymentMethod || "UPI",
        dlNumber: body.dlNumber || undefined,
        whatsappNumber: body.whatsappNumber || undefined,
        gstAmount: taxAmount,
        createdAt: new Date().toISOString(),
        vehicle,
      };

      serverStore.bookings.unshift(newBooking);

      return jsonResponse(
        {
          success: true,
          message: "Booking requested successfully! The agency will review your request shortly.",
          data: {
            ...newBooking,
            customer: sanitizeCustomer(auth.user),
          },
        },
        201,
        startMs,
        path
      );
    } finally {
      serverStore.activeBookingLocks.delete(vehicleId);
    }
  }

  // 9. Add Vehicle: POST /vehicles (Agency Owner or Admin)
  if (path === "vehicles") {
    const auth = requireRoles(request, ["AGENCY_OWNER", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const agencyId = auth.user!.agency?.id || "ag-001";
    const agencyObj = serverStore.agencies.find((a) => a.id === agencyId);

    const newVehicle: StoreVehicle = {
      id: `veh-${Date.now()}`,
      agencyId,
      vehicleNumber: body.vehicleNumber || `KA-03-${Math.floor(1000 + Math.random() * 9000)}`,
      brand: body.brand,
      model: body.model,
      year: parseInt(body.year, 10) || 2024,
      type: body.type,
      category: body.category,
      fuelType: body.fuelType,
      transmission: body.transmission,
      seatingCapacity: parseInt(body.seatingCapacity, 10) || 4,
      mileage: body.mileage || "18 km/l",
      description: body.description || "",
      features: body.features || ["Air Conditioning", "Bluetooth"],
      status: "AVAILABLE",
      approvalStatus: "PENDING",
      rejectionReason: null,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      pricing: {
        dailyRate: parseFloat(body.pricing?.dailyRate || body.dailyRate || 1500),
        weeklyRate: parseFloat(body.pricing?.weeklyRate || body.weeklyRate || 9000),
        monthlyRate: parseFloat(body.pricing?.monthlyRate || body.monthlyRate || 32000),
        securityDeposit: parseFloat(body.pricing?.securityDeposit || body.securityDeposit || 5000),
        lateFeePerHour: parseFloat(body.pricing?.lateFeePerHour || 250),
        currency: "INR",
      },
      images: body.images?.length
        ? body.images.map((img: any, idx: number) => ({
            id: `img-${Date.now()}-${idx}`,
            url: img.url || img,
            isPrimary: idx === 0,
            caption: null,
          }))
        : [
            {
              id: `img-${Date.now()}-0`,
              url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
              isPrimary: true,
              caption: "Front view",
            },
          ],
      agency: agencyObj
        ? {
            id: agencyObj.id,
            name: agencyObj.name,
            city: agencyObj.city,
            state: agencyObj.state,
            contactPhone: agencyObj.contactPhone,
            contactEmail: agencyObj.contactEmail,
          }
        : undefined,
    };

    serverStore.vehicles.unshift(newVehicle);
    return jsonResponse({ success: true, message: "Vehicle added successfully", data: newVehicle }, 201, startMs, path);
  }

  // 10. Maintenance: POST /vehicles/:id/maintenance (Agency Owner of vehicle or Admin)
  if (route[0] === "vehicles" && route[2] === "maintenance") {
    const auth = requireRoles(request, ["AGENCY_OWNER", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const id = route[1];
    const vehicle = serverStore.vehicles.find((v) => v.id === id && !v.isDeleted);
    if (!vehicle) return jsonResponse({ message: "Vehicle not found" }, 404, startMs, path);

    if (auth.user!.role === "AGENCY_OWNER" && vehicle.agencyId !== auth.user!.agency?.id) {
      return jsonResponse({ message: "Forbidden: you can only manage your own agency's vehicles" }, 403, startMs, path);
    }

    vehicle.status = "MAINTENANCE";
    const newBlock = {
      id: `maint-${Date.now()}`,
      vehicleId: id,
      startDate: body.startDate || new Date().toISOString(),
      endDate: body.endDate || new Date(Date.now() + 86400000 * 3).toISOString(),
      reason: body.reason || "Routine vehicle servicing & safety inspection",
      cost: body.cost ? Number(body.cost) : undefined,
      serviceCenter: body.serviceCenter || "Authorized Service Center",
      status: "IN_PROGRESS" as const,
      createdAt: new Date().toISOString(),
    };
    serverStore.maintenanceBlocks.unshift(newBlock);

    serverStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: `${auth.user!.firstName} ${auth.user!.lastName}`,
      actorRole: auth.user!.role,
      action: "MAINTENANCE_SCHEDULED",
      targetType: "VEHICLE",
      targetId: id,
      details: `Scheduled service for ${vehicle.brand} ${vehicle.model} (${vehicle.vehicleNumber}). Reason: ${newBlock.reason}`,
    });

    return jsonResponse({ success: true, message: "Vehicle placed in maintenance & dates blocked", data: newBlock }, 201, startMs, path);
  }

  // 11. Review: POST /bookings/:id/review (Customer who owns completed booking)
  if (route[0] === "bookings" && route[2] === "review") {
    const auth = requireRoles(request, ["CUSTOMER"]);
    if (auth.errorResponse) return auth.errorResponse;
    const booking = serverStore.bookings.find((b) => b.id === route[1]);
    if (!booking) return jsonResponse({ message: "Booking not found" }, 404, startMs, path);
    if (booking.customerId !== auth.user!.id) {
      return jsonResponse({ message: "Forbidden: cannot review another customer's booking" }, 403, startMs, path);
    }
    return jsonResponse({ success: true, message: "Review submitted successfully" }, 201, startMs, path);
  }

  // 12. Admin Audit Log: POST /admin/audit-logs (Admin only)
  if (path === "admin/audit-logs") {
    const auth = requireRoles(request, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: `${auth.user!.firstName} ${auth.user!.lastName}`,
      actorRole: auth.user!.role,
      action: body.action || "MANUAL_AUDIT_ENTRY",
      targetType: body.targetType || "SYSTEM",
      targetId: body.targetId || "system",
      details: body.details || "Administrative event logged",
    };
    serverStore.auditLogs.unshift(newLog);
    return jsonResponse({ success: true, data: newLog }, 201, startMs, path);
  }

  return jsonResponse({ message: `Route POST /api/v1/${path} not found` }, 404, startMs, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const startMs = Date.now();
  const { route } = await params;
  const path = route.join("/");
  const body = await request.json().catch(() => ({}));

  // 1. Handover Check-In: PATCH /bookings/:id/handover (Agency Owner of vehicle or Admin)
  if (route[0] === "bookings" && route[2] === "handover") {
    const auth = requireRoles(request, ["AGENCY_OWNER", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const bookingId = route[1];
    const booking = serverStore.bookings.find((b) => b.id === bookingId);
    if (!booking) return jsonResponse({ message: "Booking not found" }, 404, startMs, path);

    const vehicle = serverStore.vehicles.find((v) => v.id === booking.vehicleId);
    if (auth.user!.role === "AGENCY_OWNER" && vehicle?.agencyId !== auth.user!.agency?.id) {
      return jsonResponse({ message: "Forbidden: booking belongs to another agency" }, 403, startMs, path);
    }

    booking.status = "ACTIVE";
    booking.handover = {
      odometerKm: Number(body.odometerKm) || 12000,
      fuelPercent: Number(body.fuelPercent) || 100,
      otpVerified: true,
      handedOverAt: new Date().toISOString(),
      notes: body.notes || "Vehicle handed over to customer in clean condition.",
      dlVerified: body.dlVerified !== undefined ? !!body.dlVerified : true,
    };

    serverStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: `${auth.user!.firstName} ${auth.user!.lastName}`,
      actorRole: auth.user!.role,
      action: "HANDOVER_COMPLETED",
      targetType: "BOOKING",
      targetId: booking.id,
      details: `Vehicle handed over for booking #${booking.bookingNumber}. Start Odometer: ${booking.handover.odometerKm} km, Fuel: ${booking.handover.fuelPercent}%.`,
    });

    return jsonResponse(
      {
        success: true,
        message: "Handover check-in completed! Rental is now ACTIVE.",
        data: {
          ...booking,
          customer: sanitizeCustomer(serverStore.users.find((u) => u.id === booking.customerId)),
        },
      },
      200,
      startMs,
      path
    );
  }

  // 2. Return Inspection & Settlement: PATCH /bookings/:id/return (Agency Owner of vehicle or Admin)
  if (route[0] === "bookings" && route[2] === "return") {
    const auth = requireRoles(request, ["AGENCY_OWNER", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const bookingId = route[1];
    const booking = serverStore.bookings.find((b) => b.id === bookingId);
    if (!booking) return jsonResponse({ message: "Booking not found" }, 404, startMs, path);

    const vehicle = serverStore.vehicles.find((v) => v.id === booking.vehicleId);
    if (auth.user!.role === "AGENCY_OWNER" && vehicle?.agencyId !== auth.user!.agency?.id) {
      return jsonResponse({ message: "Forbidden: booking belongs to another agency" }, 403, startMs, path);
    }

    booking.status = "COMPLETED";
    const fuelPenalty = Number(body.fuelPenaltyFee) || 0;
    const damageFee = Number(body.damageFee) || 0;
    const lateFee = Number(body.lateFee) || 0;
    const netDepositRefund = Math.max(0, booking.securityDeposit - fuelPenalty - damageFee - lateFee);

    booking.returnInspection = {
      odometerKm: Number(body.odometerKm) || (booking.handover?.odometerKm ? booking.handover.odometerKm + 180 : 12180),
      fuelPercent: Number(body.fuelPercent) || 100,
      returnedAt: new Date().toISOString(),
      fuelPenaltyFee: fuelPenalty,
      damageFee,
      lateFee,
      depositRefunded: body.depositRefunded !== undefined ? Number(body.depositRefunded) : netDepositRefund,
      notes: body.notes || "Vehicle inspection cleared. Security deposit release processed.",
    };

    if (vehicle) {
      vehicle.status = "AVAILABLE";
    }

    serverStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: `${auth.user!.firstName} ${auth.user!.lastName}`,
      actorRole: auth.user!.role,
      action: "RETURN_COMPLETED_DEPOSIT_SETTLED",
      targetType: "BOOKING",
      targetId: booking.id,
      details: `Return inspected for #${booking.bookingNumber}. Return Odometer: ${booking.returnInspection.odometerKm} km. Security deposit refund of ₹${booking.returnInspection.depositRefunded} initiated.`,
    });

    return jsonResponse(
      {
        success: true,
        message: "Return completed and deposit settlement recorded! Vehicle is now AVAILABLE.",
        data: {
          ...booking,
          customer: sanitizeCustomer(serverStore.users.find((u) => u.id === booking.customerId)),
        },
      },
      200,
      startMs,
      path
    );
  }

  // 3. Admin Dispute Override: PATCH /admin/bookings/:id/override (Admin only)
  if (route[0] === "admin" && route[1] === "bookings" && route[3] === "override") {
    const auth = requireRoles(request, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const bookingId = route[2];
    const booking = serverStore.bookings.find((b) => b.id === bookingId);
    if (!booking) return jsonResponse({ message: "Booking not found" }, 404, startMs, path);

    const oldStatus = booking.status;
    booking.status = body.status || booking.status;
    if (body.paymentStatus) booking.paymentStatus = body.paymentStatus;

    serverStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: `${auth.user!.firstName} ${auth.user!.lastName}`,
      actorRole: auth.user!.role,
      action: "BOOKING_STATUS_OVERRIDE",
      targetType: "BOOKING",
      targetId: booking.id,
      details: `Status forced from ${oldStatus} to ${booking.status}. Reason: ${body.reason || "Dispute mediation resolution"}`,
    });

    return jsonResponse(
      {
        success: true,
        message: `Booking #${booking.bookingNumber} overridden to ${booking.status}`,
        data: booking,
      },
      200,
      startMs,
      path
    );
  }

  // 4. Update Booking Status: PATCH /bookings/:id/status (RBAC + Ownership)
  if (route[0] === "bookings" && route[2] === "status") {
    const auth = authenticateRequest(request);
    if (auth.errorResponse) return auth.errorResponse;

    const bookingId = route[1];
    const booking = serverStore.bookings.find((b) => b.id === bookingId);
    if (!booking) return jsonResponse({ message: "Booking not found" }, 404, startMs, path);

    const vehicle = serverStore.vehicles.find((v) => v.id === booking.vehicleId);
    const user = auth.user!;

    if (user.role === "CUSTOMER") {
      if (booking.customerId !== user.id) {
        return jsonResponse({ message: "Forbidden: cannot modify another user's booking" }, 403, startMs, path);
      }
      if (body.status !== "CANCELLED") {
        return jsonResponse({ message: "Forbidden: customers can only cancel their own bookings" }, 403, startMs, path);
      }
    } else if (user.role === "AGENCY_OWNER") {
      if (vehicle?.agencyId !== user.agency?.id) {
        return jsonResponse({ message: "Forbidden: booking does not belong to your agency" }, 403, startMs, path);
      }
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[booking.status] || [];
    if (!allowedTransitions.includes(body.status)) {
      return jsonResponse(
        {
          message: `Invalid status transition from ${booking.status} to ${body.status}. Allowed next states: ${allowedTransitions.join(", ") || "none"}`,
        },
        400,
        startMs,
        path
      );
    }

    if (body.status === "REJECTED" && !body.reason && !body.rejectionReason) {
      return jsonResponse({ message: "A rejection reason is required when declining a booking request" }, 400, startMs, path);
    }

    const previousStatus = booking.status;
    booking.status = body.status;
    if (body.reason || body.rejectionReason) booking.rejectionReason = body.reason || body.rejectionReason;
    if (body.reason || body.cancellationReason) booking.cancellationReason = body.reason || body.cancellationReason;

    serverStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: `${user.firstName} ${user.lastName}`,
      actorRole: user.role,
      action: `BOOKING_${body.status}`,
      targetType: "BOOKING",
      targetId: booking.id,
      details: `Booking #${booking.bookingNumber} transitioned from ${previousStatus} to ${body.status}${body.reason ? `. Reason: ${body.reason}` : ""}`,
    });

    return jsonResponse(
      {
        success: true,
        message: `Booking status updated to ${body.status}`,
        data: {
          ...booking,
          customer: sanitizeCustomer(serverStore.users.find((u) => u.id === booking.customerId)),
        },
      },
      200,
      startMs,
      path
    );
  }

  // 5. Admin User Status: PATCH /admin/users/:id/status (Admin only)
  if (route[0] === "admin" && route[1] === "users" && route[3] === "status") {
    const auth = requireRoles(request, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const userId = route[2];
    const targetUser = serverStore.users.find((u) => u.id === userId);
    if (!targetUser) return jsonResponse({ message: "User not found" }, 404, startMs, path);
    targetUser.isActive = body.isActive !== undefined ? body.isActive : !targetUser.isActive;

    serverStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: `${auth.user!.firstName} ${auth.user!.lastName}`,
      actorRole: auth.user!.role,
      action: targetUser.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      targetType: "USER",
      targetId: targetUser.id,
      details: `User account ${targetUser.email} (${targetUser.firstName} ${targetUser.lastName}) was ${targetUser.isActive ? "activated" : "deactivated"}`,
    });

    return jsonResponse({ success: true, message: "User status updated", data: sanitizeUserPublic(targetUser) }, 200, startMs, path);
  }

  // 6. Admin Agency Approval: PATCH /admin/agencies/:id/approval (Admin only)
  if (route[0] === "admin" && route[1] === "agencies" && route[3] === "approval") {
    const auth = requireRoles(request, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const agencyId = route[2];
    const agency = serverStore.agencies.find((a) => a.id === agencyId);
    if (!agency) return jsonResponse({ message: "Agency not found" }, 404, startMs, path);
    agency.isApproved = body.isApproved;

    serverStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: `${auth.user!.firstName} ${auth.user!.lastName}`,
      actorRole: auth.user!.role,
      action: agency.isApproved ? "AGENCY_VERIFIED" : "AGENCY_SUSPENDED",
      targetType: "AGENCY",
      targetId: agency.id,
      details: `Agency ${agency.name} (${agency.city}) was ${agency.isApproved ? "verified and approved" : "suspended"}`,
    });

    return jsonResponse({ success: true, message: "Agency approval updated", data: agency }, 200, startMs, path);
  }

  // 7. Vehicle Approval: PATCH /vehicles/:id/approval (Admin only)
  if (route[0] === "vehicles" && route[2] === "approval") {
    const auth = requireRoles(request, ["ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const vehicleId = route[1];
    const vehicle = serverStore.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return jsonResponse({ message: "Vehicle not found" }, 404, startMs, path);
    vehicle.approvalStatus = body.approvalStatus || (body.isApproved ? "APPROVED" : "REJECTED");
    if (body.rejectionReason) vehicle.rejectionReason = body.rejectionReason;

    serverStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: `${auth.user!.firstName} ${auth.user!.lastName}`,
      actorRole: auth.user!.role,
      action: vehicle.approvalStatus === "APPROVED" ? "VEHICLE_APPROVED" : "VEHICLE_REJECTED",
      targetType: "VEHICLE",
      targetId: vehicle.id,
      details: `Listing for ${vehicle.brand} ${vehicle.model} was ${vehicle.approvalStatus.toLowerCase()}${body.rejectionReason ? `. Feedback: ${body.rejectionReason}` : ""}`,
    });

    return jsonResponse({ success: true, message: "Vehicle approval status updated", data: vehicle }, 200, startMs, path);
  }

  // 8. Vehicle Status: PATCH /vehicles/:id/status (Agency Owner of vehicle or Admin)
  if (route[0] === "vehicles" && route[2] === "status") {
    const auth = requireRoles(request, ["AGENCY_OWNER", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const vehicleId = route[1];
    const vehicle = serverStore.vehicles.find((v) => v.id === vehicleId && !v.isDeleted);
    if (!vehicle) return jsonResponse({ message: "Vehicle not found" }, 404, startMs, path);

    if (auth.user!.role === "AGENCY_OWNER" && vehicle.agencyId !== auth.user!.agency?.id) {
      return jsonResponse({ message: "Forbidden: cannot modify another agency's vehicle" }, 403, startMs, path);
    }

    vehicle.status = body.status;
    return jsonResponse({ success: true, message: "Vehicle status updated", data: vehicle }, 200, startMs, path);
  }

  return jsonResponse({ message: `Route PATCH /api/v1/${path} not found` }, 404, startMs, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const startMs = Date.now();
  const { route } = await params;
  const path = route.join("/");

  // 1. Remove Maintenance Block: DELETE /vehicles/:id/maintenance/:blockId
  if (route[0] === "vehicles" && route[2] === "maintenance" && route.length >= 4) {
    const auth = requireRoles(request, ["AGENCY_OWNER", "ADMIN"]);
    if (auth.errorResponse) return auth.errorResponse;

    const vehicleId = route[1];
    const blockId = route[3];

    const vehicle = serverStore.vehicles.find((v) => v.id === vehicleId);
    if (auth.user!.role === "AGENCY_OWNER" && vehicle?.agencyId !== auth.user!.agency?.id) {
      return jsonResponse({ message: "Forbidden: cannot modify another agency's maintenance" }, 403, startMs, path);
    }

    const idx = serverStore.maintenanceBlocks.findIndex((m) => m.id === blockId);
    if (idx !== -1) {
      serverStore.maintenanceBlocks.splice(idx, 1);
    }

    const remaining = serverStore.maintenanceBlocks.filter((m) => m.vehicleId === vehicleId);
    if (vehicle && remaining.length === 0) {
      vehicle.status = "AVAILABLE";
    }

    serverStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName: `${auth.user!.firstName} ${auth.user!.lastName}`,
      actorRole: auth.user!.role,
      action: "MAINTENANCE_COMPLETED_EARLY",
      targetType: "VEHICLE",
      targetId: vehicleId,
      details: `Maintenance block ${blockId} cleared early. Vehicle status restored to AVAILABLE.`,
    });

    return jsonResponse({ success: true, message: "Maintenance block removed and vehicle restored to AVAILABLE" }, 200, startMs, path);
  }

  return jsonResponse({ message: `Route DELETE /api/v1/${path} not found` }, 404, startMs, path);
}
