const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

const apiUnavailable = "We can’t reach RentiGo right now. Please try again in a moment.";

async function fetchApi(url: string, options: RequestInit) {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (options.signal?.aborted) throw error;
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

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response = await fetchApi(url, {
    headers: requestHeaders,
    ...rest,
  });

  // Attempt automatic token refresh on 401
  if (response.status === 401 && requiresAuth && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("rentigo_refresh_token");
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
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
            response = await fetchApi(url, {
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
