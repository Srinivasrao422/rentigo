import { NextRequest, NextResponse } from "next/server";
import { serverStore, StoreVehicle, StoreBooking, StoreUser } from "@/lib/serverStore";

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

function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function OPTIONS() {
  return jsonResponse({ ok: true });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const { route } = await params;
  const path = route.join("/");
  const { searchParams } = new URL(request.url);

  // 1. Health
  if (path === "health") {
    return jsonResponse({
      status: "ok",
      mode: "nextjs-serverless",
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Quote Calculation: GET /bookings/quote
  if (path === "bookings/quote") {
    const vehicleId = searchParams.get("vehicleId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!vehicleId || !startDateStr || !endDateStr) {
      return jsonResponse({ message: "vehicleId, startDate, and endDate are required" }, 400);
    }

    const vehicle = serverStore.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) {
      return jsonResponse({ message: "Vehicle not found" }, 404);
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffMs = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const { dailyRate, weeklyRate, monthlyRate, securityDeposit } = vehicle.pricing;

    // Feature 3: Dynamic Weekend Surge Detection (Friday, Saturday, Sunday)
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
    let standardDailyTotal = totalDays * effectiveDailyRate;

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
    const taxAmount = Math.round(basePrice * 0.18 * 100) / 100; // 18% GST for Indian Motor Vehicle Rental
    const totalAmount = basePrice + taxAmount + securityDeposit;

    // Check for real booking conflicts (non-overlapping: start < bEnd && end > bStart)
    const conflictingBooking = serverStore.bookings.find((b) => {
      if (b.vehicleId !== vehicleId) return false;
      if (!["PENDING", "APPROVED", "ACTIVE"].includes(b.status)) return false;
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      return start < bEnd && end > bStart;
    });

    const isAvailable = vehicle.status === "AVAILABLE" && !conflictingBooking;
    const conflictReason = !isAvailable
      ? conflictingBooking
        ? `Reserved from ${new Date(conflictingBooking.startDate).toLocaleDateString("en-IN")} to ${new Date(conflictingBooking.endDate).toLocaleDateString("en-IN")}`
        : `Vehicle status is ${vehicle.status.toLowerCase()}`
      : undefined;

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

    return jsonResponse({
      success: true,
      data: {
        vehicleId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalDays,
        durationType,
        applicableRate,
        rateLabel,
        pricingTier: {
          dailyRate,
          weeklyRate,
          monthlyRate,
        },
        basePrice,
        discountAmount,
        taxAmount,
        securityDeposit,
        totalAmount,
        currency: vehicle.pricing.currency || "INR",
        isAvailable,
        conflictReason,
        surgeApplied: hasWeekendDays,
        surgePercentage: hasWeekendDays ? 5 : 0,
        gstRate: 18,
        breakdownText: `${totalDays} Day${totalDays > 1 ? "s" : ""} (${durationType.toLowerCase()} plan${hasWeekendDays ? ", weekend rate" : ""})`,
      },
    });
  }

  // 3. Vehicles list: GET /vehicles
  if (path === "vehicles") {
    let list = serverStore.vehicles.filter((v) => !v.isDeleted && v.approvalStatus === "APPROVED");

    const type = searchParams.get("type");
    if (type) list = list.filter((v) => v.type === type);

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
      list = list.filter((v) => v.pricing.dailyRate >= min);
    }

    const maxPrice = searchParams.get("maxPrice");
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      list = list.filter((v) => v.pricing.dailyRate <= max);
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

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "12", 10)));
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return jsonResponse({
      success: true,
      count: paginated.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: paginated,
    });
  }

  // 4. Vehicle Detail: GET /vehicles/:id
  if (route[0] === "vehicles" && route.length === 2) {
    const id = route[1];
    const vehicle = serverStore.vehicles.find((v) => v.id === id);
    if (!vehicle) {
      return jsonResponse({ message: "Vehicle not found" }, 404);
    }
    return jsonResponse({ success: true, data: vehicle });
  }

  // 5. Bookings: Customer
  if (path === "bookings/customer") {
    const enriched = serverStore.bookings.map((b) => ({
      ...b,
      vehicle: serverStore.vehicles.find((v) => v.id === b.vehicleId),
    }));
    return jsonResponse({ success: true, count: enriched.length, data: enriched });
  }

  // 6. Bookings: Agency
  if (path === "bookings/agency") {
    const enriched = serverStore.bookings.map((b) => ({
      ...b,
      vehicle: serverStore.vehicles.find((v) => v.id === b.vehicleId),
      customer: sanitizeCustomer(serverStore.users.find((u) => u.id === b.customerId)),
    }));
    return jsonResponse({ success: true, count: enriched.length, data: enriched });
  }

  // 7. Bookings: All (Admin)
  if (path === "bookings/all") {
    const enriched = serverStore.bookings.map((b) => ({
      ...b,
      vehicle: serverStore.vehicles.find((v) => v.id === b.vehicleId),
      customer: sanitizeCustomer(serverStore.users.find((u) => u.id === b.customerId)),
    }));
    return jsonResponse({ success: true, count: enriched.length, data: enriched });
  }

  // 8. Agency Dashboard
  if (path === "agencies/dashboard") {
    const totalVehicles = serverStore.vehicles.filter((v) => !v.isDeleted).length;
    const availableVehicles = serverStore.vehicles.filter(
      (v) => !v.isDeleted && v.status === "AVAILABLE" && v.approvalStatus === "APPROVED"
    ).length;
    const pendingBookings = serverStore.bookings.filter((b) => b.status === "PENDING").length;
    const activeRentals = serverStore.bookings.filter((b) => b.status === "ACTIVE").length;
    const totalRevenue = serverStore.bookings
      .filter((b) => ["APPROVED", "ACTIVE", "COMPLETED"].includes(b.status))
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const recentBookings = serverStore.bookings.slice(0, 5).map((b) => ({
      ...b,
      vehicle: serverStore.vehicles.find((v) => v.id === b.vehicleId),
      customer: sanitizeCustomer(serverStore.users.find((u) => u.id === b.customerId)),
    }));

    const utilizationRate = totalVehicles > 0 ? Math.round((activeRentals / totalVehicles) * 100) : 0;

    return jsonResponse({
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
    });
  }

  // 9. Agency Vehicles
  if (path === "agencies/vehicles") {
    const list = serverStore.vehicles.filter((v) => !v.isDeleted);
    return jsonResponse({ success: true, count: list.length, data: list });
  }

  // 10. Admin Analytics (Calculated from real records)
  if (path === "admin/analytics") {
    const totalVehicles = serverStore.vehicles.filter((v) => !v.isDeleted).length;
    const activeRentals = serverStore.bookings.filter((b) => b.status === "ACTIVE").length;
    const approvedOrActive = serverStore.bookings.filter((b) => ["APPROVED", "ACTIVE", "COMPLETED"].includes(b.status)).length;
    const totalBookings = serverStore.bookings.length;

    let twoWheelerRevenue = 0;
    let fourWheelerRevenue = 0;
    let totalRevenue = 0;

    for (const b of serverStore.bookings) {
      if (["ACTIVE", "COMPLETED"].includes(b.status)) {
        const v = serverStore.vehicles.find((veh) => veh.id === b.vehicleId);
        totalRevenue += b.totalAmount;
        if (v?.type === "TWO_WHEELER") {
          twoWheelerRevenue += b.totalAmount;
        } else {
          fourWheelerRevenue += b.totalAmount;
        }
      }
    }

    const utilizationRate = totalVehicles > 0 ? Math.round((activeRentals / totalVehicles) * 100) : 0;
    const conversionRate = totalBookings > 0 ? Math.round((approvedOrActive / totalBookings) * 100) : 0;

    return jsonResponse({
      success: true,
      data: {
        overview: {
          totalUsers: serverStore.users.length,
          totalAgencies: serverStore.agencies.length,
          totalVehicles,
          totalBookings,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          pendingVehicleApprovals: serverStore.vehicles.filter((v) => v.approvalStatus === "PENDING").length,
        },
        kpis: {
          utilizationRate,
          conversionRate,
          conflictRate: 0.0,
          monthlyActiveUsers: serverStore.users.length,
        },
        revenueBreakdown: {
          twoWheelerRevenue: Math.round(twoWheelerRevenue * 100) / 100,
          fourWheelerRevenue: Math.round(fourWheelerRevenue * 100) / 100,
        },
        metadata: {
          reportingPeriod: "All-Time to Date",
          lastRefreshedAt: new Date().toISOString(),
        },
      },
    });
  }

  // 11. Admin Users
  if (path === "admin/users") {
    return jsonResponse({ success: true, count: serverStore.users.length, data: serverStore.users });
  }

  // 12. Admin Agencies
  if (path === "admin/agencies") {
    return jsonResponse({ success: true, count: serverStore.agencies.length, data: serverStore.agencies });
  }

  // 13. Admin Vehicles
  if (path === "admin/vehicles") {
    return jsonResponse({ success: true, count: serverStore.vehicles.length, data: serverStore.vehicles });
  }

  return jsonResponse({ message: `Route GET /api/v1/${path} not found` }, 404);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const { route } = await params;
  const path = route.join("/");
  const body = await request.json().catch(() => ({}));

  // 1. Auth: Login
  if (path === "auth/login") {
    const { email, password } = body;
    const user = serverStore.users.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());

    if (!user) {
      return jsonResponse({ message: "Invalid email or password" }, 401);
    }

    const token = `token_${user.id}_${Date.now()}`;
    return jsonResponse({
      success: true,
      message: "Login successful",
      data: {
        user,
        accessToken: token,
        refreshToken: `ref_${token}`,
      },
    });
  }

  // 2. Auth: Register
  if (path === "auth/register") {
    const { email, firstName, lastName, role, agencyName, city } = body;
    const existing = serverStore.users.find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
    if (existing) {
      return jsonResponse({ message: "Email is already registered" }, 400);
    }

    const newUser: StoreUser = {
      id: `u-${Date.now()}`,
      email,
      firstName: firstName || "User",
      lastName: lastName || "",
      phone: body.phone || null,
      role: role || "CUSTOMER",
      isActive: true,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
      ...(agencyName
        ? {
            agency: {
              id: `ag-${Date.now()}`,
              name: agencyName,
              city: city || "San Francisco",
            },
          }
        : {}),
    };

    serverStore.users.push(newUser);

    if (agencyName) {
      serverStore.agencies.push({
        id: newUser.agency!.id,
        userId: newUser.id,
        name: agencyName,
        description: "Independent rental fleet on RentiGo.",
        address: body.address || "100 Main St",
        city: city || "San Francisco",
        state: "CA",
        postalCode: "94103",
        contactPhone: body.phone || "+1 (555) 000-0000",
        contactEmail: email,
        logoUrl: null,
        isApproved: false,
        createdAt: new Date().toISOString(),
      });
    }

    const token = `token_${newUser.id}_${Date.now()}`;
    return jsonResponse(
      {
        success: true,
        message: "Registration successful",
        data: {
          user: newUser,
          accessToken: token,
          refreshToken: `ref_${token}`,
        },
      },
      201
    );
  }

  // 3. Auth: Logout
  if (path === "auth/logout") {
    return jsonResponse({ success: true, message: "Logged out successfully" });
  }

  // 4. Create Booking: POST /bookings
  if (path === "bookings") {
    const { vehicleId, startDate, endDate, pickupLocation, dropoffLocation, notes } = body;
    const vehicle = serverStore.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle || vehicle.isDeleted) {
      return jsonResponse({ message: "Vehicle not found" }, 404);
    }
    if (vehicle.status !== "AVAILABLE") {
      return jsonResponse({ message: `Vehicle is currently unavailable for rent (status: ${vehicle.status})` }, 400);
    }
    if (vehicle.approvalStatus !== "APPROVED") {
      return jsonResponse({ message: "Vehicle listing is pending admin review and cannot be reserved" }, 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Overlap conflict check against existing active bookings
    const conflictingBooking = serverStore.bookings.find(
      (b) =>
        b.vehicleId === vehicleId &&
        ["PENDING", "APPROVED", "ACTIVE"].includes(b.status) &&
        start < new Date(b.endDate) &&
        end > new Date(b.startDate)
    );

    if (conflictingBooking) {
      return jsonResponse(
        {
          message: `Booking conflict: Vehicle is already reserved from ${new Date(conflictingBooking.startDate).toLocaleDateString()} to ${new Date(conflictingBooking.endDate).toLocaleDateString()}.`,
        },
        409
      );
    }

    const diffMs = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const basePrice = totalDays * vehicle.pricing.dailyRate;
    const taxAmount = Math.round(basePrice * 0.18 * 100) / 100; // 18% GST
    const deliveryFee = body.isDelivery ? (body.deliveryFee || 350) : 0;
    const totalAmount = basePrice + taxAmount + vehicle.pricing.securityDeposit + deliveryFee;

    const newBooking: StoreBooking = {
      id: `bk-${Date.now()}`,
      bookingNumber: `RGO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: "u-customer-001",
      vehicleId,
      startDate,
      endDate,
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
      pickupLocation: pickupLocation || (body.isDelivery ? `Doorstep Delivery: ${body.deliveryAddress || "Home Address"}` : "Agency Headquarters"),
      dropoffLocation: dropoffLocation || pickupLocation || "Agency Headquarters",
      notes: notes || null,
      deliveryFee,
      isDelivery: body.isDelivery || false,
      paymentMethod: body.paymentMethod || "UPI",
      dlNumber: body.dlNumber || "DL-0420110012345",
      whatsappNumber: body.whatsappNumber || "+91 98765 43210",
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
          customer: sanitizeCustomer(serverStore.users.find((u) => u.id === newBooking.customerId)),
        },
      },
      201
    );
  }

  // 5. Add Vehicle: POST /vehicles
  if (path === "vehicles") {
    const newVehicle: StoreVehicle = {
      id: `veh-${Date.now()}`,
      agencyId: "ag-001",
      vehicleNumber: body.vehicleNumber || `TEMP-${Math.floor(100 + Math.random() * 900)}`,
      brand: body.brand,
      model: body.model,
      year: parseInt(body.year, 10) || 2024,
      type: body.type,
      category: body.category,
      fuelType: body.fuelType,
      transmission: body.transmission,
      seatingCapacity: parseInt(body.seatingCapacity, 10) || 4,
      mileage: body.mileage || "30 mpg",
      description: body.description || "",
      features: body.features || ["Air Conditioning", "Bluetooth"],
      status: "AVAILABLE",
      approvalStatus: "PENDING", // Newly created vehicles must be reviewed and approved by admin
      rejectionReason: null,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      pricing: {
        dailyRate: parseFloat(body.pricing?.dailyRate || body.dailyRate || 50),
        weeklyRate: parseFloat(body.pricing?.weeklyRate || body.weeklyRate || 300),
        monthlyRate: parseFloat(body.pricing?.monthlyRate || body.monthlyRate || 1000),
        securityDeposit: parseFloat(body.pricing?.securityDeposit || body.securityDeposit || 200),
        lateFeePerHour: 15,
        currency: "USD",
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
      agency: {
        id: "ag-001",
        name: "CityRide Motors",
        city: "San Francisco",
        state: "CA",
        contactPhone: "+1 (555) 234-5678",
        contactEmail: "contact@cityridemotors.com",
      },
    };

    serverStore.vehicles.unshift(newVehicle);
    return jsonResponse({ success: true, message: "Vehicle added successfully", data: newVehicle }, 201);
  }

  // 6. Maintenance: POST /vehicles/:id/maintenance
  if (route[0] === "vehicles" && route[2] === "maintenance") {
    const id = route[1];
    const vehicle = serverStore.vehicles.find((v) => v.id === id);
    if (!vehicle) return jsonResponse({ message: "Vehicle not found" }, 404);
    vehicle.status = "MAINTENANCE";
    return jsonResponse({ success: true, message: "Vehicle placed in maintenance", data: vehicle }, 201);
  }

  // 7. Review: POST /bookings/:id/review
  if (route[0] === "bookings" && route[2] === "review") {
    return jsonResponse({ success: true, message: "Review submitted successfully" }, 201);
  }

  return jsonResponse({ message: `Route POST /api/v1/${path} not found` }, 404);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const { route } = await params;
  const path = route.join("/");
  const body = await request.json().catch(() => ({}));

  // 1. Update Booking Status: PATCH /bookings/:id/status
  if (route[0] === "bookings" && route[2] === "status") {
    const bookingId = route[1];
    const booking = serverStore.bookings.find((b) => b.id === bookingId);
    if (!booking) return jsonResponse({ message: "Booking not found" }, 404);

    const allowedTransitions = VALID_STATUS_TRANSITIONS[booking.status] || [];
    if (!allowedTransitions.includes(body.status)) {
      return jsonResponse(
        { message: `Invalid status transition from ${booking.status} to ${body.status}. Allowed next states: ${allowedTransitions.join(", ") || "none"}` },
        400
      );
    }

    if (body.status === "REJECTED" && (!body.reason && !body.rejectionReason)) {
      return jsonResponse({ message: "A rejection reason is required when declining a booking request" }, 400);
    }

    booking.status = body.status;
    if (body.reason || body.rejectionReason) booking.rejectionReason = body.reason || body.rejectionReason;
    if (body.reason || body.cancellationReason) booking.cancellationReason = body.reason || body.cancellationReason;
    // Payment status remains decoupled from rental status (do not set PAID on ACTIVE)

    return jsonResponse({
      success: true,
      message: `Booking status updated to ${body.status}`,
      data: {
        ...booking,
        customer: sanitizeCustomer(serverStore.users.find((u) => u.id === booking.customerId)),
      },
    });
  }

  // 2. Admin User Status: PATCH /admin/users/:id/status
  if (route[0] === "admin" && route[1] === "users" && route[3] === "status") {
    const userId = route[2];
    const user = serverStore.users.find((u) => u.id === userId);
    if (!user) return jsonResponse({ message: "User not found" }, 404);
    user.isActive = body.isActive !== undefined ? body.isActive : !user.isActive;
    return jsonResponse({ success: true, message: "User status updated", data: user });
  }

  // 3. Admin Agency Approval: PATCH /admin/agencies/:id/approval
  if (route[0] === "admin" && route[1] === "agencies" && route[3] === "approval") {
    const agencyId = route[2];
    const agency = serverStore.agencies.find((a) => a.id === agencyId);
    if (!agency) return jsonResponse({ message: "Agency not found" }, 404);
    agency.isApproved = body.isApproved;
    return jsonResponse({ success: true, message: "Agency approval updated", data: agency });
  }

  // 4. Vehicle Approval: PATCH /vehicles/:id/approval
  if (route[0] === "vehicles" && route[2] === "approval") {
    const vehicleId = route[1];
    const vehicle = serverStore.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return jsonResponse({ message: "Vehicle not found" }, 404);
    vehicle.approvalStatus = body.approvalStatus || (body.isApproved ? "APPROVED" : "REJECTED");
    return jsonResponse({ success: true, message: "Vehicle approval status updated", data: vehicle });
  }

  // 5. Vehicle Status: PATCH /vehicles/:id/status
  if (route[0] === "vehicles" && route[2] === "status") {
    const vehicleId = route[1];
    const vehicle = serverStore.vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return jsonResponse({ message: "Vehicle not found" }, 404);
    vehicle.status = body.status;
    return jsonResponse({ success: true, message: "Vehicle status updated", data: vehicle });
  }

  return jsonResponse({ message: `Route PATCH /api/v1/${path} not found` }, 404);
}
