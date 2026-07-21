import axios from "axios";

// Target the FastAPI backend server URL
let rawUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

// Clean up trailing slashes
rawUrl = rawUrl.replace(/\/+$/, "");

// Automatically append /api/v1 if only the base server host URL was provided
if (!rawUrl.endsWith("/api/v1")) {
  rawUrl = `${rawUrl}/api/v1`;
}

const apiClient = axios.create({
  baseURL: rawUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Automatically inject the active JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401 Unauthorized errors to trigger logout redirect
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired credentials
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Check if we are not already on the login or register pages
      if (
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/register") &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/login?session_expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
