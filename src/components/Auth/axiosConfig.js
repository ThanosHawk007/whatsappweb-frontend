import axios from "axios";

// 🔥 Global config

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

axios.defaults.withCredentials = true; // ✅ cookies (access + refresh)

// 🔍 Helper to get cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

// 🔐 REQUEST INTERCEPTOR (CSRF)
axios.interceptors.request.use((config) => {
  const csrfToken = getCookie("XSRF-TOKEN");

  if (csrfToken) {
    config.headers["X-XSRF-TOKEN"] = csrfToken;
  }

  return config;
});

let refreshPromise = null;

// 🔁 RESPONSE INTERCEPTOR (AUTO REFRESH)

axios.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // No response or no request configuration
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    console.log("Inside response interceptor");
    console.log("Status:", error.response.status);

    const requestUrl = originalRequest.url || "";

    // APIs that must never trigger token refresh
    const excludedUrls = [
      "/api/user/login",
      "/api/user/register",
      "/api/user/guest",
      "/api/user/refresh",
    ];

    const isExcludedUrl = excludedUrls.some((url) => requestUrl.includes(url));

    if (
      error.response.status === 401 &&
      !isExcludedUrl &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        console.log("Access token expired. Checking refresh status.");

        // If another request has already started refreshing,
        // wait for that same refresh request.
        if (!refreshPromise) {
          console.log("Starting a new refresh API call.");

          refreshPromise = axios
            .post(
              "/api/user/refresh",
              {},
              {
                withCredentials: true,
              },
            )
            .finally(() => {
              // Allow a future refresh when necessary.
              refreshPromise = null;
            });
        } else {
          console.log("Refresh already running. Waiting for it.");
        }

        // All simultaneous 401 requests wait for the same promise.
        await refreshPromise;

        console.log("Refresh successful. Retrying original request.");

        // Browser automatically sends the newly issued HttpOnly cookie.
        return axios(originalRequest);
      } catch (refreshError) {
        console.log("Refresh failed. Redirecting to login.");

        localStorage.removeItem("userInfo");
        localStorage.removeItem("messages");

        window.location.replace("/");

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axios;
