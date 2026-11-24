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
    </div>
  );
}
