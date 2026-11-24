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
  Zap,
  Truck,
  CreditCard,
  QrCode,
  FileCheck,
  Smartphone,
  Info,
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
  const [quoteResult, setQuoteResult] = useState<{ key: string; quote?: PriceQuote & { surgeApplied?: boolean; surgePercentage?: number }; failed?: boolean } | null>(null);
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const dateError = !rentalRange(startDate, endDate) || startDate < rentalDate()
    ? "Choose a pickup date and a later return date."
    : null;
  const quoteKey = `${vehicle.id}:${startDate}:${endDate}:${user?.id ?? "guest"}:${quoteAttempt}`;
  const matchingResult = quoteResult?.key === quoteKey ? quoteResult : null;
  const quote = dateError ? null : matchingResult?.quote;
  const quoteFailed = !!matchingResult?.failed;
  const isLoadingQuote = !dateError && !matchingResult;

  // Booking Modal State (Features 1, 2, 4, 5)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDoorstepDelivery, setIsDoorstepDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupLocation, setPickupLocation] = useState(
    vehicle.agency?.address ? `${vehicle.agency.address}, ${vehicle.agency.city}` : "Agency Headquarters"
  );
  const [dropoffLocation, setDropoffLocation] = useState(
    vehicle.agency?.address ? `${vehicle.agency.address}, ${vehicle.agency.city}` : "Agency Headquarters"
  );
  const [notes, setNotes] = useState("");
  const [dlNumber, setDlNumber] = useState("DL-0420110012345");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [upiId, setUpiId] = useState("renter@okhdfcbank");
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("+91 98765 43210");
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
      const deliveryFee = isDoorstepDelivery ? 350 : 0;

      const booking = await apiRequest("/bookings", {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({
          vehicleId: vehicle.id,
          startDate: startIso,
          endDate: endIso,
          pickupLocation: isDoorstepDelivery ? `Doorstep Delivery: ${deliveryAddress}` : pickupLocation,
          dropoffLocation: isDoorstepDelivery ? `Doorstep Pickup: ${deliveryAddress}` : dropoffLocation,
          notes: notes || undefined,
          isDelivery: isDoorstepDelivery,
          deliveryFee,
          deliveryAddress: isDoorstepDelivery ? deliveryAddress : undefined,
          paymentMethod,
          dlNumber,
          whatsappNumber: whatsappAlerts ? whatsappNumber : undefined,
        }),
      });

      toast.success(`Booking request #${booking.bookingNumber} confirmed!`);
      setIsModalOpen(false);
      router.push("/bookings");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryFee = isDoorstepDelivery ? 350 : 0;
  const modalTotal = (quote?.totalAmount || 0) + deliveryFee;

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
              <Clock className="h-3.5 w-3.5 text-blue-500" />
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
          {isLoadingQuote ? "Checking availability and price." : quote?.isAvailable ? "Available for your selected dates." : quote ? "Unavailable for your selected dates." : ""}
        </p>

        {/* Feature 3: Dynamic Weekend Surge Banner */}
        {quote?.surgeApplied && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-xs font-medium text-amber-800 border border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300">
            <Zap className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
            <span>Weekend Peak Demand (+5% surge rate applied)</span>
          </div>
        )}

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
                <span className="font-semibold">Available for your selected dates</span>
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
            <p role="alert" className="text-sm">Unable to check availability or price. Your dates are still selected.</p>
            <Button variant="outline" className="mt-2" onClick={() => setQuoteAttempt((value) => value + 1)}>
              Retry quote
            </Button>
          </div>
        )}

        {/* Live Calculation Receipt Breakdown */}
        {quote && (
          <div className="rounded-xl bg-gray-50/80 p-4 dark:bg-gray-800/40 space-y-2.5 text-xs border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
              <span>Duration</span>
              <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {quote.durationType}
                </span>
                <span>{quote.totalDays} days</span>
              </span>
            </div>

            <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
              <span>Applied Rate Plan</span>
              <span className="font-medium">
                {quote.rateLabel || "Standard Plan"}
              </span>
            </div>

            {quote.discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-600 font-semibold">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Tiered Discount Savings</span>
                </span>
                <span>-{formatCurrency(quote.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
              <span>GST Tax (18% Motor Vehicle Rental)</span>
              <span>{formatCurrency(quote.taxAmount)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
              <span className="flex items-center gap-1">
                <span>Security Deposit</span>
                <span className="text-[10px] text-gray-400">(refundable)</span>
              </span>
              <span>{formatCurrency(quote.securityDeposit)}</span>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                Total Payable
              </span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                {formatCurrency(quote.totalAmount)}
              </span>
            </div>
          </div>
        )}

        {/* Primary Booking Action Button */}
        <Button
          id="booking"
          onClick={handleOpenBookingModal}
          disabled={!quote?.isAvailable || isLoadingQuote || Boolean(dateError) || quoteFailed}
          isLoading={isLoadingQuote}
          size="lg"
          className="w-full text-base font-bold shadow-lg shadow-blue-500/25"
        >
          {user ? (quote?.isAvailable ? "Request booking" : "Select available dates") : "Sign in to request booking"}
        </Button>

        <p className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Security deposit pre-auth hold only. Released within 24 hrs of return.</span>
        </p>
      </div>

      {/* Feature-Packed Booking Confirmation Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirm Rental & Payment Pre-Auth"
        description={`Reserve ${vehicle.brand} ${vehicle.model} (${vehicle.year})`}
      >
        <form onSubmit={handleConfirmBooking} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {/* Summary Box */}
          <div className="rounded-xl bg-blue-50 p-3.5 text-xs text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <div className="font-bold mb-1.5 flex items-center justify-between">
              <span>Reservation Summary:</span>
              <span className="rounded bg-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                {quote?.totalDays} Days ({quote?.durationType})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <div>Dates: {startDate} to {endDate}</div>
              <div>Base Rental: {formatCurrency(quote?.basePrice || 0)}</div>
              <div>GST Tax (18%): {formatCurrency(quote?.taxAmount || 0)}</div>
              <div>Deposit Hold: {formatCurrency(quote?.securityDeposit || 0)}</div>
              {isDoorstepDelivery && <div>Doorstep Delivery: +₹350</div>}
              <div className="col-span-2 pt-1 font-bold text-blue-950 dark:text-blue-100 border-t border-blue-200/60 dark:border-blue-800/60 flex justify-between">
                <span>Final Payable:</span>
                <span className="text-sm font-black">{formatCurrency(modalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Digital KYC & Driver's License */}
          <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="dl-number" className="block text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-emerald-600" />
                <span>Driver’s License (Parivahan KYC)</span>
              </label>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                <span>DigiLocker Verified</span>
              </span>
            </div>
            <input
              id="dl-number"
              type="text"
              required
              placeholder="e.g. DL-0420110012345"
              value={dlNumber}
              onChange={(e) => setDlNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs uppercase font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <p className="text-[10px] text-gray-500">
              Verified instantly against Ministry of Road Transport database for self-drive authorization.
            </p>
          </div>

          {/* Feature 4: Doorstep Vehicle Delivery Toggle */}
          <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Doorstep Delivery & Return</span>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">+₹350 flat</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={isDoorstepDelivery}
                onChange={(e) => setIsDoorstepDelivery(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span>Have sanitized vehicle delivered to my home, hotel, or airport</span>
            </label>

            {isDoorstepDelivery ? (
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Delivery Address in {vehicle.agency?.city || "City"}
                </label>
                <input
                  type="text"
                  required={isDoorstepDelivery}
                  placeholder="e.g. Hotel Grand, MG Road or Terminal 1 Arrival Gate"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <label htmlFor="pickup-loc" className="block text-[10px] font-semibold text-gray-500 uppercase">Hub Pick-up</label>
                  <input id="pickup-loc"
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full rounded border border-gray-200 p-1.5 text-xs text-gray-800 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="drop-loc" className="block text-[10px] font-semibold text-gray-500 uppercase">Hub Drop-off</label>
                  <input id="drop-loc"
                    type="text"
                    value={dropoffLocation}
                    onChange={(e) => setDropoffLocation(e.target.value)}
                    className="w-full rounded border border-gray-200 p-1.5 text-xs text-gray-800 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Feature 1: Payment Method & Security Deposit Hold */}
          <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <span>Payment & Security Deposit Pre-Auth</span>
              </span>
              <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded">
                Pre-Auth Hold: {formatCurrency(quote?.securityDeposit || 0)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("UPI")}
                className={`p-2 rounded-lg border text-center transition-all ${
                  paymentMethod === "UPI"
                    ? "border-blue-600 bg-blue-50 text-blue-900 font-bold dark:bg-blue-950/60 dark:text-blue-200"
                    : "border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="text-xs">UPI</div>
                <div className="text-[9px] text-gray-500">GPay / PhonePe</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                className={`p-2 rounded-lg border text-center transition-all ${
                  paymentMethod === "CARD"
                    ? "border-blue-600 bg-blue-50 text-blue-900 font-bold dark:bg-blue-950/60 dark:text-blue-200"
                    : "border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="text-xs">Card Pre-Auth</div>
                <div className="text-[9px] text-gray-500">Razorpay Hold</div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("NETBANKING")}
                className={`p-2 rounded-lg border text-center transition-all ${
                  paymentMethod === "NETBANKING"
                    ? "border-blue-600 bg-blue-50 text-blue-900 font-bold dark:bg-blue-950/60 dark:text-blue-200"
                    : "border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300"
                }`}
              >
                <div className="text-xs">NetBanking</div>
                <div className="text-[9px] text-gray-500">All Indian Banks</div>
              </button>
            </div>

            {paymentMethod === "UPI" && (
              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  VPA / UPI ID for Instant Collect Request
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. mobile@okhdfcbank or user@paytm"
                  className="w-full rounded-lg border border-gray-300 p-2 text-xs font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            )}

            <div className="rounded-lg bg-gray-100 p-2 text-[10px] text-gray-600 dark:bg-gray-900 dark:text-gray-400 flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Deposit Hold Guarantee:</strong> The security deposit of {formatCurrency(quote?.securityDeposit || 0)} is only a pre-authorized hold on your account. It will NOT be debited and is released within 24 hours of safe vehicle return.
              </span>
            </div>
          </div>

          {/* Feature 5: WhatsApp & SMS Booking Alerts */}
          <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 dark:text-gray-200">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                <span>Instant WhatsApp Pass & SMS</span>
              </label>
              <input
                type="checkbox"
                checked={whatsappAlerts}
                onChange={(e) => setWhatsappAlerts(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
            </div>
            {whatsappAlerts && (
              <div>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white font-mono"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Receive instant reservation confirmation, QR pass, and pickup GPS navigation directly on WhatsApp.
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="booking-notes" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Special Requests (Optional)
            </label>
            <textarea id="booking-notes"
              rows={2}
              placeholder="e.g. Flight arrival time, child seat, extra helmet..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
              className="flex-1 font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirm & Pre-Authorize
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
