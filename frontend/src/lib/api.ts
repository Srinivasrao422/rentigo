function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const configured = process.env.NEXT_PUBLIC_API_URL;
    // If not set, or set to un-deployed railway placeholder, use same-origin relative /api/v1
    if (!configured || configured.includes("rentigo-backend.up.railway.app")) {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      return isLocal ? "http://localhost:5001/api/v1" : "/api/v1";
    }
    return configured;
  }
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (!configured || configured.includes("rentigo-backend.up.railway.app")) {
    return "/api/v1";
  }
  return configured;
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

const apiUnavailable = "We can’t reach RentiGo right now. Please try again in a moment.";

async function fetchWithFallback(url: string, endpoint: string, options: RequestInit) {
  try {
    const res = await fetch(url, options);
    // If external service returns 404 or 502/503 (e.g. railway down), and url is not /api/v1, fallback to /api/v1
    if (!res.ok && (res.status === 404 || res.status >= 502) && !url.startsWith("/api/v1")) {
      const fallbackUrl = `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
      try {
        const fallbackRes = await fetch(fallbackUrl, options);
        if (fallbackRes.ok) return fallbackRes;
      } catch {
        // keep original response
      }
    }
    return res;
  } catch (error) {
    if (options.signal?.aborted) throw error;
    // Network error or CORS failure from unreachable external host: fallback to /api/v1
    if (!url.startsWith("/api/v1") && typeof window !== "undefined") {
      try {
        const fallbackUrl = `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
        const fallbackRes = await fetch(fallbackUrl, options);
        return fallbackRes;
      } catch {
        // fallback also failed
      }
    }
    throw new Error(apiUnavailable);
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers, ...rest } = options;

  let accessToken = typeof window !== "undefined" ? localStorage.getItem("rentigo_access_token") : null;

  const requestHeaders = new Headers(headers);
  if (typeof rest.body === "string" && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (requiresAuth && accessToken && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response = await fetchWithFallback(url, endpoint, {
    headers: requestHeaders,
    ...rest,
  });

  // Attempt automatic token refresh on 401
  if (response.status === 401 && requiresAuth && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("rentigo_refresh_token");
    if (refreshToken) {
      try {
        const refreshRes = await fetchWithFallback(`${baseUrl}/auth/refresh-token`, "/auth/refresh-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData.data?.accessToken;
          const newRefreshToken = refreshData.data?.refreshToken;

          if (newAccessToken) {
            localStorage.setItem("rentigo_access_token", newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem("rentigo_refresh_token", newRefreshToken);
            }

            // Retry original request with new token
            requestHeaders.set("Authorization", `Bearer ${newAccessToken}`);
            response = await fetchWithFallback(url, endpoint, {
              headers: requestHeaders,
              ...rest,
            });
          }
        } else {
          // Token expired completely, clear storage
          localStorage.removeItem("rentigo_access_token");
          localStorage.removeItem("rentigo_refresh_token");
          localStorage.removeItem("rentigo_user");
          window.dispatchEvent(new Event("auth-logout"));
        }
      } catch {
        // Fall through
      }
    }
  }

  if (response.headers.get("x-railway-fallback") === "true" || response.status >= 500) {
    throw new Error(apiUnavailable);
  }

  const json = await response.json().catch(() => {
    throw new Error(apiUnavailable);
  });

  if (!response.ok) {
    const errorMsg =
      json.errors?.[0]?.message || json.message || "An unexpected error occurred";
    throw new Error(errorMsg);
  }

  return json.data !== undefined ? json.data : json;
}
