"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Vehicle, PriceQuote } from "../../types";
import { apiRequest } from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { rentalDate, rentalDateTime, rentalRange } from "../../lib/rentalDates";
import { formatCurrency, formatDate } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Tag,
  Clock,
  MapPin,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface PriceCalculatorWidgetProps {
  vehicle: Vehicle;
  initialDates?: ReturnType<typeof rentalRange>;
  catalogQuery?: string | null;
}

export default function PriceCalculatorWidget({
  vehicle,
  initialDates,
  catalogQuery,
}: PriceCalculatorWidgetProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  const [startDate, setStartDate] = useState(() => initialDates?.startDate || rentalDate(1));
  const [endDate, setEndDate] = useState(() => initialDates?.endDate || rentalDate(5));
  const [quoteResult, setQuoteResult] = useState<{ key: string; quote?: PriceQuote; failed?: boolean } | null>(null);
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const dateError = !rentalRange(startDate, endDate) || startDate < rentalDate()
    ? "Choose a pickup date and a later return date."
    : null;
  const quoteKey = `${vehicle.id}:${startDate}:${endDate}:${user?.id ?? "guest"}:${quoteAttempt}`;
  const matchingResult = quoteResult?.key === quoteKey ? quoteResult : null;
  const quote = dateError ? null : matchingResult?.quote;
  const quoteFailed = !!matchingResult?.failed;
  const isLoadingQuote = !dateError && !matchingResult;

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(
    vehicle.agency?.address ? `${vehicle.agency.address}, ${vehicle.agency.city}` : "Agency Headquarters"
  );
  const [dropoffLocation, setDropoffLocation] = useState(
    vehicle.agency?.address ? `${vehicle.agency.address}, ${vehicle.agency.city}` : "Agency Headquarters"
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (dateError) return;
    const controller = new AbortController();
    const query = new URLSearchParams({
      vehicleId: vehicle.id,
      startDate: rentalDateTime(startDate),
      endDate: rentalDateTime(endDate),
    });
    apiRequest<PriceQuote>(`/bookings/quote?${query.toString()}`, {
      requiresAuth: false,
      cache: "no-store",
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) setQuoteResult({ key: quoteKey, quote: data });
      })
      .catch(() => {
        if (!controller.signal.aborted) setQuoteResult({ key: quoteKey, failed: true });
      });
    return () => controller.abort();
  }, [vehicle.id, startDate, endDate, dateError, quoteKey]);

  const handleOpenBookingModal = () => {
    if (!quote?.isAvailable || isLoadingQuote || dateError || quoteFailed) return;
    if (!user) {
      const returnParams = new URLSearchParams({ startDate, endDate });
      if (catalogQuery) returnParams.set("catalog", catalogQuery);
      const returnTo = `/vehicles/${encodeURIComponent(vehicle.id)}?${returnParams.toString()}#booking`;
      router.push(`/login?${new URLSearchParams({ returnTo }).toString()}`);
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !quote?.isAvailable || isLoadingQuote || dateError || quoteFailed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const startIso = rentalDateTime(startDate);
      const endIso = rentalDateTime(endDate);

      const booking = await apiRequest("/bookings", {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({
          vehicleId: vehicle.id,
          startDate: startIso,
          endDate: endIso,
          pickupLocation,
          dropoffLocation,
          notes: notes || undefined,
        }),
      });

      toast.success(`Booking request #${booking.bookingNumber} sent to agency!`);
      setIsModalOpen(false);
      router.push("/bookings");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 sticky top-24">
      {/* Header Rate Display */}
      <div className="mb-6 flex items-baseline justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div>
          <span className="text-3xl font-black text-gray-950 dark:text-white">
            {formatCurrency(vehicle.pricing.dailyRate)}
          </span>
          <span className="text-sm font-semibold text-gray-500"> / day</span>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Tag className="h-3 w-3" />
            <span>Weekly & Monthly Savings</span>
          </span>
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pickup-date" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
              <span>Pickup date</span>
            </label>
            <input id="pickup-date"
              type="date"
              value={startDate}
              aria-describedby={dateError ? "quote-date-error" : undefined}
              min={rentalDate()}
              onChange={(e) => {
                setQuoteResult(null);
                setStartDate(e.target.value);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="return-date" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
              <span>Return date</span>
            </label>
            <input id="return-date"
              type="date"
              value={endDate}
              aria-describedby={dateError ? "quote-date-error" : undefined}
              min={startDate || rentalDate(1)}
              onChange={(e) => {
                setQuoteResult(null);
                setEndDate(e.target.value);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-2.5 text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <p role="status" className="sr-only">
          {isLoadingQuote ? "Checking availability and price." : quote?.isAvailable ? "Available for your selected dates." : quote ? "Unavailable for your selected dates. Try different dates." : ""}
        </p>

        {/* Availability feedback */}
        {quote && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
              quote.isAvailable
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-red-50 text-red-800 border border-red-200/60 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {quote.isAvailable ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Available for your selected dates</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                <span>
                  {quote.conflictReason || "Unavailable for your selected dates."} Try a different pickup or return date.
                </span>
              </>
            )}
          </div>
        )}

        {dateError && (
          <div id="quote-date-error" role="alert" className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span>{dateError}</span>
          </div>
        )}

        {quoteFailed && (
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
            <p role="alert" className="text-sm">We couldn?t check availability or price. Your dates are still selected.</p>
            <Button variant="outline" className="mt-2" onClick={() => setQuoteAttempt((value) => value + 1)}>
              Retry quote
            </Button>
          </div>
        )}

        {/* Live pricing breakdown */}
        {isLoadingQuote && (
          <div aria-hidden="true" className="flex items-center justify-center py-6 text-xs text-gray-600 dark:text-gray-300">
            <Clock className="h-4 w-4 animate-spin mr-2 text-blue-500" />
            <span>Checking availability and price?</span>
          </div>
        )}

        {quote && !isLoadingQuote && (
          <div className="space-y-3 rounded-xl bg-gray-50 p-4 text-xs dark:bg-gray-800/60">
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1">
                <span>Duration</span>
                <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                  {quote.durationType}
                </span>
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {quote.totalDays} {quote.totalDays === 1 ? "day" : "days"}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <span>Applied Rate Plan</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {quote.rateLabel}
              </span>
            </div>

            {quote.discountAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Package Tier Discount</span>
                </span>
                <span>-{formatCurrency(quote.discountAmount)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <span>Estimated Tax (10%)</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(quote.taxAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <span className="flex items-center gap-1">
                <span>Security Deposit</span>
                <span className="text-[10px] text-gray-400">(refundable)</span>
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(quote.securityDeposit)}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-3 dark:border-gray-700 flex items-baseline justify-between text-sm font-bold text-gray-900 dark:text-white">
              <span>Total Payable</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                {formatCurrency(quote.totalAmount)}
              </span>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <Button
          onClick={handleOpenBookingModal}
          disabled={!quote?.isAvailable || isLoadingQuote || !!dateError || quoteFailed}
          size="lg"
          className="w-full text-base font-bold shadow-lg shadow-blue-500/25"
        >
          {user ? "Request booking" : "Sign in to request booking"}
        </Button>

        <p className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>The rental agency reviews your request before any payment is charged.</span>
        </p>
      </div>

      {/* Booking Form Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Rental Request"
        description={`Request reservation for ${vehicle.brand} ${vehicle.model} (${vehicle.year})`}
      >
        <form onSubmit={handleConfirmBooking} className="space-y-4">
          <div className="rounded-xl bg-blue-50 p-3.5 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <div className="font-bold mb-1">Rental Summary:</div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <div>Dates: {startDate} to {endDate}</div>
              <div>Duration: {quote?.totalDays} days ({quote?.durationType})</div>
              <div>Estimated Total: {formatCurrency(quote?.totalAmount || 0)}</div>
              <div>Deposit: {formatCurrency(quote?.securityDeposit || 0)} (Refundable)</div>
            </div>
          </div>

          <div>
            <label htmlFor="pickup-location" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              <span>Pick-up Location</span>
            </label>
            <input id="pickup-location"
              type="text"
              required
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="return-location" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-blue-500" />
              <span>Drop-off Location</span>
            </label>
            <input id="return-location"
              type="text"
              required
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="booking-notes" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Special Requests or Notes for Agency (Optional)
            </label>
            <textarea id="booking-notes"
              rows={2}
              placeholder="e.g. Flight arrival time, child seat, extra helmet..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="flex-1 font-bold"
            >
              Send Request
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
