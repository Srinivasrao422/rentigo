"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Vehicle } from "../../../types";
import { apiRequest } from "../../../lib/api";
import PriceCalculatorWidget from "../../../components/bookings/PriceCalculatorWidget";
import { rentalRange } from "../../../lib/rentalDates";
import { formatCurrency } from "../../../lib/utils";
import {
  Car,
  Bike,
  Fuel,
  Users,
  Gauge,
  MapPin,
  Star,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Calendar,
  ChevronLeft,
  Phone,
  Mail,
  Award,
} from "lucide-react";

export default function VehicleDetailPage() {
  return <Suspense fallback={<p role="status" className="p-8 text-center">Loading vehicle details?</p>}>
    <VehicleDetails />
  </Suspense>;
}

function VehicleDetails() {
  const params = useParams();
  const searchParams = useSearchParams();
  const range = rentalRange(searchParams.get("startDate") || "", searchParams.get("endDate") || "");
  const catalog = searchParams.get("catalog");
  const backQuery = new URLSearchParams(catalog || (range ? new URLSearchParams(range) : undefined));
  const catalogHref = backQuery.size ? `/vehicles?${backQuery.toString()}` : "/vehicles";
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [selectedImg, setSelectedImg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) return;

    apiRequest<Vehicle>(`/vehicles/${vehicleId}`, { requiresAuth: false })
      .then((data) => {
        setVehicle(data);
        const primary =
          data.images?.find((img) => img.isPrimary)?.url ||
          data.images?.[0]?.url ||
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80";
        setSelectedImg(primary);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load vehicle details");
        setIsLoading(false);
      });
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicle || window.location.hash !== "#booking") return;
    const panel = document.getElementById("booking");
    panel?.focus({ preventScroll: true });
    panel?.scrollIntoView({ block: "start" });
  }, [vehicle]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading vehicle details...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Vehicle Not Found
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {error || "The requested vehicle could not be loaded."}
        </p>
        <Link
          href={catalogHref}
          className="mt-6 inline-flex items-center text-sm font-semibold text-blue-600 hover:underline"
        >
          &larr; Back to Fleet
        </Link>
      </div>
    );
  }

  const isFourWheeler = vehicle.type === "FOUR_WHEELER";

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      {/* Back button */}
      <Link
        href={catalogHref}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to all vehicles</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Gallery, Specs, Details & Reviews (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Main Photo Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-gray-100 shadow-lg dark:bg-gray-800">
              <img
                src={selectedImg}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="h-full w-full object-cover transition-all duration-300"
              />
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                {isFourWheeler ? (
                  <>
                    <Car className="h-4 w-4 text-blue-400" />
                    <span>Four-Wheeler</span>
                  </>
                ) : (
                  <>
                    <Bike className="h-4 w-4 text-emerald-400" />
                    <span>Two-Wheeler</span>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnail switcher */}
            {vehicle.images && vehicle.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {vehicle.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImg(img.url)}
                    className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      selectedImg === img.url
                        ? "border-blue-600 ring-2 ring-blue-500/30"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt="Thumbnail"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Key Meta */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                {vehicle.year}
              </span>
              <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {vehicle.category.replace("_", " ")}
              </span>
              <div className="ml-auto flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-white">
                {vehicle.averageRating && vehicle.averageRating > 0 ? (
                  <>
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>{vehicle.averageRating}</span>
                    <span className="text-xs font-normal text-gray-400">
                      ({vehicle.totalReviews || 0} reviews)
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-gray-400">No reviews yet</span>
                )}
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Registration Number: {vehicle.vehicleNumber}
            </p>
            <a href="#booking" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:hidden">
              Check availability
            </a>
          </div>

          {/* Specs Grid */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
              Vehicle Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                <Fuel className="h-5 w-5 text-blue-600 mb-1.5" />
                <div className="text-[11px] text-gray-400">Fuel Type</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {vehicle.fuelType}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                <Gauge className="h-5 w-5 text-emerald-600 mb-1.5" />
                <div className="text-[11px] text-gray-400">Transmission</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {vehicle.transmission}
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                <Users className="h-5 w-5 text-purple-600 mb-1.5" />
                <div className="text-[11px] text-gray-400">Capacity</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {vehicle.seatingCapacity} Passengers
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3.5 dark:bg-gray-800/60">
                <Award className="h-5 w-5 text-amber-600 mb-1.5" />
                <div className="text-[11px] text-gray-400">Efficiency / Range</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {vehicle.mileage || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
              About This Vehicle
            </h3>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {vehicle.description}
            </p>
          </div>

          {/* Features Pills */}
          {vehicle.features && vehicle.features.length > 0 && (
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                Included Features & Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{feat}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rental Agency Profile Card */}
          {vehicle.agency && (
            <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/60">
                  <Building2 className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-base font-bold text-gray-950 dark:text-white">
                      {vehicle.agency.name}
                    </h4>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Verified Fleet Agency
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {vehicle.agency.address}, {vehicle.agency.city}, {vehicle.agency.state}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{vehicle.agency.contactPhone}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <span>{vehicle.agency.contactEmail}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Reviews Section */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
              Verified Customer Reviews
            </h3>
            {vehicle.reviews && vehicle.reviews.length > 0 ? (
              <div className="space-y-4">
                {vehicle.reviews.map((r: any) => (
                  <div key={r.id} className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                          {r.customer?.firstName?.[0] || "U"}{r.customer?.lastName?.[0] || ""}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900 dark:text-white">
                            {r.customer?.firstName} {r.customer?.lastName}
                          </div>
                          <div className="text-[10px] text-gray-400">Verified Rental</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-current" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-xs font-medium">No reviews yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Reviews are collected from verified renters after rental return.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Tiered Calculator & Booking Engine (5 cols) */}
        <div id="booking" tabIndex={-1} className="scroll-mt-24 lg:col-span-5">
          <PriceCalculatorWidget
            key={`${vehicle.id}:${range?.startDate}:${range?.endDate}`}
            vehicle={vehicle}
            initialDates={range}
            catalogQuery={catalog}
          />
        </div>
      </div>
    </div>
  );
}
