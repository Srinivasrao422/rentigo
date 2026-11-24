const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers = {}, ...rest } = options;

  let accessToken = typeof window !== "undefined" ? localStorage.getItem("rentigo_access_token") : null;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(requiresAuth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(headers as Record<string, string>),
  };

  // Remove Content-Type for FormData
  if (rest.body instanceof FormData) {
    delete defaultHeaders["Content-Type"];
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response = await fetch(url, {
    headers: defaultHeaders,
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
            defaultHeaders["Authorization"] = `Bearer ${newAccessToken}`;
            response = await fetch(url, {
              headers: defaultHeaders,
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

  const json = await response.json();

  if (!response.ok) {
    const errorMsg =
      json.errors?.[0]?.message || json.message || "An unexpected error occurred";
    throw new Error(errorMsg);
  }

  return json.data !== undefined ? json.data : json;
}
