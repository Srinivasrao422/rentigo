import { differenceInCalendarDays, isBefore, isEqual } from "date-fns";
import { DurationType, PriceBreakdown } from "../types/index.js";

/**
 * Calculates calendar days between two dates (inclusive of start day, minimum 1 day)
 */
export const calculateTotalDays = (startDate: Date, endDate: Date): number => {
  const days = differenceInCalendarDays(endDate, startDate);
  return Math.max(1, days);
};

/**
 * Check if two date ranges overlap:
 * Range A: [startA, endA]
 * Range B: [startB, endB]
 * Overlap condition: startA < endB && endA > startB
 */
export const doDateRangesOverlap = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean => {
  return startA < endB && endA > startB;
};

/**
 * Validates that requested start is in the future / present, and end is after start
 */
export const validateDateRange = (
  startDate: Date,
  endDate: Date
): { isValid: boolean; message?: string } => {
  const now = new Date();
  // Allow bookings starting today (grace period: 5 mins ago)
  const graceMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  if (isBefore(startDate, graceMinutesAgo)) {
    return { isValid: false, message: "Start date cannot be in the past" };
  }

  if (isBefore(endDate, startDate) || isEqual(endDate, startDate)) {
    return { isValid: false, message: "End date must be after start date" };
  }

  return { isValid: true };
};

interface PricingInput {
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  securityDeposit?: number;
  taxRatePercent?: number; // e.g. 10%
}

/**
 * Smart best-rate tiered price calculator:
 * Optimizes cost for customer between Monthly, Weekly, and Daily rates.
 */
export const calculateBestPrice = (
  startDate: Date,
  endDate: Date,
  pricing: PricingInput
): PriceBreakdown => {
  const totalDays = calculateTotalDays(startDate, endDate);
  const daily = Number(pricing.dailyRate);
  const weekly = Number(pricing.weeklyRate);
  const monthly = Number(pricing.monthlyRate);
  const securityDeposit = Number(pricing.securityDeposit || 0);
  const taxRate = Number(pricing.taxRatePercent ?? 10) / 100;

  // 1. Pure daily price
  const pureDailyCost = totalDays * daily;

  // 2. Combination with monthly (30 days/month)
  const months = Math.floor(totalDays / 30);
  const remAfterMonths = totalDays % 30;
  const weeksAfterMonths = Math.floor(remAfterMonths / 7);
  const daysAfterWeeks = remAfterMonths % 7;

  const monthComboCost =
    months * monthly +
    weeksAfterMonths * weekly +
    Math.min(daysAfterWeeks * daily, weekly);

  // 3. Combination with weekly (7 days/week)
  const totalWeeks = Math.floor(totalDays / 7);
  const remDays = totalDays % 7;
  const weekComboCost =
    totalWeeks * weekly + Math.min(remDays * daily, weekly);

  // 4. Cap at next tier if next tier is cheaper (e.g. 6 days daily > 1 week)
  const fullMonthCost = Math.ceil(totalDays / 30) * monthly;
  const fullWeekCost = Math.ceil(totalDays / 7) * weekly;

  // Pick the lowest base price
  let basePrice = Math.min(
    pureDailyCost,
    weekComboCost,
    monthComboCost,
    fullWeekCost,
    fullMonthCost
  );

  // Determine primary duration type and label
  let durationType: DurationType = "DAILY";
  let rateLabel = `$${daily}/day`;
  let applicableRate = daily;

  if (totalDays >= 30) {
    durationType = "MONTHLY";
    rateLabel = `$${monthly}/month (${months > 0 ? `${months}mo ` : ""}${weeksAfterMonths > 0 ? `${weeksAfterMonths}w ` : ""}${daysAfterWeeks > 0 ? `${daysAfterWeeks}d` : ""})`;
    applicableRate = monthly;
  } else if (totalDays >= 7) {
    durationType = "WEEKLY";
    rateLabel = `$${weekly}/week (${totalWeeks}w ${remDays > 0 ? `${remDays}d` : ""})`;
    applicableRate = weekly;
  }

  // Calculate tax and discount
  const discountAmount = Math.max(0, pureDailyCost - basePrice);
  const taxAmount = Math.round(basePrice * taxRate * 100) / 100;
  const totalAmount = Math.round((basePrice + taxAmount + securityDeposit) * 100) / 100;

  return {
    totalDays,
    durationType,
    applicableRate,
    basePrice: Math.round(basePrice * 100) / 100,
    securityDeposit: Math.round(securityDeposit * 100) / 100,
    taxAmount,
    discountAmount: Math.round(discountAmount * 100) / 100,
    totalAmount,
    rateLabel,
  };
};
