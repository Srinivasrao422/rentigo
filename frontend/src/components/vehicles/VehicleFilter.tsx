"use client";

import React from "react";
import { VehicleType, FuelType, Transmission } from "../../types";
import { Search, RotateCcw, Car, Bike, Filter } from "lucide-react";

interface FilterState {
  search: string;
  type: string;
  category: string;
  fuelType: string;
  transmission: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
}

interface VehicleFilterProps {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
  totalResults?: number;
}

export default function VehicleFilter({
  filters,
  onChange,
  onReset,
  totalResults,
}: VehicleFilterProps) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-5">
      {/* Search Input & Quick Type Tabs */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by brand, model, or keywords (e.g. Tesla, Ducati, Vespa)..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-gray-800 dark:bg-gray-800/50 dark:text-white"
          />
        </div>

        {/* Vehicle Type Quick Segmented Control */}
        <div className="flex items-center rounded-xl bg-gray-100 p-1 dark:bg-gray-800 self-start lg:self-auto">
          <button
            onClick={() => onChange({ type: "" })}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filters.type === ""
                ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <span>All Fleet</span>
          </button>
          <button
            onClick={() => onChange({ type: "FOUR_WHEELER" })}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filters.type === "FOUR_WHEELER"
                ? "bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>Four-Wheelers</span>
          </button>
          <button
            onClick={() => onChange({ type: "TWO_WHEELER" })}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filters.type === "TWO_WHEELER"
                ? "bg-white text-emerald-600 shadow-sm dark:bg-gray-900 dark:text-emerald-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <Bike className="h-3.5 w-3.5" />
            <span>Two-Wheelers</span>
          </button>
        </div>
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 border-t border-gray-100 dark:border-gray-800 pt-4">
        {/* City */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            City
          </label>
          <select
            value={filters.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 px-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="">All Cities</option>
            <option value="San Francisco">San Francisco, CA</option>
            <option value="Austin">Austin, TX</option>
          </select>
        </div>

        {/* Fuel Type */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Fuel Type
          </label>
          <select
            value={filters.fuelType}
            onChange={(e) => onChange({ fuelType: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 px-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="">All Fuels</option>
            <option value="ELECTRIC">Electric</option>
            <option value="PETROL">Petrol</option>
            <option value="HYBRID">Hybrid</option>
            <option value="DIESEL">Diesel</option>
          </select>
        </div>

        {/* Transmission */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Transmission
          </label>
          <select
            value={filters.transmission}
            onChange={(e) => onChange({ transmission: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 px-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="">Any</option>
            <option value="AUTOMATIC">Automatic</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Min Price ($)
          </label>
          <input
            type="number"
            placeholder="0"
            value={filters.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 px-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Max Price ($)
          </label>
          <input
            type="number"
            placeholder="500"
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 px-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value })}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 px-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Footer bar with results count and reset */}
      <div className="flex items-center justify-between pt-1 text-xs text-gray-500 dark:text-gray-400">
        <div>
          {totalResults !== undefined && (
            <span>
              Showing <strong className="text-gray-900 dark:text-white">{totalResults}</strong> available vehicles
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
}
