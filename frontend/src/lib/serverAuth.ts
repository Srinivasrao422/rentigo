import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { serverStore, StoreUser } from "./serverStore";

let ephemeralSecret: string | null = null;

function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (!ephemeralSecret) {
    ephemeralSecret =
      process.env.NODE_ENV === "production"
        ? crypto.randomBytes(32).toString("hex")
        : "rentigo-dev-secret-key-change-in-prod";
    if (process.env.NODE_ENV === "production") {
      console.warn("[RentiGo Auth] JWT_SECRET is not set; using ephemeral runtime secret.");
    }
  }
  return ephemeralSecret;
}

const ACCESS_TOKEN_TTL_SEC = 2 * 60 * 60; // 2 hours
const REFRESH_TOKEN_TTL_SEC = 7 * 24 * 60 * 60; // 7 days

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: "CUSTOMER" | "AGENCY_OWNER" | "ADMIN";
  firstName: string;
  lastName: string;
  agencyId?: string;
  type: "access" | "refresh";
  iat: number;
  exp: number;
}

export function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPasswordSync(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;
  try {
    const keyBuf = Buffer.from(keyHex, "hex");
    const derivedBuf = crypto.scryptSync(password, salt, 64);
    if (keyBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
  } catch {
    return false;
  }
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

export function signToken(
  user: Pick<StoreUser, "id" | "email" | "role" | "firstName" | "lastName"> & { agencyId?: string },
  type: "access" | "refresh" = "access"
): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (type === "access" ? ACCESS_TOKEN_TTL_SEC : REFRESH_TOKEN_TTL_SEC);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload: AuthTokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    ...(user.agencyId ? { agencyId: user.agencyId } : {}),
    type,
    iat: now,
    exp,
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(
    crypto.createHmac("sha256", getJwtSecret()).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string, expectedType: "access" | "refresh" = "access"): AuthTokenPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;
  const expectedSig = base64UrlEncode(
    crypto.createHmac("sha256", getJwtSecret()).update(`${header}.${body}`).digest()
  );

  try {
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const decoded = JSON.parse(base64UrlDecode(body)) as AuthTokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!decoded.exp || decoded.exp < now) {
      return null;
    }
    if (decoded.type !== expectedType) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export function authenticateRequest(request: NextRequest): {
  user: StoreUser | null;
  payload: AuthTokenPayload | null;
  errorResponse?: NextResponse;
} {
  const token = extractBearerToken(request);
  if (!token) {
    return {
      user: null,
      payload: null,
      errorResponse: NextResponse.json(
        { success: false, message: "Authentication token required" },
        { status: 401 }
      ),
    };
  }

  const payload = verifyToken(token, "access");
  if (!payload) {
    return {
      user: null,
      payload: null,
      errorResponse: NextResponse.json(
        { success: false, message: "Invalid or expired authentication token" },
        { status: 401 }
      ),
    };
  }

  const user = serverStore.users.find((u) => u.id === payload.id);
  if (!user || !user.isActive) {
    return {
      user: null,
      payload: null,
      errorResponse: NextResponse.json(
        { success: false, message: "User account is inactive or no longer exists" },
        { status: 401 }
      ),
    };
  }

  return { user, payload };
}

export function requireRoles(
  request: NextRequest,
  allowedRoles: Array<"CUSTOMER" | "AGENCY_OWNER" | "ADMIN">
): {
  user: StoreUser | null;
  payload: AuthTokenPayload | null;
  errorResponse?: NextResponse;
} {
  const auth = authenticateRequest(request);
  if (auth.errorResponse || !auth.user) return auth;

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      user: null,
      payload: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          message: `Access denied: requires one of [${allowedRoles.join(", ")}]`,
        },
        { status: 403 }
      ),
    };
  }

  return auth;
}

// Sliding-window rate limiter for auth endpoints (15 requests per 15 minutes per IP)
const authRateMap = new Map<string, number[]>();

export function checkAuthRateLimit(request: NextRequest, limit = 15, windowMs = 15 * 60 * 1000): boolean {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
  const now = Date.now();
  const timestamps = (authRateMap.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (timestamps.length >= limit) {
    authRateMap.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  authRateMap.set(ip, timestamps);
  return true;
}

export function sanitizeUserPublic(user: StoreUser) {
  const { passwordHash: _ph, refreshToken: _rt, mfaSecret: _ms, ...safe } = user;
  return safe;
}
