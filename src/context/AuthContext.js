import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "../api/axios";
import { debugLog } from "../layouts/stalls/utils/debug";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get access token from storage
  const getToken = () =>
    localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

  // Set Authorization header
  const setAxiosAuthHeader = (token) => {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  // Clear Authorization header
  const clearAxiosAuthHeader = () => {
    delete axios.defaults.headers.common["Authorization"];
  };

  // Fetch profile from backend
  const fetchProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      debugLog("[AuthContext] No token — using guest profile");
      setUserProfile({ role: "guest", username: "Guest" });
      setLoading(false);
      return;
    }

    setAxiosAuthHeader(token);
    setLoading(true);
    try {
      const { data } = await axios.get("/users/profile/");
      setUserProfile(data);
      debugLog("[AuthContext] Profile loaded:", data);
    } catch (err) {
      debugLog("[AuthContext] Profile fetch failed:", err);
      setUserProfile({ role: "guest", username: "Guest" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Login and store tokens
  const login = async ({ access_token, refresh_token }) => {
    if (!access_token) return;

    localStorage.setItem("access_token", access_token);
    if (refresh_token) {
      localStorage.setItem("refresh_token", refresh_token);
    }

    setAxiosAuthHeader(access_token);
    await fetchProfile();
  };

  // Logout and clear everything
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    clearAxiosAuthHeader();
    setUserProfile({ role: "guest", username: "Guest" });
    setLoading(false);
    debugLog("[AuthContext] Logged out. Guest profile set.");
  };

  // Manual refresh
  const refreshProfile = async () => {
    debugLog("[AuthContext] Refreshing...");
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        setUserProfile,
        loading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Custom hooks
export function useAuth() {
  const ctx = useContext(AuthContext);
  debugLog("[useAuth] Context:", ctx);
  return ctx;
}

export function useAuthProfile() {
  const { userProfile, loading } = useAuth();
  return { userProfile, loading };
}

export function useAuthLoading() {
  const { loading } = useAuth();
  return loading;
}

export { AuthContext };
