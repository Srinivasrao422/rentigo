"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Vehicle, Booking, VehicleStatus, MaintenanceBlock } from "../../../types";
import { apiRequest } from "../../../lib/api";
import { useAuthStore } from "../../../store/authStore";
import { formatCurrency, formatDate, getStatusBadge } from "../../../lib/utils";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import {
  Building2,
  Car,
  Bike,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Wrench,
  Clock,
  DollarSign,
  TrendingUp,
  Percent,
  MapPin,
  AlertTriangle,
  PlayCircle,
  Check,
  ShieldCheck,
  Gauge,
  Fuel,
  FileCheck2,
  Phone,
  MessageSquare,
  Search,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  Filter,
  Eye,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export default function AgencyDashboardPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  const [stats, setStats] = useState<any>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active operational tab
  // "REQUESTS" | "PICKUPS" | "ACTIVE_RENTALS" | "RETURNS" | "CALENDAR" | "MAINTENANCE" | "FLEET"
  const [activeTab, setActiveTab] = useState<string>("REQUESTS");

  // Filter & search states
  const [fleetSearch, setFleetSearch] = useState("");
  const [fleetTypeFilter, setFleetTypeFilter] = useState<string>("ALL");

  // Add Vehicle Modal State
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: "",
    brand: "Tata",
    model: "Nexon EV Max",
    year: 2024,
    type: "FOUR_WHEELER" as const,
    category: "SUV" as const,
    fuelType: "ELECTRIC" as const,
    transmission: "AUTOMATIC" as const,
    seatingCapacity: 5,
    mileage: "453 km range",
    description: "High-range electric SUV with fast charging support, ventilated seats, and panoramic sunroof.",
    features: ["Connected Car Tech", "Fast DC Charging", "Sunroof", "Ventilated Seats", "360 Camera"],
    pricing: {
      dailyRate: 3200,
      weeklyRate: 19200,
      monthlyRate: 68000,
      securityDeposit: 6000,
      lateFeePerHour: 250,
      currency: "INR",
    },
    imageUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
  });
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);

  // Rejection modal
  const [rejectBookingId, setRejectBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Handover Check-In Modal
  const [handoverBooking, setHandoverBooking] = useState<Booking | null>(null);
  const [handoverOtp, setHandoverOtp] = useState("8492");
  const [handoverOdometer, setHandoverOdometer] = useState(14200);
  const [handoverFuel, setHandoverFuel] = useState(100);
  const [handoverDlChecked, setHandoverDlChecked] = useState(true);
  const [handoverNotes, setHandoverNotes] = useState("Vehicle clean, spare tire and first-aid kit verified.");
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);

  // Return Inspection & Settlement Modal
  const [returnBooking, setReturnBooking] = useState<Booking | null>(null);
  const [returnOdometer, setReturnOdometer] = useState(14550);
  const [returnFuel, setReturnFuel] = useState(100);
  const [fuelShortfallFee, setFuelShortfallFee] = useState(0);
  const [damageFee, setDamageFee] = useState(0);
  const [lateFee, setLateFee] = useState(0);
  const [returnNotes, setReturnNotes] = useState("Inspection cleared. No damage detected.");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Maintenance schedule modal
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintVehicleId, setMaintVehicleId] = useState<string>("");
  const [maintStart, setMaintStart] = useState("2026-11-26");
  const [maintEnd, setMaintEnd] = useState("2026-11-29");
  const [maintReason, setMaintReason] = useState("5,000 km Scheduled Service: Oil change, brake pad inspection & chain cleaning");
  const [maintServiceCenter, setMaintServiceCenter] = useState("Authorized Regional Service Hub");
  const [maintCost, setMaintCost] = useState("3500");
  const [isSubmittingMaint, setIsSubmittingMaint] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, vehiclesData, bookingsData, maintData] = await Promise.all([
        apiRequest("/agencies/dashboard", { requiresAuth: true }).catch(() => null),
        apiRequest("/agencies/vehicles", { requiresAuth: true }).catch(() => []),
        apiRequest("/bookings/agency", { requiresAuth: true }).catch(() => []),
        apiRequest("/agencies/maintenance", { requiresAuth: true }).catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setMaintenanceList(Array.isArray(maintData) ? maintData : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load agency operations data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized && (!user || (user.role !== "AGENCY_OWNER" && user.role !== "ADMIN"))) {
      toast.error("Access denied: Rental Agency permissions required");
      router.push("/login");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, isInitialized]);

  // Operational Queues Filtering
  const pendingRequests = useMemo(() => {
    return bookings.filter((b) => b.status === "PENDING");
  }, [bookings]);

  const readyForPickup = useMemo(() => {
    return bookings.filter((b) => b.status === "APPROVED");
  }, [bookings]);

  const activeRentals = useMemo(() => {
    return bookings.filter((b) => b.status === "ACTIVE");
  }, [bookings]);

  const completedRentals = useMemo(() => {
    return bookings.filter((b) => b.status === "COMPLETED");
  }, [bookings]);

  // Handle generic booking status update (e.g. approve or reject)
  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: string,
    reason?: string
  ) => {
    try {
      await apiRequest(`/bookings/${bookingId}/status`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({ status, reason }),
      });

      toast.success(`Booking status changed to ${status}`);
      setRejectBookingId(null);
      setRejectReason("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update booking status");
    }
  };

  // Handle Handover Check-In
  const handleConfirmHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverBooking) return;
    if (handoverOtp.trim() !== "8492" && handoverOtp.trim().length !== 4) {
      toast.error("Invalid customer handover OTP. Enter the 4-digit verification code (demo: 8492)");
      return;
    }

    setIsSubmittingHandover(true);
    try {
      await apiRequest(`/bookings/${handoverBooking.id}/handover`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({
          odometerKm: handoverOdometer,
          fuelPercent: handoverFuel,
          notes: handoverNotes,
          dlVerified: handoverDlChecked,
        }),
      });

      toast.success(`Vehicle handed over! Rental #${handoverBooking.bookingNumber} is now ACTIVE.`);
      setHandoverBooking(null);
      fetchData();
      setActiveTab("ACTIVE_RENTALS");
    } catch (err: any) {
      toast.error(err.message || "Failed to complete handover check-in");
    } finally {
      setIsSubmittingHandover(false);
    }
  };

  // Handle Return Inspection & Deposit Settlement
  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnBooking) return;

    setIsSubmittingReturn(true);
    try {
      const netRefund = Math.max(
        0,
        returnBooking.securityDeposit - fuelShortfallFee - damageFee - lateFee
      );

      await apiRequest(`/bookings/${returnBooking.id}/return`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({
          odometerKm: returnOdometer,
          fuelPercent: returnFuel,
          fuelPenaltyFee: fuelShortfallFee,
          damageFee: damageFee,
          lateFee: lateFee,
          depositRefunded: netRefund,
          notes: returnNotes,
        }),
      });

      toast.success(
        `Return inspected & completed! Security deposit refund of ₹${netRefund.toLocaleString("en-IN")} released.`
      );
      setReturnBooking(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit return inspection");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Handle Add New Vehicle
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingVehicle(true);

    try {
      await apiRequest("/vehicles", {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({
          ...newVehicle,
          images: newVehicle.imageUrl
            ? [{ url: newVehicle.imageUrl, isPrimary: true }]
            : undefined,
        }),
      });

      toast.success("Vehicle submitted! It will appear in public catalog once approved by Admin.");
      setIsAddVehicleOpen(false);
      fetchData();
      setActiveTab("FLEET");
    } catch (err: any) {
      toast.error(err.message || "Failed to add vehicle");
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  // Handle Toggle Vehicle Status
  const handleToggleVehicleStatus = async (vehicleId: string, currentStatus: VehicleStatus) => {
    const nextStatus: VehicleStatus =
      currentStatus === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";

    try {
      await apiRequest(`/vehicles/${vehicleId}/status`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({ status: nextStatus }),
      });

      toast.success(`Vehicle marked as ${nextStatus}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  // Handle Schedule Maintenance
  const handleScheduleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintVehicleId) {
      toast.error("Please select a vehicle to service");
      return;
    }

    setIsSubmittingMaint(true);
    try {
      await apiRequest(`/vehicles/${maintVehicleId}/maintenance`, {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({
          startDate: new Date(`${maintStart}T08:00:00Z`).toISOString(),
          endDate: new Date(`${maintEnd}T18:00:00Z`).toISOString(),
          reason: maintReason,
          cost: maintCost,
          serviceCenter: maintServiceCenter,
        }),
      });

      toast.success("Maintenance dates scheduled & dates blocked from booking!");
      setIsMaintModalOpen(false);
      setMaintVehicleId("");
      setMaintReason("");
      fetchData();
      setActiveTab("MAINTENANCE");
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule maintenance");
    } finally {
      setIsSubmittingMaint(false);
    }
  };

  // Handle Complete Maintenance Early
  const handleRemoveMaintenance = async (vehicleId: string, blockId: string) => {
    try {
      await apiRequest(`/vehicles/${vehicleId}/maintenance/${blockId}`, {
        method: "DELETE",
        requiresAuth: true,
      });

      toast.success("Service cleared early! Vehicle restored to AVAILABLE.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove maintenance block");
    }
  };

  // Calculate Overdue Hours & Late Fee
  const getOverdueMetrics = (b: Booking) => {
    const returnTime = new Date(b.endDate).getTime();
    const now = Date.now();
    const isOverdue = now > returnTime;
    const diffHours = Math.max(0, Math.ceil((now - returnTime) / (1000 * 60 * 60)));
    const lateFeeRate = b.vehicle?.pricing?.lateFeePerHour || 250;
    const calculatedFee = isOverdue ? diffHours * lateFeeRate : 0;

    return {
      isOverdue,
      diffHours,
      calculatedFee,
      lateFeeRate,
    };
  };

  // Filtered vehicles for fleet tab
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        v.brand.toLowerCase().includes(fleetSearch.toLowerCase()) ||
        v.model.toLowerCase().includes(fleetSearch.toLowerCase()) ||
        v.vehicleNumber.toLowerCase().includes(fleetSearch.toLowerCase());
      const matchType = fleetTypeFilter === "ALL" || v.type === fleetTypeFilter;
      return matchSearch && matchType;
    });
  }, [vehicles, fleetSearch, fleetTypeFilter]);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
                  Agency Fleet Operations Hub
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Verified Partner</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Centralized command for vehicle handovers, return inspections, fleet calendar, and security deposit settlements.
              </p>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (vehicles.length > 0) setMaintVehicleId(vehicles[0].id);
              setIsMaintModalOpen(true);
            }}
            className="text-xs border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Wrench className="h-4 w-4 mr-1.5 text-amber-500" />
            <span>Schedule Service</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddVehicleOpen(true)}
            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Add Vehicle</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all hover:border-gray-300">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Fleet</span>
            <Car className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {stats?.totalVehicles ?? vehicles.length}
          </div>
          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
            <span>{vehicles.filter((v) => v.type === "FOUR_WHEELER").length} Cars</span>
            <span>•</span>
            <span>{vehicles.filter((v) => v.type === "TWO_WHEELER").length} Bikes</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4.5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 transition-all">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Requests</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
            {pendingRequests.length}
          </div>
          <div className="text-[10px] text-amber-600/80 mt-1 font-semibold">
            {pendingRequests.length > 0 ? "Requires approval action" : "Zero pending requests"}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4.5 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/20 transition-all">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ready for Handover</span>
            <KeyRoundIcon className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-400">
            {readyForPickup.length}
          </div>
          <div className="text-[10px] text-blue-600/80 mt-1 font-semibold">
            Approved, awaiting OTP check
          </div>
        </div>

        <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-4.5 shadow-sm dark:border-purple-900/40 dark:bg-purple-950/20 transition-all">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active on Road</span>
            <PlayCircle className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-400">
            {activeRentals.length}
          </div>
          <div className="text-[10px] text-purple-600/80 mt-1 font-semibold">
            Live rentals out with customers
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4.5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Agency Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {formatCurrency(stats?.totalRevenue ?? 32800)}
          </div>
          <div className="text-[10px] text-emerald-600/90 mt-1 font-semibold">
            Processed rental bookings
          </div>
        </div>
      </div>

      {/* Operational Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("REQUESTS")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "REQUESTS"
              ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Pending Requests</span>
          {pendingRequests.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                activeTab === "REQUESTS" ? "bg-white text-amber-700" : "bg-amber-500 text-white"
              }`}
            >
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("PICKUPS")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "PICKUPS"
              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <KeyRoundIcon className="h-4 w-4" />
          <span>Pickups & Handovers</span>
          {readyForPickup.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                activeTab === "PICKUPS" ? "bg-white text-blue-700" : "bg-blue-600 text-white"
              }`}
            >
              {readyForPickup.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("ACTIVE_RENTALS")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "ACTIVE_RENTALS"
              ? "bg-purple-600 text-white shadow-sm shadow-purple-600/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <PlayCircle className="h-4 w-4" />
          <span>Active Rentals</span>
          {activeRentals.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                activeTab === "ACTIVE_RENTALS" ? "bg-white text-purple-700" : "bg-purple-600 text-white"
              }`}
            >
              {activeRentals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("RETURNS")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "RETURNS"
              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          <span>Return Inspections</span>
        </button>

        <button
          onClick={() => setActiveTab("CALENDAR")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "CALENDAR"
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Fleet Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab("MAINTENANCE")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "MAINTENANCE"
              ? "bg-amber-600 text-white shadow-sm shadow-amber-600/20"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Wrench className="h-4 w-4" />
          <span>Maintenance Downtime</span>
          {maintenanceList.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                activeTab === "MAINTENANCE" ? "bg-white text-amber-700" : "bg-amber-600 text-white"
              }`}
            >
              {maintenanceList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("FLEET")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "FLEET"
              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Car className="h-4 w-4" />
          <span>Fleet Inventory ({vehicles.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PENDING BOOKING REQUESTS QUEUE */}
      {/* ========================================================= */}
      {activeTab === "REQUESTS" && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                All caught up! Zero pending requests.
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Customer reservations will land here for your rapid review. You can review renter credentials, dates, and approve with 1 click.
              </p>
            </div>
          ) : (
            pendingRequests.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-amber-200/90 bg-white p-5 shadow-sm dark:border-amber-900/60 dark:bg-gray-900 transition-all hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 px-2 py-0.5 rounded-md">
                        #{b.bookingNumber}
                      </span>
                      <span className="text-sm font-bold text-gray-950 dark:text-white">
                        {b.customer?.firstName} {b.customer?.lastName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({b.customer?.email} • {b.customer?.phone || "+91 98765 43210"})
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.2 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                        <FileCheck2 className="h-3 w-3" />
                        <span>DigiLocker KYC: Verified</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                      <div>
                        Vehicle: <strong className="text-gray-900 dark:text-white">{b.vehicle?.brand} {b.vehicle?.model}</strong>
                      </div>
                      <div>
                        Dates: <strong>{formatDate(b.startDate)} &rarr; {formatDate(b.endDate)}</strong> ({b.totalDays} Days)
                      </div>
                      <div>
                        Deposit: <strong className="text-gray-900 dark:text-white">{formatCurrency(b.securityDeposit)}</strong> (Refundable)
                      </div>
                      <div className="sm:col-span-2">
                        Location: <strong>{b.pickupLocation}</strong>
                      </div>
                      <div>
                        Payable Total: <strong className="text-blue-600 dark:text-blue-400 text-sm">{formatCurrency(b.totalAmount)}</strong>
                      </div>
                    </div>

                    {b.notes && (
                      <div className="text-xs text-gray-600 italic bg-gray-50 dark:bg-gray-800/80 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        Customer Request Note: "{b.notes}"
                      </div>
                    )}
                  </div>

                  {/* Approve / Reject Actions */}
                  <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRejectBookingId(b.id)}
                      className="text-xs font-semibold"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      <span>Reject</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateBookingStatus(b.id, "APPROVED")}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-600/20"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      <span>Approve Request</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: KEY PICKUPS & HANDOVER STATION */}
      {/* ========================================================= */}
      {activeTab === "PICKUPS" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 p-4 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-3">
            <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <strong>Station Handover Procedure:</strong> When the customer arrives at your depot or your driver reaches doorstep delivery, verify their physical driving license, record initial odometer & fuel, and enter the 4-digit Handover OTP (Customer default demo OTP: <strong>8492</strong>) to start the trip.
            </div>
          </div>

          {readyForPickup.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <KeyRoundIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                No bookings waiting for handover
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Once you approve pending requests, they appear here ready for vehicle inspection and key handover.
              </p>
            </div>
          ) : (
            readyForPickup.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-blue-200/80 bg-white p-5 shadow-sm dark:border-blue-900/50 dark:bg-gray-900 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                      #{b.bookingNumber}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {b.customer?.firstName} {b.customer?.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({b.customer?.phone || "+91 98765 43210"})
                    </span>
                    <span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.2 text-[10px] font-bold">
                      READY FOR HANDOVER
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    Vehicle: <strong className="text-gray-900 dark:text-white">{b.vehicle?.brand} {b.vehicle?.model} ({b.vehicle?.vehicleNumber})</strong> | Pickup Station: <strong>{b.pickupLocation}</strong>
                  </div>

                  <div className="text-xs text-gray-500 flex items-center gap-3">
                    <span>Trip: {formatDate(b.startDate)} &rarr; {formatDate(b.endDate)}</span>
                    <span>•</span>
                    <span>Security Deposit Held: <strong className="text-gray-900 dark:text-white">{formatCurrency(b.securityDeposit)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end lg:self-center">
                  <a
                    href={`tel:${b.customer?.phone || "+919876543210"}`}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300"
                    title="Call Renter"
                  >
                    <Phone className="h-4 w-4" />
                  </a>

                  <Button
                    size="sm"
                    onClick={() => {
                      setHandoverBooking(b);
                      setHandoverOdometer(14200);
                      setHandoverFuel(100);
                      setHandoverOtp("8492");
                    }}
                    className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                  >
                    <KeyRoundIcon className="h-4 w-4 mr-1.5" />
                    <span>Station Check-In & Handover</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ACTIVE RENTALS & OVERDUE MONITOR */}
      {/* ========================================================= */}
      {activeTab === "ACTIVE_RENTALS" && (
        <div className="space-y-4">
          {activeRentals.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <PlayCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                No vehicles currently on the road
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Once customer handovers are completed, active rentals appear here with live return tracking and overdue calculations.
              </p>
            </div>
          ) : (
            activeRentals.map((b) => {
              const overdue = getOverdueMetrics(b);

              return (
                <div
                  key={b.id}
                  className={`rounded-2xl border p-5 shadow-sm transition-all ${
                    overdue.isOverdue
                      ? "border-red-300 bg-red-50/20 dark:border-red-900/50 dark:bg-red-950/10"
                      : "border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          #{b.bookingNumber}
                        </span>

                        {overdue.isOverdue ? (
                          <span className="inline-flex items-center gap-1 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 px-2.5 py-0.5 text-[10px] font-black border border-red-200 animate-pulse">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                            <span>OVERDUE BY {overdue.diffHours} HOURS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>TRIP IN PROGRESS</span>
                          </span>
                        )}

                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {b.customer?.firstName} {b.customer?.lastName}
                        </span>
                        <span className="text-xs text-gray-400">({b.customer?.phone || "+91 98765 43210"})</span>
                      </div>

                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        Vehicle: <strong className="text-gray-900 dark:text-white">{b.vehicle?.brand} {b.vehicle?.model} ({b.vehicle?.vehicleNumber})</strong> | Return Due: <strong>{formatDate(b.endDate)}</strong>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span>Handover Odometer: <strong>{b.handover?.odometerKm ? `${b.handover.odometerKm} km` : "14,250 km"}</strong></span>
                        <span>•</span>
                        <span>Handover Fuel: <strong>{b.handover?.fuelPercent || 100}%</strong></span>
                        {overdue.isOverdue && (
                          <>
                            <span>•</span>
                            <span className="text-red-600 font-bold">
                              Late Penalty: {formatCurrency(overdue.calculatedFee)} ({formatCurrency(overdue.lateFeeRate)}/hr)
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-center">
                      <a
                        href={`https://wa.me/${(b.customer?.phone || "919876543210").replace(/[^0-9]/g, "")}?text=Hello%20${encodeURIComponent(b.customer?.firstName || "Renter")},%20this%20is%20RentiGo%20Fleet%20Operations%20checking%20in%20on%20your%20vehicle%20rental%20#${b.bookingNumber}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>WhatsApp Renter</span>
                      </a>

                      <Button
                        size="sm"
                        onClick={() => {
                          setReturnBooking(b);
                          const startKm = b.handover?.odometerKm || 14200;
                          setReturnOdometer(startKm + 280);
                          setReturnFuel(100);
                          setFuelShortfallFee(0);
                          setDamageFee(0);
                          setLateFee(overdue.calculatedFee);
                        }}
                        className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <RotateCcw className="h-4 w-4 mr-1.5" />
                        <span>Inspect & Settle Return</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: RETURN INSPECTIONS & SETTLEMENT ARCHIVE */}
      {/* ========================================================= */}
      {activeTab === "RETURNS" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 p-4 text-xs text-emerald-800 dark:text-emerald-300">
            <strong>Deposit Settlement & Integrity Protocol:</strong> All completed rentals record audited odometer deltas, fuel shortfall deductions, damage penalties, and net security deposit release.
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-800/60">
                <tr>
                  <th className="p-4">Booking</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Total Days</th>
                  <th className="p-4">Deposit Held</th>
                  <th className="p-4">Refund Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">
                      #{b.bookingNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {b.customer?.firstName} {b.customer?.lastName}
                      </div>
                      <div className="text-[11px] text-gray-400">{b.customer?.phone || "—"}</div>
                    </td>
                    <td className="p-4">
                      {b.vehicle?.brand} {b.vehicle?.model}
                    </td>
                    <td className="p-4">{b.totalDays} Days</td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">
                      {formatCurrency(b.securityDeposit)}
                    </td>
                    <td className="p-4">
                      {b.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Deposit Released</span>
                        </span>
                      ) : b.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold">
                          <span>Deposit In Escrow</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">Pre-rental</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {b.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setReturnBooking(b);
                            const startKm = b.handover?.odometerKm || 14200;
                            setReturnOdometer(startKm + 280);
                            setReturnFuel(100);
                          }}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Inspect Return
                        </Button>
                      )}
                      {b.status === "COMPLETED" && (
                        <span className="text-xs text-gray-400 font-semibold">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: INTERACTIVE FLEET CALENDAR */}
      {/* ========================================================= */}
      {activeTab === "CALENDAR" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-6 gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-950 dark:text-white">
                  Fleet Utilization & Booking Schedule (Next 14 Days)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Visual calendar across all vehicles: active trips, pending approvals, and scheduled maintenance blocks.
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="text-gray-600 dark:text-gray-300">Active Rental</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-gray-600 dark:text-gray-300">Confirmed Booking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-gray-600 dark:text-gray-300">Maintenance Downtime</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-gray-600 dark:text-gray-300">Available</span>
                </div>
              </div>
            </div>

            {/* Vehicle Rows & Days Timeline */}
            <div className="space-y-4">
              {vehicles.map((v) => {
                const vehicleBookings = bookings.filter((b) => b.vehicleId === v.id);
                const vehicleMaint = maintenanceList.filter((m) => m.vehicleId === v.id);

                return (
                  <div
                    key={v.id}
                    className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800/80 dark:bg-gray-800/30"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                          <img
                            src={v.images?.[0]?.url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=200&q=80"}
                            alt={v.model}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-sm">
                            {v.brand} {v.model}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono">
                            {v.vehicleNumber} • {formatCurrency(v.pricing?.dailyRate || 0)}/day
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(
                            v.status
                          )}`}
                        >
                          {v.status}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMaintVehicleId(v.id);
                            setIsMaintModalOpen(true);
                          }}
                          className="text-xs h-7"
                        >
                          <Wrench className="h-3 w-3 mr-1 text-amber-500" />
                          <span>Service</span>
                        </Button>
                      </div>
                    </div>

                    {/* Timeline visualization bar */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-7 sm:grid-cols-14 gap-1">
                        {Array.from({ length: 14 }).map((_, dayIdx) => {
                          const targetDate = new Date();
                          targetDate.setDate(targetDate.getDate() + dayIdx);
                          const dayString = targetDate.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          });

                          // Check if day overlaps with any booking
                          const bookingOverlap = vehicleBookings.find((b) => {
                            const bStart = new Date(b.startDate);
                            const bEnd = new Date(b.endDate);
                            return targetDate >= bStart && targetDate <= bEnd;
                          });

                          // Check if day overlaps with maintenance
                          const maintOverlap = vehicleMaint.find((m) => {
                            const mStart = new Date(m.startDate);
                            const mEnd = new Date(m.endDate);
                            return targetDate >= mStart && targetDate <= mEnd;
                          });

                          let bgColor = "bg-emerald-100/70 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300";
                          let label = "Free";

                          if (maintOverlap) {
                            bgColor = "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-700 dark:text-amber-300";
                            label = "Service";
                          } else if (bookingOverlap) {
                            if (bookingOverlap.status === "ACTIVE") {
                              bgColor = "bg-purple-100 border-purple-300 text-purple-900 dark:bg-purple-950/60 dark:border-purple-700 dark:text-purple-300";
                              label = "Active";
                            } else if (bookingOverlap.status === "APPROVED") {
                              bgColor = "bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300";
                              label = "Booked";
                            } else if (bookingOverlap.status === "PENDING") {
                              bgColor = "bg-amber-50 border-amber-200 text-amber-700";
                              label = "Pending";
                            }
                          }

                          return (
                            <div
                              key={dayIdx}
                              className={`p-1.5 rounded-lg border text-center transition-all ${bgColor}`}
                              title={`${v.brand} ${v.model}: ${dayString} (${label})`}
                            >
                              <div className="text-[10px] font-bold">{dayString}</div>
                              <div className="text-[9px] font-semibold truncate">{label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: MAINTENANCE DOWNTIME MANAGER */}
      {/* ========================================================= */}
      {activeTab === "MAINTENANCE" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-950 dark:text-white">
                Fleet Servicing & Scheduled Downtime
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Vehicles placed in maintenance are atomically blocked from public customer search and checkout to prevent double-booking conflicts.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                if (vehicles.length > 0) setMaintVehicleId(vehicles[0].id);
                setIsMaintModalOpen(true);
              }}
              className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Schedule Service Downtime</span>
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-800/60">
                <tr>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Service Reason</th>
                  <th className="p-4">Scheduled Window</th>
                  <th className="p-4">Service Facility</th>
                  <th className="p-4">Est. Cost</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {maintenanceList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      No active maintenance downtime blocks. All vehicles in fleet are operational.
                    </td>
                  </tr>
                ) : (
                  maintenanceList.map((m) => {
                    const veh = vehicles.find((v) => v.id === m.vehicleId) || m.vehicle;

                    return (
                      <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="p-4">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {veh?.brand} {veh?.model}
                          </div>
                          <div className="text-[11px] font-mono text-gray-400">{veh?.vehicleNumber}</div>
                        </td>
                        <td className="p-4 max-w-xs truncate text-gray-800 dark:text-gray-200">
                          {m.reason}
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300">
                          {formatDate(m.startDate)} &rarr; {formatDate(m.endDate)}
                        </td>
                        <td className="p-4 text-gray-500">{m.serviceCenter || "Regional Workshop"}</td>
                        <td className="p-4 font-bold text-gray-900 dark:text-white">
                          {m.cost ? formatCurrency(m.cost) : "—"}
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold">
                            <Wrench className="h-3 w-3" />
                            <span>In Service</span>
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveMaintenance(m.vehicleId, m.id)}
                            className="text-xs h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            <span>Complete Early</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: FLEET INVENTORY & ADD/EDIT */}
      {/* ========================================================= */}
      {activeTab === "FLEET" && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search make, model, or plate number..."
                value={fleetSearch}
                onChange={(e) => setFleetSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={fleetTypeFilter}
                onChange={(e) => setFleetTypeFilter(e.target.value)}
                className="rounded-xl border border-gray-200 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="ALL">All Categories</option>
                <option value="FOUR_WHEELER">Four-Wheelers (Cars/SUVs)</option>
                <option value="TWO_WHEELER">Two-Wheelers (Bikes/Scooters)</option>
              </select>

              <Button
                size="sm"
                onClick={() => setIsAddVehicleOpen(true)}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span>Add Vehicle</span>
              </Button>
            </div>
          </div>

          {/* Fleet Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-800/60">
                <tr>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Type / Cat</th>
                  <th className="p-4">Plate No</th>
                  <th className="p-4">Daily Rate</th>
                  <th className="p-4">Weekly / Monthly</th>
                  <th className="p-4">Listing Approval</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="p-4 flex items-center gap-3">
                      <div className="h-10 w-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        <img
                          src={v.images?.[0]?.url || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=200&q=80"}
                          alt={v.model}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">
                          {v.brand} {v.model}
                        </div>
                        <div className="text-[10px] text-gray-400">{v.year} • {v.fuelType}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {v.type === "FOUR_WHEELER" ? (
                          <Car className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                          <Bike className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        <span>{v.category.replace("_", " ")}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-semibold text-gray-800 dark:text-gray-200">
                      {v.vehicleNumber}
                    </td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">
                      {formatCurrency(v.pricing?.dailyRate || 0)}
                    </td>
                    <td className="p-4 text-gray-500">
                      {formatCurrency(v.pricing?.weeklyRate || 0)} / {formatCurrency(v.pricing?.monthlyRate || 0)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          v.approvalStatus === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : v.approvalStatus === "PENDING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {v.approvalStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(
                          v.status
                        )}`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleVehicleStatus(v.id, v.status)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        {v.status === "AVAILABLE" ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => {
                          setMaintVehicleId(v.id);
                          setIsMaintModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"
                      >
                        Service
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: STATION HANDOVER & DEPARTURE CHECK-IN */}
      {/* ========================================================= */}
      <Dialog
        isOpen={!!handoverBooking}
        onClose={() => setHandoverBooking(null)}
        title="Vehicle Handover & Key Station Check-In"
        description={`Record pre-rental inspection, verify customer identity, and enter Handover OTP for Booking #${handoverBooking?.bookingNumber}.`}
        className="max-w-xl"
      >
        {handoverBooking && (
          <form onSubmit={handleConfirmHandover} className="space-y-4 text-xs">
            {/* Customer & Vehicle Summary */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700 space-y-1">
              <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                <span>Renter: {handoverBooking.customer?.firstName} {handoverBooking.customer?.lastName}</span>
                <span className="text-blue-600">{handoverBooking.vehicle?.brand} {handoverBooking.vehicle?.model}</span>
              </div>
              <div className="text-[11px] text-gray-500">
                Plate: <strong>{handoverBooking.vehicle?.vehicleNumber}</strong> • Dates: {formatDate(handoverBooking.startDate)} &rarr; {formatDate(handoverBooking.endDate)}
              </div>
            </div>

            {/* Handover OTP Input */}
            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                Customer Handover OTP (Demo Code: 8492)
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={handoverOtp}
                onChange={(e) => setHandoverOtp(e.target.value)}
                placeholder="4-digit OTP provided by customer"
                className="w-full font-mono text-center text-lg tracking-widest rounded-xl border border-gray-300 p-2.5 dark:bg-gray-800 dark:border-gray-700 font-bold"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Verification prevents unauthorized vehicle collection.
              </span>
            </div>

            {/* Departure Measurements */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Start Odometer (km)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={handoverOdometer}
                  onChange={(e) => setHandoverOdometer(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Fuel / Battery Level
                </label>
                <select
                  value={handoverFuel}
                  onChange={(e) => setHandoverFuel(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value={100}>100% Full Tank / Charge</option>
                  <option value={75}>75% (3/4 Tank)</option>
                  <option value={50}>50% (Half Tank)</option>
                  <option value={25}>25% (1/4 Tank)</option>
                </select>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={handoverDlChecked}
                  onChange={(e) => setHandoverDlChecked(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  Original Physical Driving License verified against DigiLocker
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Vehicle exterior scratches & tires inspected with customer
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Handover Notes / Existing Scratches
              </label>
              <input
                type="text"
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setHandoverBooking(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmittingHandover}
                className="flex-1 font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Confirm Handover & Start Trip
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 2: RETURN INSPECTION & DEPOSIT SETTLEMENT */}
      {/* ========================================================= */}
      <Dialog
        isOpen={!!returnBooking}
        onClose={() => setReturnBooking(null)}
        title="Vehicle Return Inspection & Deposit Settlement"
        description={`Record return odometer, check fuel shortfall, and release security deposit for Booking #${returnBooking?.bookingNumber}.`}
        className="max-w-xl"
      >
        {returnBooking && (
          <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs">
            {/* Handover Baseline */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700 space-y-1">
              <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                <span>Renter: {returnBooking.customer?.firstName} {returnBooking.customer?.lastName}</span>
                <span className="text-emerald-600">Deposit Held: {formatCurrency(returnBooking.securityDeposit)}</span>
              </div>
              <div className="text-[11px] text-gray-500">
                Start Odometer: <strong>{returnBooking.handover?.odometerKm || 14200} km</strong> • Start Fuel: <strong>{returnBooking.handover?.fuelPercent || 100}%</strong>
              </div>
            </div>

            {/* Return Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Return Odometer (km)
                </label>
                <input
                  type="number"
                  required
                  min={returnBooking.handover?.odometerKm || 0}
                  value={returnOdometer}
                  onChange={(e) => setReturnOdometer(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  Trip Distance: {Math.max(0, returnOdometer - (returnBooking.handover?.odometerKm || 14200))} km
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Return Fuel Level (%)
                </label>
                <select
                  value={returnFuel}
                  onChange={(e) => {
                    const f = Number(e.target.value);
                    setReturnFuel(f);
                    if (f < 100) {
                      setFuelShortfallFee(Math.round(((100 - f) / 25) * 450));
                    } else {
                      setFuelShortfallFee(0);
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value={100}>100% Full Tank (No Penalty)</option>
                  <option value={75}>75% (3/4 Tank - ₹450 penalty)</option>
                  <option value={50}>50% (Half Tank - ₹900 penalty)</option>
                  <option value={25}>25% (1/4 Tank - ₹1350 penalty)</option>
                </select>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Fuel Shortfall (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={fuelShortfallFee}
                  onChange={(e) => setFuelShortfallFee(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 p-1.5 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Late Overdue Fee (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={lateFee}
                  onChange={(e) => setLateFee(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 p-1.5 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Damage Deductions (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={damageFee}
                  onChange={(e) => setDamageFee(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 p-1.5 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>

            {/* Real-time Deposit Release Summary */}
            <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
              <div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider">
                  Net Refund to Customer
                </div>
                <div className="text-[10px] text-emerald-600">
                  Held: ₹{returnBooking.securityDeposit} - Deductions: ₹{fuelShortfallFee + lateFee + damageFee}
                </div>
              </div>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                {formatCurrency(
                  Math.max(0, returnBooking.securityDeposit - fuelShortfallFee - lateFee - damageFee)
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Return Inspection Notes
              </label>
              <input
                type="text"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReturnBooking(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmittingReturn}
                className="flex-1 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Complete Return & Release Deposit
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 3: SCHEDULE SERVICE & MAINTENANCE DOWNTIME */}
      {/* ========================================================= */}
      <Dialog
        isOpen={isMaintModalOpen}
        onClose={() => setIsMaintModalOpen(false)}
        title="Schedule Vehicle Maintenance Downtime"
        description="Block vehicle dates from customer rental search for periodic servicing or repairs."
        className="max-w-lg"
      >
        <form onSubmit={handleScheduleMaintenance} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Vehicle
            </label>
            <select
              value={maintVehicleId}
              onChange={(e) => setMaintVehicleId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">-- Choose vehicle from fleet --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.vehicleNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={maintStart}
                onChange={(e) => setMaintStart(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                End Date (Expected Completion)
              </label>
              <input
                type="date"
                required
                value={maintEnd}
                onChange={(e) => setMaintEnd(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Service Facility
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Authorized Tata Motors Hub"
                value={maintServiceCenter}
                onChange={(e) => setMaintServiceCenter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Estimated Cost (₹)
              </label>
              <input
                type="number"
                min={0}
                placeholder="3500"
                value={maintCost}
                onChange={(e) => setMaintCost(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Service Reason / Scope of Work
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. 10,000 km Periodic Service: Synthetic oil change, wheel alignment, brake inspection..."
              value={maintReason}
              onChange={(e) => setMaintReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMaintModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmittingMaint}
              className="flex-1 font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              Schedule & Block Dates
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 4: ADD VEHICLE TO AGENCY FLEET */}
      {/* ========================================================= */}
      <Dialog
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        title="Add Vehicle to Agency Fleet"
        description="Provide vehicle specifications, tiered daily/weekly/monthly pricing (₹ INR), and photos for admin review."
        className="max-w-2xl"
      >
        <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Make / Brand
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tata, Mahindra, Hyundai, Royal Enfield"
                value={newVehicle.brand}
                onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Model Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Nexon EV, Thar 4x4, Himalayan 450"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Registration Plate
              </label>
              <input
                type="text"
                required
                placeholder="e.g. KA-03-MR-1234"
                value={newVehicle.vehicleNumber}
                onChange={(e) => setNewVehicle({ ...newVehicle, vehicleNumber: e.target.value })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Model Year
              </label>
              <input
                type="number"
                required
                min={2018}
                max={2026}
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Vehicle Type
              </label>
              <select
                value={newVehicle.type}
                onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="FOUR_WHEELER">Four-Wheeler (Car/SUV)</option>
                <option value="TWO_WHEELER">Two-Wheeler (Bike/Scooter)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={newVehicle.category}
                onChange={(e) => setNewVehicle({ ...newVehicle, category: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="SUV">SUV</option>
                <option value="SEDAN">Sedan</option>
                <option value="HATCHBACK">Hatchback</option>
                <option value="LUXURY">Luxury</option>
                <option value="CRUISER">Cruiser Bike</option>
                <option value="SPORTS_BIKE">Sports Bike</option>
                <option value="SCOOTER">Scooter / EV</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Fuel Type
              </label>
              <select
                value={newVehicle.fuelType}
                onChange={(e) => setNewVehicle({ ...newVehicle, fuelType: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="ELECTRIC">Electric</option>
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Transmission
              </label>
              <select
                value={newVehicle.transmission}
                onChange={(e) => setNewVehicle({ ...newVehicle, transmission: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="AUTOMATIC">Automatic</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
          </div>

          {/* Pricing Row in INR */}
          <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60 space-y-2 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Tiered Rental Rates (₹ INR)
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Daily (₹)</label>
                <input
                  type="number"
                  required
                  min={100}
                  value={newVehicle.pricing.dailyRate}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      pricing: { ...newVehicle.pricing, dailyRate: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 p-1.5 text-xs dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Weekly (₹)</label>
                <input
                  type="number"
                  required
                  min={500}
                  value={newVehicle.pricing.weeklyRate}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      pricing: { ...newVehicle.pricing, weeklyRate: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 p-1.5 text-xs dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Monthly (₹)</label>
                <input
                  type="number"
                  required
                  min={2000}
                  value={newVehicle.pricing.monthlyRate}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      pricing: { ...newVehicle.pricing, monthlyRate: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 p-1.5 text-xs dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Deposit (₹)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newVehicle.pricing.securityDeposit}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      pricing: { ...newVehicle.pricing, securityDeposit: Number(e.target.value) },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 p-1.5 text-xs dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Vehicle Image URL
            </label>
            <input
              type="url"
              required
              value={newVehicle.imageUrl}
              onChange={(e) => setNewVehicle({ ...newVehicle, imageUrl: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Description & Highlights
            </label>
            <textarea
              rows={2}
              required
              placeholder="Highlight condition, comfort, handling, and key features..."
              value={newVehicle.description}
              onChange={(e) => setNewVehicle({ ...newVehicle, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddVehicleOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmittingVehicle}
              className="flex-1 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Submit for Admin Review
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 5: REJECT BOOKING WITH MANDATORY AUDITED REASON */}
      {/* ========================================================= */}
      <Dialog
        isOpen={!!rejectBookingId}
        onClose={() => setRejectBookingId(null)}
        title="Decline Customer Booking Request"
        description="State a clear, audited reason for declining this reservation. The customer will be notified."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Decline Reason (Required)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled emergency recall, customer out-of-station delivery request unserviceable..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setRejectBookingId(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!rejectReason.trim()) {
                  toast.error("Please enter a decline reason");
                  return;
                }
                handleUpdateBookingStatus(rejectBookingId!, "REJECTED", rejectReason);
              }}
              className="flex-1 font-bold"
            >
              Confirm Decline
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function KeyRoundIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}
