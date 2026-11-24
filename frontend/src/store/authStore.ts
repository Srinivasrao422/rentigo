import { create } from "zustand";
import { User, UserRole } from "../types/index";
import { apiRequest } from "../lib/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => Promise<void>;
  initializeAuth: () => void;
  quickDemoLogin: (role: UserRole) => Promise<User>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  initializeAuth: () => {
    if (typeof window === "undefined") return;

    try {
      const storedUser = localStorage.getItem("rentigo_user");
      const storedToken = localStorage.getItem("rentigo_access_token");

      if (storedUser && storedToken) {
        set({
          user: JSON.parse(storedUser),
          accessToken: storedToken,
          isInitialized: true,
        });
      } else {
        set({ user: null, accessToken: null, isInitialized: true });
      }
    } catch {
      set({ user: null, accessToken: null, isInitialized: true });
    }
  },

  login: async (email: string, pass: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>("/auth/login", {
        method: "POST",
        requiresAuth: false,
        body: JSON.stringify({ email, password: pass }),
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("rentigo_access_token", res.accessToken);
        localStorage.setItem("rentigo_refresh_token", res.refreshToken);
        localStorage.setItem("rentigo_user", JSON.stringify(res.user));
      }

      set({
        user: res.user,
        accessToken: res.accessToken,
        isLoading: false,
        error: null,
      });

      return res.user;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || "Failed to sign in" });
      throw err;
    }
  },

  register: async (payload: any) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>("/auth/register", {
        method: "POST",
        requiresAuth: false,
        body: JSON.stringify(payload),
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("rentigo_access_token", res.accessToken);
        localStorage.setItem("rentigo_refresh_token", res.refreshToken);
        localStorage.setItem("rentigo_user", JSON.stringify(res.user));
      }

      set({
        user: res.user,
        accessToken: res.accessToken,
        isLoading: false,
        error: null,
      });

      return res.user;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || "Registration failed" });
      throw err;
    }
  },

  logout: async () => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        requiresAuth: true,
      });
    } catch {
      // Ignored on logout
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("rentigo_access_token");
        localStorage.removeItem("rentigo_refresh_token");
        localStorage.removeItem("rentigo_user");
      }
      set({ user: null, accessToken: null, error: null });
    }
  },

  quickDemoLogin: async (role: UserRole) => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Demo personas are disabled in production.");
    }

    let email = "alex.rider@example.com";
    let pass = "Customer@SecurePass2026!";

    if (role === "AGENCY_OWNER") {
      email = "owner@apexrentals.com";
      pass = "Agency@SecurePass2026!";
    } else if (role === "ADMIN") {
      email = "admin@rentigo.com";
      pass = "Admin@SecurePass2026!";
    }

    return get().login(email, pass);
  },
}));
