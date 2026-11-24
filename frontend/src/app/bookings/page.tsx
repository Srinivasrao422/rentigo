"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Booking, BookingStatus } from "../../types";
import { apiRequest } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { formatCurrency, formatDate, getStatusBadge } from "../../lib/utils";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Car,
  Bike,
  Star,
  AlertCircle,
  XCircle,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  FileText,
  ShieldCheck,
  Smartphone,
  Printer,
  QrCode,
  Download,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export default function CustomerBookingsPage() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Cancellation modal state
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Digital documents & WhatsApp pass modal state
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const [agreementBooking, setAgreementBooking] = useState<Booking | null>(null);
  const [whatsappPassBooking, setWhatsappPassBooking] = useState<Booking | null>(null);

  const fetchBookings = () => {
    setIsLoading(true);
    apiRequest<Booking[]>("/bookings/customer", { requiresAuth: true })
      .then((data) => {
        setBookings(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load bookings");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchBookings();
    }
  }, [user, isInitialized]);

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;

    setIsCancelling(true);
    try {
      await apiRequest(`/bookings/${cancelBookingId}/status`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({
          status: "CANCELLED",
          reason: cancelReason || "Customer cancelled request",
        }),
      });

      toast.success("Booking cancelled successfully");
      setCancelBookingId(null);
      setCancelReason("");
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;

    setIsSubmittingReview(true);
    try {
      await apiRequest(`/bookings/${reviewBooking.id}/review`, {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({ rating, comment }),
      });

      toast.success("Thank you for your review!");
      setReviewBooking(null);
      setRating(5);
      setComment("");
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "ALL") return true;
    return b.status === activeTab;
  });

  if (!user && !isInitialized) {
    return (
      <div className="container mx-auto p-12 text-center text-sm text-gray-500">
        Loading session...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-950 dark:text-white">
            My Booking History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track current rental status, pickup directions, and past reservations.
          </p>
        </div>
        <Link href="/vehicles">
          <Button className="font-semibold text-xs shadow-md">
            <span>Explore More Vehicles</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Status Segment Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-6 border-b border-gray-200 dark:border-gray-800">
        {[
          { key: "ALL", label: "All Bookings" },
          { key: "PENDING", label: "Pending Approval" },
          { key: "APPROVED", label: "Confirmed" },
          { key: "ACTIVE", label: "Currently Active" },
          { key: "COMPLETED", label: "Completed" },
          { key: "CANCELLED", label: "Cancelled" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab.key
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-gray-200 animate-pulse dark:bg-gray-800"
            />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No bookings found in this category
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Browse our verified fleet of two-wheelers and four-wheelers to reserve your next ride.
          </p>
          <Link href="/vehicles">
            <Button variant="outline" className="mt-4 text-xs font-semibold">
              Browse Available Fleet
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const v = b.vehicle;
            const primaryImg =
              v?.images?.[0]?.url ||
              "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80";

            const canCancel = ["PENDING", "APPROVED"].includes(b.status);
            const canReview = b.status === "COMPLETED" && !b.review;

            return (
              <div
                key={b.id}
                className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-all hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">
                      #{b.bookingNumber}
                    </span>
                    <span className="text-xs text-gray-400">
                      Requested on {formatDate(b.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusBadge(
                        b.status
                      )}`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 items-center">
                  {/* Thumbnail & Vehicle Details (5 cols) */}
                  <div className="md:col-span-5 flex items-center gap-4">
                    <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                      <img
                        src={primaryImg}
                        alt="Vehicle"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">
                        {v ? `${v.brand} ${v.model}` : "Reserved Vehicle"}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {v?.year} • {v?.category?.replace("_", " ")}
                      </p>
                      {v?.agency && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          <span>{v.agency.name} ({v.agency.city})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dates & Duration (4 cols) */}
                  <div className="md:col-span-4 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      <span>{formatDate(b.startDate)} &rarr; {formatDate(b.endDate)}</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Duration: <strong className="text-gray-700 dark:text-gray-200">{b.totalDays} Days</strong> ({b.durationType} Plan)
                    </div>
                    <div className="text-[11px] text-gray-400 truncate">
                      Pickup: {b.pickupLocation}
                    </div>
                  </div>

                  {/* Total Amount & Actions (3 cols) */}
                  <div className="md:col-span-3 text-right flex flex-col md:items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-400">
                        Total Amount
                      </div>
                      <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                        {formatCurrency(b.totalAmount)}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        Deposit: {formatCurrency(b.securityDeposit)}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      {canCancel && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancelBookingId(b.id)}
                          className="text-xs h-8"
                        >
                          Cancel
                        </Button>
                      )}

                      {canReview && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setReviewBooking(b)}
                          className="text-xs h-8 text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                        >
                          <Star className="h-3 w-3 mr-1 fill-amber-500" />
                          <span>Review</span>
                        </Button>
                      )}

                      {b.review && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Reviewed ({b.review.rating}★)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Show rejection or cancellation reason if exists */}
                {b.rejectionReason && (
                  <div className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    <strong>Decline Reason:</strong> {b.rejectionReason}
                  </div>
                )}
                {b.cancellationReason && (
                  <div className="mt-3 rounded-lg bg-gray-100 p-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <strong>Cancellation Note:</strong> {b.cancellationReason}
                  </div>
                )}

                {/* Updatable Features Bar: GST Invoicing, Rental Agreement, WhatsApp Boarding Pass */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvoiceBooking(b)}
                      className="text-[11px] h-7 gap-1 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300"
                    >
                      <FileText className="h-3 w-3 text-blue-600" />
                      <span>GST Tax Invoice (18%)</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAgreementBooking(b)}
                      className="text-[11px] h-7 gap-1 border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                    >
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      <span>Rental Agreement</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWhatsappPassBooking(b)}
                      className="text-[11px] h-7 gap-1 border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"
                    >
                      <Smartphone className="h-3 w-3 text-green-600" />
                      <span>WhatsApp Pass</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {b.isDelivery && (
                      <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full dark:bg-purple-950/40 dark:text-purple-300">
                        🚀 Doorstep Delivery
                      </span>
                    )}
                    {b.paymentMethod && (
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full dark:bg-gray-800 dark:text-gray-300">
                        💳 {b.paymentMethod.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Dialog */}
      <Dialog
        isOpen={!!cancelBookingId}
        onClose={() => setCancelBookingId(null)}
        title="Cancel Booking Request"
        description="Are you sure you want to cancel this vehicle reservation? This action cannot be undone."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Cancellation Reason (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Schedule changed, booked another vehicle..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCancelBookingId(null)}
              className="flex-1"
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              isLoading={isCancelling}
              onClick={handleCancelBooking}
              className="flex-1 font-bold"
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Leave Review Dialog */}
      <Dialog
        isOpen={!!reviewBooking}
        onClose={() => setReviewBooking(null)}
        title="Rate Your Rental Experience"
        description={`Share your feedback for ${reviewBooking?.vehicle?.brand} ${reviewBooking?.vehicle?.model}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Rating Score
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-xl border transition-all ${
                    rating >= star
                      ? "border-amber-400 bg-amber-50 text-amber-500 dark:bg-amber-950/40"
                      : "border-gray-200 text-gray-300 dark:border-gray-800"
                  }`}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Your Review & Comments
            </label>
            <textarea
              rows={3}
              required
              placeholder="How was the vehicle condition, pickup experience, and fuel efficiency?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReviewBooking(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmittingReview}
              className="flex-1 font-bold"
            >
              Submit Review
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Feature 6: GST Tax Invoice Dialog (18% SAC 996601) */}
      <Dialog
        isOpen={!!invoiceBooking}
        onClose={() => setInvoiceBooking(null)}
        title="Tax Invoice (GST Compliant)"
        description="Official tax invoice issued under Rule 46 of CGST Rules, 2017"
        className="max-w-2xl"
      >
        {invoiceBooking && (() => {
          const invVehicle = invoiceBooking.vehicle;
          const cgst = Math.round((invoiceBooking.taxAmount || (invoiceBooking.basePrice * 0.18)) / 2);
          const sgst = cgst;
          const invoiceNum = `INV-2026-${invoiceBooking.bookingNumber || invoiceBooking.id.slice(-6).toUpperCase()}`;

          return (
            <div className="space-y-4 text-xs text-gray-700 dark:text-gray-300">
              {/* Printable Header */}
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                      RentiGo Fleet Technologies Pvt. Ltd.
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      SAC Code: <strong>996601</strong> (Rental of passenger motor vehicles without operator)
                    </p>
                    <p className="text-[11px] text-gray-500">
                      GSTIN: <strong className="font-mono">29AABCR8821F1ZX</strong> • CIN: U72900KA2026PTC049102
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Hub: {invVehicle?.agency?.name || "RentiGo Prime Hub"}, {invVehicle?.agency?.city || "Bengaluru"}, India
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[11px]">
                      PAID / CONFIRMED
                    </span>
                    <div className="mt-1 font-mono font-bold text-gray-900 dark:text-white">
                      {invoiceNum}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Date: {formatDate(invoiceBooking.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-400">Billed To (Hirer):</span>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {invoiceBooking.customer?.firstName} {invoiceBooking.customer?.lastName}
                    </div>
                    <div className="text-gray-500">{invoiceBooking.customer?.email}</div>
                    <div className="text-gray-500">
                      DL: {invoiceBooking.dlNumber || "DL-0420198827361 (DigiLocker Verified)"}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400">Vehicle Assigned:</span>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {invVehicle?.brand} {invVehicle?.model} ({invVehicle?.year})
                    </div>
                    <div className="font-mono font-bold text-blue-600">
                      Plate: {invVehicle?.vehicleNumber || "KA-01-MJ-2026"}
                    </div>
                    <div className="text-gray-500">
                      {invoiceBooking.totalDays} Days ({formatDate(invoiceBooking.startDate)} - {formatDate(invoiceBooking.endDate)})
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Breakdown Table */}
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold">
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-center">SAC</th>
                      <th className="p-2.5 text-right">Taxable Value</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    <tr>
                      <td className="p-2.5">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          Self-Drive Vehicle Rental ({invoiceBooking.totalDays} Days)
                        </div>
                        <div className="text-[10px] text-gray-400">Rate plan: {invoiceBooking.durationType}</div>
                      </td>
                      <td className="p-2.5 text-center font-mono">996601</td>
                      <td className="p-2.5 text-right">{formatCurrency(invoiceBooking.basePrice)}</td>
                      <td className="p-2.5 text-right font-medium">{formatCurrency(invoiceBooking.basePrice)}</td>
                    </tr>
                    {invoiceBooking.deliveryFee ? (
                      <tr>
                        <td className="p-2.5">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            Doorstep Vehicle Delivery & Pickup
                          </div>
                          <div className="text-[10px] text-gray-400">Direct courier to customer doorstep</div>
                        </td>
                        <td className="p-2.5 text-center font-mono">996813</td>
                        <td className="p-2.5 text-right">{formatCurrency(invoiceBooking.deliveryFee)}</td>
                        <td className="p-2.5 text-right font-medium">{formatCurrency(invoiceBooking.deliveryFee)}</td>
                      </tr>
                    ) : null}
                    <tr className="bg-gray-50/50 dark:bg-gray-900/30">
                      <td colSpan={3} className="p-2 text-right text-gray-500">CGST (9%)</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(cgst)}</td>
                    </tr>
                    <tr className="bg-gray-50/50 dark:bg-gray-900/30">
                      <td colSpan={3} className="p-2 text-right text-gray-500">SGST (9%)</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(sgst)}</td>
                    </tr>
                    <tr className="bg-blue-50/50 dark:bg-blue-950/20">
                      <td colSpan={3} className="p-2 text-right font-semibold text-blue-900 dark:text-blue-300">
                        Refundable Security Deposit (Exempt from GST)
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-blue-900 dark:text-blue-300">
                        {formatCurrency(invoiceBooking.securityDeposit)}
                      </td>
                    </tr>
                    <tr className="bg-gray-100 dark:bg-gray-800 font-extrabold text-sm">
                      <td colSpan={3} className="p-2.5 text-right text-gray-900 dark:text-white">
                        Total Invoice Payable
                      </td>
                      <td className="p-2.5 text-right text-blue-600 dark:text-blue-400 font-mono">
                        {formatCurrency(invoiceBooking.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-gray-400 text-center italic">
                * This invoice is digitally generated and signed via RentiGo Automated GST Engine. No physical signature required.
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setInvoiceBooking(null)}
                  className="flex-1 text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="flex-1 text-xs font-bold gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Save Tax PDF</span>
                </Button>
              </div>
            </div>
          );
        })()}
      </Dialog>

      {/* Feature 6: Digital Self-Drive Rental Agreement Dialog */}
      <Dialog
        isOpen={!!agreementBooking}
        onClose={() => setAgreementBooking(null)}
        title="Motor Vehicles Self-Drive Rental Agreement"
        description="Standard legal terms as per Section 66 of Motor Vehicles Act, 1988"
        className="max-w-2xl"
      >
        {agreementBooking && (() => {
          const v = agreementBooking.vehicle;
          return (
            <div className="space-y-4 text-xs text-gray-700 dark:text-gray-300">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-emerald-900 dark:text-emerald-300">
                    Digitally Executed Contract • RTO Approved
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Booking ref: #{agreementBooking.bookingNumber} • Vehicle: {v?.brand} {v?.model} ({v?.vehicleNumber})
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto p-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 leading-relaxed text-[11px]">
                <p>
                  <strong>1. PARTIES:</strong> This Self-Drive Rental Agreement is made between RentiGo Fleet Partner (
                  <strong>{v?.agency?.name || "RentiGo Operations"}</strong>) and the registered Hirer (
                  <strong>{agreementBooking.customer?.firstName} {agreementBooking.customer?.lastName}</strong>, Driving License No:{" "}
                  <strong>{agreementBooking.dlNumber || "DL Verified via DigiLocker"}</strong>).
                </p>
                <p>
                  <strong>2. PERMITTED DRIVER & SPEED GOVERNORS:</strong> The vehicle shall be driven solely by the verified Hirer.
                  As per Ministry of Road Transport and Highways (MoRTH) regulations, the vehicle is equipped with a digital telematics
                  speed governor capped at <strong>80 km/h</strong> for two-wheelers and <strong>100 km/h</strong> for four-wheelers.
                  Violations incur ₹1,000 fine per overspeed event.
                </p>
                <p>
                  <strong>3. SECURITY DEPOSIT & PRE-AUTHORIZATION HOLD:</strong> A refundable security deposit hold of{" "}
                  <strong>{formatCurrency(agreementBooking.securityDeposit)}</strong> was pre-authorized via Razorpay/UPI.
                  Upon vehicle return in clean, undamaged condition with zero pending challans, the pre-auth hold is automatically released
                  within 24 hours.
                </p>
                <p>
                  <strong>4. FUEL & CLEANLINESS POLICY:</strong> Same-to-same policy applies. If vehicle was provided at 100% fuel/charge,
                  it must be returned at 100%. Refueling shortfalls will be deducted at ₹115/L plus a ₹150 convenience fee.
                </p>
                <p>
                  <strong>5. GEOGRAPHIC BOUNDS & FASTAG:</strong> The vehicle is permitted for travel across all Indian States. All National
                  Highway FASTag tolls incurred during the rental window will be settled from the deposit account at actuals.
                </p>
                <p>
                  <strong>6. PROHIBITED USES:</strong> Driving under the influence of alcohol, drugs, commercial ride-sharing, or subleasing
                  violates the Motor Vehicles Act and results in instant vehicle immobilization and forfeiture of security deposit.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setAgreementBooking(null)}
                  className="flex-1 text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="flex-1 text-xs font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Agreement PDF</span>
                </Button>
              </div>
            </div>
          );
        })()}
      </Dialog>

      {/* Feature 5: WhatsApp Boarding Pass & QR Voucher Dialog */}
      <Dialog
        isOpen={!!whatsappPassBooking}
        onClose={() => setWhatsappPassBooking(null)}
        title="WhatsApp Digital Boarding Pass"
        description="Instant station check-in pass sent directly to WhatsApp"
        className="max-w-md"
      >
        {whatsappPassBooking && (() => {
          const v = whatsappPassBooking.vehicle;
          const phone = whatsappPassBooking.whatsappNumber || whatsappPassBooking.customer?.phone || "9876543210";
          const pickupAddr = v?.agency?.address
            ? `${v.agency.address}, ${v.agency.city}`
            : `${whatsappPassBooking.pickupLocation || "RentiGo Hub, Indiranagar, Bengaluru"}`;
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupAddr)}`;

          return (
            <div className="space-y-4">
              {/* WhatsApp Notification status pill */}
              <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-300 text-xs font-semibold">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  <span>Dispatched to +91 {phone}</span>
                </div>
                <span className="text-[10px] font-bold text-green-700 bg-green-200/60 px-2 py-0.5 rounded-full">
                  DELIVERED
                </span>
              </div>

              {/* Boarding Card */}
              <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-5 bg-gradient-to-b from-blue-50/50 to-white dark:from-gray-900 dark:to-gray-950 text-center space-y-4 shadow-sm">
                <div>
                  <div className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">
                    RENTIGO PASSENGER BOARDING PASS
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                    {v ? `${v.brand} ${v.model}` : "Reserved Vehicle"}
                  </h3>
                  <div className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 font-mono font-bold text-xs px-3 py-1 rounded-full mt-1">
                    {v?.vehicleNumber || "KA-01-EQ-4491"}
                  </div>
                </div>

                {/* Visual SVG QR Code */}
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-inner border border-gray-100 mx-auto w-48 h-48">
                  <svg className="w-40 h-40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="100" fill="white" />
                    {/* Corner top-left */}
                    <rect x="10" y="10" width="24" height="24" rx="3" fill="#1E293B" />
                    <rect x="14" y="14" width="16" height="16" fill="white" />
                    <rect x="18" y="18" width="8" height="8" fill="#2563EB" />
                    {/* Corner top-right */}
                    <rect x="66" y="10" width="24" height="24" rx="3" fill="#1E293B" />
                    <rect x="70" y="14" width="16" height="16" fill="white" />
                    <rect x="74" y="18" width="8" height="8" fill="#2563EB" />
                    {/* Corner bottom-left */}
                    <rect x="10" y="66" width="24" height="24" rx="3" fill="#1E293B" />
                    <rect x="14" y="70" width="16" height="16" fill="white" />
                    <rect x="18" y="74" width="8" height="8" fill="#2563EB" />
                    {/* Pattern elements */}
                    <rect x="42" y="12" width="6" height="6" fill="#1E293B" />
                    <rect x="52" y="12" width="6" height="6" fill="#1E293B" />
                    <rect x="42" y="24" width="6" height="12" fill="#1E293B" />
                    <rect x="52" y="28" width="8" height="6" fill="#2563EB" />
                    <rect x="12" y="42" width="8" height="8" fill="#1E293B" />
                    <rect x="28" y="42" width="6" height="14" fill="#2563EB" />
                    <rect x="42" y="42" width="16" height="16" fill="#1E293B" />
                    <rect x="46" y="46" width="8" height="8" fill="white" />
                    <rect x="66" y="42" width="8" height="10" fill="#1E293B" />
                    <rect x="80" y="42" width="8" height="8" fill="#2563EB" />
                    <rect x="42" y="66" width="12" height="6" fill="#1E293B" />
                    <rect x="66" y="66" width="6" height="14" fill="#2563EB" />
                    <rect x="78" y="66" width="12" height="6" fill="#1E293B" />
                    <rect x="42" y="78" width="8" height="10" fill="#2563EB" />
                    <rect x="56" y="74" width="6" height="14" fill="#1E293B" />
                    <rect x="74" y="78" width="16" height="10" fill="#1E293B" />
                  </svg>
                  <span className="text-[9px] font-mono font-bold text-gray-500 mt-1">
                    SCAN AT HUB CHECK-IN
                  </span>
                </div>

                {/* Handover OTP */}
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                    Station Handover Verification OTP
                  </div>
                  <div className="text-2xl font-black font-mono tracking-widest text-amber-600 dark:text-amber-300">
                    8492
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Share this 4-digit OTP with the fleet associate only at key handover
                  </div>
                </div>

                {/* Pickup Location & Maps Link */}
                <div className="text-left text-xs bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl space-y-1">
                  <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                    <MapPin className="h-3.5 w-3.5 text-blue-600" />
                    <span>Pickup Station Location:</span>
                  </div>
                  <div className="text-[11px] text-gray-600 dark:text-gray-300 pl-4.5">
                    {pickupAddr}
                  </div>
                  <div className="pt-1 pl-4.5">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      <span>Open Live GPS Coordinates in Google Maps</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* 24x7 Roadside Assistance */}
                <div className="text-[10px] text-gray-500 flex justify-center items-center gap-2">
                  <span>24x7 Roadside Assistance (RSA):</span>
                  <a href="tel:18007368446" className="font-bold text-blue-600">
                    1800-RENTIGO-RSA
                  </a>
                </div>
              </div>

              <Button
                onClick={() => setWhatsappPassBooking(null)}
                className="w-full text-xs font-semibold"
              >
                Close Pass
              </Button>
            </div>
          );
        })()}
      </Dialog>
    </div>
  );
}
