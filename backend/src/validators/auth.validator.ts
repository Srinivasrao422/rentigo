import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(50, "Password cannot exceed 50 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  role: z.enum(["CUSTOMER", "AGENCY_OWNER"]).default("CUSTOMER"),
  // If role is AGENCY_OWNER, agency details are required
  agency: z
    .object({
      name: z.string().min(2, "Agency name is required"),
      description: z.string().optional(),
      address: z.string().min(5, "Address is required"),
      city: z.string().min(2, "City is required"),
      state: z.string().min(2, "State is required"),
      postalCode: z.string().optional(),
      contactPhone: z.string().min(7, "Valid phone number required"),
      contactEmail: z.string().email("Valid email required"),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});
