"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Vehicle } from "../../types";
import { apiRequest } from "../../lib/api";
import VehicleCard from "../../components/vehicles/VehicleCard";
import VehicleFilter from "../../components/vehicles/VehicleFilter";
import { Car, AlertCircle } from "lucide-react";
import { Button } from "../../components/ui/Button";

function VehiclesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state initialized from URL search params
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    type: searchParams.get("type") || "",
    category: searchParams.get("category") || "",
    fuelType: searchParams.get("fuelType") || "",
    transmission: searchParams.get("transmission") || "",
    city: searchParams.get("city") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sortBy: searchParams.get("sortBy") || "newest",
  });

  const fetchVehicles = () => {
    setIsLoading(true);
    const query = new URLSearchParams();

    if (filters.search) query.set("search", filters.search);
    if (filters.type) query.set("type", filters.type);
    if (filters.category) query.set("category", filters.category);
    if (filters.fuelType) query.set("fuelType", filters.fuelType);
    if (filters.transmission) query.set("transmission", filters.transmission);
    if (filters.city) query.set("city", filters.city);
    if (filters.minPrice) query.set("minPrice", filters.minPrice);
    if (filters.maxPrice) query.set("maxPrice", filters.maxPrice);

    if (filters.sortBy === "price_low") {
      query.set("sortBy", "dailyRate");
      query.set("sortOrder", "asc");
    } else if (filters.sortBy === "price_high") {
      query.set("sortBy", "dailyRate");
      query.set("sortOrder", "desc");
    } else {
      query.set("sortBy", "createdAt");
      query.set("sortOrder", "desc");
    }

    apiRequest<Vehicle[]>(`/vehicles?${query.toString()}`, { requiresAuth: false })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setVehicles(list);
        setTotalCount(list.length);
        setIsLoading(false);
      })
      .catch(() => {
        setVehicles([]);
        setTotalCount(0);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  const handleFilterChange = (updated: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      type: "",
      category: "",
      fuelType: "",
      transmission: "",
      city: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "newest",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-950 dark:text-white">
          Explore All Vehicles
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Compare models, view daily/weekly/monthly savings, and check real-time availability.
        </p>
      </div>

      {/* Filter Component */}
      <VehicleFilter
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResults={totalCount}
      />

      {/* Grid of Results */}
      <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-gray-200 animate-pulse dark:bg-gray-800"
              />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
              No vehicles matched your search
            </h3>
            <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
              Try adjusting your price range, fuel type, or clearing filters to see more results.
            </p>
            <Button
              onClick={handleResetFilters}
              variant="outline"
              className="mt-5 text-xs font-semibold"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-10 text-center">Loading fleet...</div>}>
      <VehiclesContent />
    </Suspense>
  );
}
