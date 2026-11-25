"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { apiRequest } from "../../../lib/api";
import { formatCurrency, formatDate, getStatusBadge } from "../../../lib/utils";
import { Button } from "../../../components/ui/Button";
import { Dialog } from "../../../components/ui/Dialog";
import {
  Shield,
  TrendingUp,
  Percent,
  Users,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Car,
  Bike,
  Activity,
  Check,
  Ban,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  FileCheck2,
  RefreshCw,
  Wrench,
  Clock,
  MapPin,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { AuditLogItem } from "../../../types";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  const [analytics, setAnalytics] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [agenciesList, setAgenciesList] = useState<any[]>([]);
  const [vehiclesList, setVehiclesList] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [panelErrors, setPanelErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active tab: "ANALYTICS" | "APPROVALS" | "AGENCIES" | "USERS" | "ALL_BOOKINGS" | "AUDIT_LOGS"
  const [activeTab, setActiveTab] = useState<string>("ANALYTICS");

  // Search & Filter States
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [agencySearch, setAgencySearch] = useState("");

  // Rejection modal
  const [rejectVehicleId, setRejectVehicleId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Dispute Override Modal
  const [overrideBooking, setOverrideBooking] = useState<any | null>(null);
  const [overrideStatus, setOverrideStatus] = useState("COMPLETED");
  const [overridePaymentStatus, setOverridePaymentStatus] = useState("PAID");
  const [overrideReason, setOverrideReason] = useState("Administrative conflict resolution per customer dispute investigation.");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Agency Suspension Modal
  const [suspendAgencyId, setSuspendAgencyId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("Pending tax compliance audit or license renewal verification.");

  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setPanelErrors([]);
    const [analyticsRes, usersRes, agenciesRes, vehiclesRes, bookingsRes, auditRes, healthRes] =
      await Promise.allSettled([
        apiRequest("/admin/analytics", { requiresAuth: true }),
        apiRequest("/admin/users", { requiresAuth: true }),
        apiRequest("/admin/agencies", { requiresAuth: true }),
        apiRequest("/admin/vehicles", { requiresAuth: true }),
        apiRequest("/bookings/all", { requiresAuth: true }),
        apiRequest("/admin/audit-logs", { requiresAuth: true }),
        apiRequest("/admin/health", { requiresAuth: true }),
      ]);

    const errors: string[] = [];
    if (analyticsRes.status === "fulfilled") {
      setAnalytics(analyticsRes.value);
    } else {
      errors.push("Analytics");
    }
    if (usersRes.status === "fulfilled") {
      setUsersList(Array.isArray(usersRes.value) ? usersRes.value : []);
    } else {
      errors.push("Users");
    }
    if (agenciesRes.status === "fulfilled") {
      setAgenciesList(Array.isArray(agenciesRes.value) ? agenciesRes.value : []);
    } else {
      errors.push("Agencies");
    }
    if (vehiclesRes.status === "fulfilled") {
      setVehiclesList(Array.isArray(vehiclesRes.value) ? vehiclesRes.value : []);
    } else {
      errors.push("Vehicles");
    }
    if (bookingsRes.status === "fulfilled") {
      setAllBookings(Array.isArray(bookingsRes.value) ? bookingsRes.value : []);
    } else {
      errors.push("Bookings");
    }
    if (auditRes.status === "fulfilled") {
      setAuditLogs(Array.isArray(auditRes.value) ? auditRes.value : []);
    } else {
      errors.push("Audit Logs");
    }
    if (healthRes.status === "fulfilled") {
      setHealthData(healthRes.value);
    } else {
      setHealthData({ status: "Unavailable", error: "Health probe failed" });
      errors.push("Health Monitoring");
    }

    setPanelErrors(errors);
    setLastRefreshed(new Date().toLocaleTimeString("en-IN"));
    setIsLoading(false);
  };

  useEffect(() => {
    if (isInitialized && (!user || user.role !== "ADMIN")) {
      toast.error("Access denied: Platform Administrator privileges required");
      router.push("/login");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, isInitialized]);

  // Handle Approve or Reject Vehicle Listing
  const handleApproveVehicle = async (vehicleId: string, status: "APPROVED" | "REJECTED", reason?: string) => {
    try {
      await apiRequest(`/vehicles/${vehicleId}/approval`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({ approvalStatus: status, rejectionReason: reason }),
      });

      toast.success(`Vehicle listing ${status.toLowerCase()}!`);
      setRejectVehicleId(null);
      setRejectReason("");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update vehicle approval status");
    }
  };

  // Handle Toggle User Status (Activate/Deactivate)
  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    try {
      await apiRequest(`/admin/users/${userId}/status`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({ isActive: !currentActive }),
      });

      toast.success(`User account ${!currentActive ? "activated" : "deactivated"}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle user status");
    }
  };

  // Handle Toggle Agency Approval
  const handleToggleAgencyApproval = async (agencyId: string, currentApproved: boolean) => {
    try {
      await apiRequest(`/admin/agencies/${agencyId}/approval`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({ isApproved: !currentApproved }),
      });

      toast.success(`Agency ${!currentApproved ? "verified & approved" : "suspended"}`);
      setSuspendAgencyId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle agency approval");
    }
  };

  // Handle Dispute Override
  const handleConfirmDisputeOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideBooking) return;

    setIsSubmittingOverride(true);
    try {
      await apiRequest(`/admin/bookings/${overrideBooking.id}/override`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({
          status: overrideStatus,
          paymentStatus: overridePaymentStatus,
          reason: overrideReason,
        }),
      });

      toast.success(`Booking #${overrideBooking.bookingNumber} dispute resolved.`);
      setOverrideBooking(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to override booking status");
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Export CSV Audit Report
  const handleExportCSV = () => {
    if (allBookings.length === 0) {
      toast.error("No booking records available to export");
      return;
    }

    const headers = [
      "Booking Number",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Vehicle",
      "Vehicle Plate",
      "Start Date",
      "End Date",
      "Days",
      "Base Price (INR)",
      "GST Tax (INR)",
      "Security Deposit (INR)",
      "Total Amount (INR)",
      "Rental Status",
      "Payment Status",
      "Pickup Location",
    ];

    const rows = allBookings.map((b) => [
      `"${b.bookingNumber}"`,
      `"${b.customer?.firstName || ""} ${b.customer?.lastName || ""}"`,
      `"${b.customer?.email || ""}"`,
      `"${b.customer?.phone || ""}"`,
      `"${b.vehicle?.brand || ""} ${b.vehicle?.model || ""}"`,
      `"${b.vehicle?.vehicleNumber || ""}"`,
      `"${b.startDate}"`,
      `"${b.endDate}"`,
      b.totalDays || 1,
      b.basePrice || 0,
      b.taxAmount || 0,
      b.securityDeposit || 0,
      b.totalAmount || 0,
      `"${b.status}"`,
      `"${b.paymentStatus}"`,
      `"${b.pickupLocation || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `rentigo_audit_revenue_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Platform audit and revenue report downloaded as CSV!");
  };

  const pendingVehicles = vehiclesList.filter((v) => v.approvalStatus === "PENDING");

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchSearch =
        u.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.lastName.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [usersList, userSearch, userRoleFilter]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return allBookings.filter((b) => {
      const matchSearch =
        b.bookingNumber.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        (b.customer?.firstName && b.customer.firstName.toLowerCase().includes(bookingSearch.toLowerCase())) ||
        (b.customer?.lastName && b.customer.lastName.toLowerCase().includes(bookingSearch.toLowerCase())) ||
        (b.vehicle?.brand && b.vehicle.brand.toLowerCase().includes(bookingSearch.toLowerCase())) ||
        (b.vehicle?.model && b.vehicle.model.toLowerCase().includes(bookingSearch.toLowerCase()));
      const matchStatus = bookingStatusFilter === "ALL" || b.status === bookingStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [allBookings, bookingSearch, bookingStatusFilter]);

  // Filtered Agencies
  const filteredAgencies = useMemo(() => {
    return agenciesList.filter((a) => {
      return (
        a.name.toLowerCase().includes(agencySearch.toLowerCase()) ||
        a.city.toLowerCase().includes(agencySearch.toLowerCase()) ||
        a.contactPhone.toLowerCase().includes(agencySearch.toLowerCase())
      );
    });
  }, [agenciesList, agencySearch]);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
                  System Administration Command
                </h1>
                <span className="rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                  Global Oversight
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Executive financial telemetry, vehicle listing review, partner agency verifications, dispute mediation, and audit trail.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs font-semibold border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Download className="h-4 w-4 mr-1.5 text-blue-600" />
            <span>Export CSV Report</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={isLoading}
            className="text-xs h-8 font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            <span>Refresh Telemetry</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Fleet Utilization</span>
            <Percent className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600">
            {analytics?.kpis?.utilizationRate !== undefined ? `${analytics.kpis.utilizationRate}%` : "—"}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Active rentals / Total fleet</div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Booking Conversion</span>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">
            {analytics?.kpis?.conversionRate !== undefined ? `${analytics.kpis.conversionRate}%` : "—"}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Confirmed / Total requests</div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4.5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Conflict Guarantee</span>
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {analytics?.kpis?.conflictRate !== undefined ? `${analytics.kpis.conflictRate}%` : "0.0%"}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Zero Double Bookings</div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Platform Users</span>
            <Users className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {analytics?.overview?.totalUsers ?? usersList.length}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">
            {analytics?.overview?.totalAgencies ?? agenciesList.length} verified agencies
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4.5 shadow-sm dark:border-gray-800 dark:bg-gray-900 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Gross Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {analytics?.overview?.totalRevenue !== undefined
              ? formatCurrency(analytics.overview.totalRevenue)
              : "—"}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">System-wide rental volume</div>
        </div>
      </div>

      {/* Navigation Segment Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("ANALYTICS")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "ANALYTICS"
              ? "bg-purple-700 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Executive Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab("APPROVALS")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "APPROVALS"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Car className="h-4 w-4" />
          <span>Vehicle Listing Approvals</span>
          {pendingVehicles.length > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                activeTab === "APPROVALS" ? "bg-white text-amber-700" : "bg-amber-500 text-white"
              }`}
            >
              {pendingVehicles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("AGENCIES")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "AGENCIES"
              ? "bg-purple-700 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Rental Agencies ({agenciesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("USERS")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "USERS"
              ? "bg-purple-700 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Accounts ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ALL_BOOKINGS")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "ALL_BOOKINGS"
              ? "bg-purple-700 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Global Bookings ({allBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("AUDIT_LOGS")}
          className={`flex items-center gap-2 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap rounded-lg ${
            activeTab === "AUDIT_LOGS"
              ? "bg-purple-700 text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Platform Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* Error Banner if any telemetry panel failed */}
      {panelErrors.length > 0 && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/80 dark:border-red-900/50 dark:bg-red-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-red-800 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              Unable to refresh: <strong>{panelErrors.join(", ")}</strong>. Displayed figures reflect the last available response.
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={fetchData} className="text-xs border-red-300 text-red-700 hover:bg-red-100">
            Retry Load
          </Button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: EXECUTIVE TELEMETRY & REPORTING */}
      {/* ========================================================= */}
      {activeTab === "ANALYTICS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue By Vehicle Category */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Revenue By Vehicle Category
                </h3>
                <span className="text-xs text-gray-400">All Indian Markets</span>
              </div>

              {(() => {
                const fourRev = analytics?.revenueBreakdown?.fourWheelerRevenue || 0;
                const twoRev = analytics?.revenueBreakdown?.twoWheelerRevenue || 0;
                const tot = fourRev + twoRev;
                const fourPct = tot > 0 ? Math.round((fourRev / tot) * 100) : 0;
                const twoPct = tot > 0 ? Math.round((twoRev / tot) * 100) : 0;

                return (
                  <div className="space-y-4 pt-2">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Car className="h-4 w-4 text-blue-600" />
                          <span>Four-Wheelers (Sedans & SUVs)</span>
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {fourPct}% ({formatCurrency(fourRev)})
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${fourPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Bike className="h-4 w-4 text-emerald-500" />
                          <span>Two-Wheelers (Bikes & Electric Scooters)</span>
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {twoPct}% ({formatCurrency(twoRev)})
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${twoPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Real Backend Health & Diagnostics */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Backend Health & Diagnostics
                </h3>
                {(() => {
                  const st = healthData?.status || (isLoading ? "Checking..." : "Unavailable");
                  const color =
                    st === "Healthy"
                      ? "text-emerald-600"
                      : st === "Degraded"
                      ? "text-amber-600"
                      : "text-red-600";
                  return (
                    <span className={`text-xs font-bold flex items-center gap-1 ${color}`}>
                      {st === "Healthy" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}
                      <span>{st}</span>
                    </span>
                  );
                })()}
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Booking Conflict Detection ({analytics?.kpis?.conflictCount ?? 0} conflicts)
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {analytics?.kpis?.conflictRate !== undefined ? `${analytics.kpis.conflictRate}% rate` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    API Latency / Data Store ({healthData?.database || "—"})
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {healthData?.latencyMs !== undefined ? `${healthData.latencyMs} ms (avg ${healthData.avgLatencyMs ?? healthData.latencyMs} ms)` : "Unavailable"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Uptime & Server Errors
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {healthData?.uptimeSeconds !== undefined
                      ? `${healthData.uptimeSeconds}s uptime • ${healthData.errorCount ?? 0} errors`
                      : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Real Booking & Fleet Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-[10px] font-bold uppercase text-gray-400">Monthly Revenue</div>
              <div className="text-base font-black text-gray-900 dark:text-white mt-1">
                {analytics?.overview?.monthlyRevenue !== undefined ? formatCurrency(analytics.overview.monthlyRevenue) : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-[10px] font-bold uppercase text-gray-400">Active / Completed</div>
              <div className="text-base font-black text-gray-900 dark:text-white mt-1">
                {analytics?.overview?.activeBookings ?? 0} / {analytics?.overview?.completedBookings ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-[10px] font-bold uppercase text-gray-400">Cancelled Bookings</div>
              <div className="text-base font-black text-gray-900 dark:text-white mt-1">
                {analytics?.overview?.cancelledBookings ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-[10px] font-bold uppercase text-gray-400">Total Customers</div>
              <div className="text-base font-black text-gray-900 dark:text-white mt-1">
                {analytics?.overview?.totalCustomers ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-[10px] font-bold uppercase text-gray-400">Available Fleet</div>
              <div className="text-base font-black text-emerald-600 mt-1">
                {analytics?.overview?.availableVehicles ?? 0}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-[10px] font-bold uppercase text-gray-400">Rented Now</div>
              <div className="text-base font-black text-blue-600 mt-1">
                {analytics?.overview?.rentedVehicles ?? 0}
              </div>
            </div>
          </div>

          {/* Real Revenue by Location (Computed from Database Records) */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Revenue & Fleet Distribution by Location
              </h3>
              {lastRefreshed && (
                <span className="text-[11px] text-gray-400">Updated {lastRefreshed}</span>
              )}
            </div>
            {!analytics?.revenueByLocation || analytics.revenueByLocation.length === 0 ? (
              <div className="text-xs text-gray-400 py-4 text-center">
                No location revenue data recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {analytics.revenueByLocation.map((loc: any) => (
                  <div
                    key={loc.city}
                    className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800"
                  >
                    <div className="font-bold text-gray-900 dark:text-white">{loc.city}</div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      {loc.fleetSharePercent}% Fleet • {loc.bookingsCount} bookings •{" "}
                      <strong className="text-emerald-600">{formatCurrency(loc.revenue)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: VEHICLE LISTING APPROVALS QUEUE */}
      {/* ========================================================= */}
      {activeTab === "APPROVALS" && (
        <div className="space-y-4">
          {pendingVehicles.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                All vehicle listings approved!
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                When rental agencies submit new vehicles, they require admin verification before appearing in the public catalog.
              </p>
            </div>
          ) : (
            pendingVehicles.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-amber-900/50 dark:bg-gray-900 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={v.images?.[0]?.url || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80"}
                      alt={v.model}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-gray-900 dark:text-white">
                        {v.brand} {v.model} ({v.year})
                      </h4>
                      <span className="rounded bg-amber-100 dark:bg-amber-950/80 px-2 py-0.2 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                        PENDING APPROVAL
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Agency: <strong className="text-gray-900 dark:text-white">{v.agency?.name || "DriveBliss India"}</strong> • Plate: <strong className="font-mono text-gray-800 dark:text-gray-200">{v.vehicleNumber}</strong> • City: {v.agency?.city || "Bengaluru"}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Daily: <strong>{formatCurrency(v.pricing?.dailyRate || 0)}</strong> | Weekly: <strong>{formatCurrency(v.pricing?.weeklyRate || 0)}</strong> | Deposit: <strong>{formatCurrency(v.pricing?.securityDeposit || 0)}</strong>
                    </div>
                    <div className="text-[11px] text-gray-400 italic max-w-md truncate">
                      {v.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end lg:self-center shrink-0">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectVehicleId(v.id)}
                    className="text-xs font-semibold"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    <span>Decline Listing</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproveVehicle(v.id, "APPROVED")}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    <span>Approve Listing</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: RENTAL AGENCIES DIRECTORY & COMPLIANCE */}
      {/* ========================================================= */}
      {activeTab === "AGENCIES" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search agency name, city, or phone..."
                value={agencySearch}
                onChange={(e) => setAgencySearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="text-xs text-gray-500">
              Showing {filteredAgencies.length} of {agenciesList.length} partner agencies
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-800/60">
                <tr>
                  <th className="p-4">Agency Business</th>
                  <th className="p-4">City / State</th>
                  <th className="p-4">GSTIN & Verification</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {filteredAgencies.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {a.name}
                      </div>
                      <div className="text-[11px] text-gray-400">{a.address}</div>
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">
                      {a.city}, {a.state}
                    </td>
                    <td className="p-4 font-mono text-[11px]">
                      <div className="text-gray-900 dark:text-white font-bold">{a.gstin || "Not Provided"}</div>
                      <div className={a.isApproved ? "text-emerald-600 text-[10px]" : "text-amber-600 text-[10px]"}>
                        {a.isApproved ? "Compliance Verified" : "Pending Verification"}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{a.contactPhone}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                          a.isApproved
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {a.isApproved ? "Verified Partner" : "Suspended"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          if (a.isApproved) {
                            setSuspendAgencyId(a.id);
                          } else {
                            handleToggleAgencyApproval(a.id, false);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                          a.isApproved
                            ? "text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                            : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        }`}
                      >
                        {a.isApproved ? "Suspend Agency" : "Approve & Verify"}
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
      {/* TAB 4: USER ACCOUNTS OVERSIGHT */}
      {/* ========================================================= */}
      {activeTab === "USERS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="rounded-xl border border-gray-200 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="ALL">All Roles</option>
                <option value="CUSTOMER">Customers</option>
                <option value="AGENCY_OWNER">Agency Owners</option>
                <option value="ADMIN">Administrators</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-800/60">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">System Role</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-[11px] text-gray-400">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{u.phone || "—"}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                          u.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {u.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{formatDate(u.createdAt)}</td>
                    <td className="p-4 text-right">
                      {u.role !== "ADMIN" && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                            u.isActive
                              ? "text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                              : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          }`}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
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
      {/* TAB 5: GLOBAL BOOKING OVERSIGHT & DISPUTE RESOLUTION */}
      {/* ========================================================= */}
      {activeTab === "ALL_BOOKINGS" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search booking #, customer, or vehicle..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1" />
                <span>Export CSV</span>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-800/60">
                <tr>
                  <th className="p-4">Booking</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Trip Window</th>
                  <th className="p-4">Total (INR)</th>
                  <th className="p-4">Rental Status</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">
                      #{b.bookingNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {b.customer?.firstName} {b.customer?.lastName}
                      </div>
                      <div className="text-[11px] text-gray-400">{b.customer?.phone || b.customer?.email}</div>
                    </td>
                    <td className="p-4 font-semibold text-gray-900 dark:text-white">
                      {b.vehicle?.brand} {b.vehicle?.model}
                    </td>
                    <td className="p-4 text-gray-500">
                      {formatDate(b.startDate)} &rarr; {formatDate(b.endDate)} ({b.totalDays}d)
                    </td>
                    <td className="p-4 font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(b.totalAmount)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                          b.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOverrideBooking(b);
                          setOverrideStatus(b.status);
                          setOverridePaymentStatus(b.paymentStatus);
                        }}
                        className="text-xs h-7"
                      >
                        <SlidersHorizontal className="h-3 w-3 mr-1 text-purple-600" />
                        <span>Override</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: PLATFORM AUDIT TRAIL */}
      {/* ========================================================= */}
      {activeTab === "AUDIT_LOGS" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 p-4 text-xs text-purple-900 dark:text-purple-300">
            <strong>Immutable Operational Audit Trail:</strong> Consequential platform actions (vehicle approvals, dispute status overrides, key handovers, deposit releases, partner suspensions) are logged with actor identity, timestamp, and audited reason.
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:bg-gray-800/60">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Target Type</th>
                  <th className="p-4">Audited Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="p-4 text-gray-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">
                      {log.actorName}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 font-bold border border-purple-200 dark:border-purple-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 font-semibold">{log.targetType}</td>
                    <td className="p-4 font-sans text-gray-700 dark:text-gray-300 max-w-lg">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: VEHICLE LISTING REJECTION DIALOG */}
      {/* ========================================================= */}
      <Dialog
        isOpen={!!rejectVehicleId}
        onClose={() => setRejectVehicleId(null)}
        title="Decline Vehicle Listing Submission"
        description="Provide feedback to the agency regarding specifications, photos, or documents required before approval."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Feedback / Reason for Rejection
            </label>
            <input
              type="text"
              placeholder="e.g. Higher resolution exterior photos required, verify vehicle RC and insurance..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setRejectVehicleId(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleApproveVehicle(rejectVehicleId!, "REJECTED", rejectReason)}
              className="flex-1 font-bold"
            >
              Confirm Decline
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ========================================================= */}
      {/* MODAL 2: DISPUTE STATUS OVERRIDE */}
      {/* ========================================================= */}
      <Dialog
        isOpen={!!overrideBooking}
        onClose={() => setOverrideBooking(null)}
        title="Administrative Booking Dispute Override"
        description={`Force override status for Booking #${overrideBooking?.bookingNumber}. An audited log will be permanently recorded.`}
        className="max-w-lg"
      >
        {overrideBooking && (
          <form onSubmit={handleConfirmDisputeOverride} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-1">
              <div>Customer: <strong>{overrideBooking.customer?.firstName} {overrideBooking.customer?.lastName}</strong></div>
              <div>Vehicle: <strong>{overrideBooking.vehicle?.brand} {overrideBooking.vehicle?.model}</strong></div>
              <div>Current Rental Status: <span className="font-bold">{overrideBooking.status}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Target Rental Status
                </label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="APPROVED">APPROVED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Target Payment Status
                </label>
                <select
                  value={overridePaymentStatus}
                  onChange={(e) => setOverridePaymentStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="PAID">PAID</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Audited Dispute Reason (Required)
              </label>
              <textarea
                rows={2}
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-800 dark:border-gray-700"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOverrideBooking(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmittingOverride}
                className="flex-1 font-bold bg-purple-700 hover:bg-purple-800 text-white"
              >
                Execute Dispute Override
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
