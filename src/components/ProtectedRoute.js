import React from "react";
import { Navigate } from "react-router-dom";

// Utility to get role from JWT token
function getRoleFromToken() {
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");
  if (!token) return "guest";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || "guest";
  } catch {
    return "guest";
  }
}

/**
 * Usage:
 * <ProtectedRoute roles={["admin", "market_manager"]}>
 *   <Tenants />
 * </ProtectedRoute>
 * If roles is not provided, any authenticated user can access.
 */
export default function ProtectedRoute({ children, roles }) {
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");
  const userRole = getRoleFromToken();

  if (!token) {
    // Not logged in? Go to login.
    return <Navigate to="/authentication/sign-in" replace />;
  }

  if (roles && !roles.includes(userRole)) {
    // Logged in, but wrong role
    // Option 1: Redirect to dashboard
    return <Navigate to="/dashboard" replace />;
    // Option 2: Show an error page or message (uncomment to use)
    // return <div>You do not have permission to view this page.</div>;
  }

  // Authenticated and authorized
  return children;
}
