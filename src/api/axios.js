// src/api/axios.js
import axios from "axios";
import { jwtDecode } from "jwt-decode";

// API base URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// Axios instance
const instance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Utility to get token from storage
const getAccessToken = () =>
  localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

const getRefreshToken = () =>
  localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");

// Utility to decode and check expiration
const isTokenExpired = (token) => {
  try {
    const { exp } = jwt_decode(token);
    return Date.now() >= exp * 1000;
  } catch (e) {
    return true;
  }
};

// Store token utility
const storeAccessToken = (token) => {
  localStorage.setItem("access_token", token);
  sessionStorage.setItem("access_token", token); // fallback
};

// Log out utility
const logout = () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/authentication/sign-in";
};

// --- 1. REQUEST INTERCEPTOR ---
instance.interceptors.request.use(
  async (config) => {
    let accessToken = getAccessToken();

    // --- 2. CHECK IF TOKEN IS EXPIRED ---
    if (accessToken && isTokenExpired(accessToken)) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          accessToken = response.data.access;
          storeAccessToken(accessToken);
        } catch (err) {
          logout();
          return Promise.reject(err);
        }
      } else {
        logout();
        return Promise.reject(new Error("No refresh token found"));
      }
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --- 3. RESPONSE INTERCEPTOR ---
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/jwt/create/") &&
      !originalRequest.url.includes("/auth/refresh/")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        storeAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
