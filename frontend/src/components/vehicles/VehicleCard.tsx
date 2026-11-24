"use client";

import React from "react";
import Link from "next/link";
import { Vehicle } from "../../types";
import { formatCurrency } from "../../lib/utils";
import {
  Car,
  Bike,
  Fuel,
  Users,
  Gauge,
  MapPin,
  Star,
  CheckCircle2,
} from "lucide-react";

interface VehicleCardProps {
  vehicle: Vehicle;
  dateQuery?: string;
  catalogQuery?: string;
}

export default function VehicleCard({ vehicle, dateQuery = "", catalogQuery = "" }: VehicleCardProps) {
  const query = new URLSearchParams(dateQuery);
  if (catalogQuery) query.set("catalog", catalogQuery);
  const suffix = query.size ? `?${query.toString()}` : "";
  const primaryImg =
    vehicle.images?.find((img) => img.isPrimary)?.url ||
    vehicle.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80";

  const isFourWheeler = vehicle.type === "FOUR_WHEELER";
  const dailyRate = Number(vehicle.pricing?.dailyRate || 0);
  const weeklyRate = Number(vehicle.pricing?.weeklyRate || 0);
  const monthlyRate = Number(vehicle.pricing?.monthlyRate || 0);

  // Compute daily-equivalent savings for weekly and monthly
  const weeklyDailyEq = Math.round(weeklyRate / 7);
  const monthlyDailyEq = Math.round(monthlyRate / 30);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
      {/* Thumbnail + Type Badge */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={primaryImg}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
          {isFourWheeler ? (
            <>
              <Car className="h-3.5 w-3.5 text-blue-400" />
              <span>4-Wheeler</span>
            </>
          ) : (
            <>
              <Bike className="h-3.5 w-3.5 text-emerald-400" />
              <span>2-Wheeler</span>
            </>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-gray-900 shadow-sm backdrop-blur-sm dark:bg-gray-950/90 dark:text-white">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{vehicle.averageRating || 4.9}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 dark:text-white transition-colors">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="text-xs font-medium text-gray-500">
              {vehicle.year} • {vehicle.category.replace("_", " ")}
            </p>
          </div>
          {vehicle.agency && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 max-w-[120px] truncate">
              <MapPin className="h-3 w-3 flex-shrink-0 text-gray-400" />
              <span className="truncate">{vehicle.agency.city}</span>
            </div>
          )}
        </div>

        {/* Specs Pill Matrix */}
        <div className="my-4 grid grid-cols-3 gap-2 border-y border-gray-100 py-3 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-300">
          <div className="flex items-center gap-1.5">
            <Fuel className="h-3.5 w-3.5 text-gray-400" />
            <span className="truncate">{vehicle.fuelType}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-gray-400" />
            <span className="truncate">{vehicle.transmission}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            <span>{vehicle.seatingCapacity} Seats</span>
          </div>
        </div>

        {/* Tiered Price Summary */}
        <div className="mt-auto space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-gray-950 dark:text-white">
                {formatCurrency(dailyRate)}
              </span>
              <span className="text-xs font-semibold text-gray-500"> / day</span>
            </div>
            <div className="text-right text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Weekly: {formatCurrency(weeklyDailyEq)}/d</span>
              {monthlyDailyEq > 0 && (
                <span className="block text-[10px] text-gray-400 font-normal">
                  Monthly: {formatCurrency(monthlyDailyEq)}/d
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/vehicles/${vehicle.id}${suffix}`}
            className="block w-full rounded-xl bg-gray-900 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-gray-800 dark:hover:bg-blue-600"
          >
            View details <span className="sr-only">for {vehicle.brand} {vehicle.model}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
