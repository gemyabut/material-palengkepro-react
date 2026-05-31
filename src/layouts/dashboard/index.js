/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Button from "@mui/material/Button";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// JWT helper for role
function getRoleFromToken() {
  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  if (!token) return "guest";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || "guest";
  } catch (e) {
    return "guest";
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);

  // 1. Auth check BEFORE anything else
  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/authentication/sign-in" replace />;
  }
  const rawRole = getRoleFromToken();
  const role = rawRole === "executive" ? "admin" : rawRole;

  // 2. Data fetch
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/dashboard/admin-market/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("access_token");
          sessionStorage.removeItem("access_token");
          // On next render, token will be missing and <Navigate /> will trigger
          window.location.reload();
          return;
        }
        if (!res.ok) throw new Error("Could not load dashboard data.");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Could not load dashboard data.");
        setLoading(false);
      });
    // eslint-disable-next-line
  }, [refresh]);

  const handleRefresh = () => setRefresh((r) => !r);

  // 3. Normal role-based dashboard UI
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
        <Grid item>
          <Button onClick={handleRefresh} variant="outlined" startIcon={<Icon>refresh</Icon>}>
            Refresh
          </Button>
        </Grid>
      </Grid>
      {loading ? (
        <Grid container justifyContent="center" alignItems="center" style={{ minHeight: 200 }}>
          <CircularProgress />
        </Grid>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Admin/Market Manager */}
          {(role === "admin" || role === "market_manager") && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="info"
                  icon={<Icon fontSize="large">groups</Icon>}
                  title="Total Tenants"
                  count={stats.kpis?.occupancy?.total_tenants ?? 0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="success"
                  icon={<Icon fontSize="large">storefront</Icon>}
                  title="Total Stalls"
                  count={stats.kpis?.occupancy?.total_stalls ?? 0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="warning"
                  icon={<Icon fontSize="large">assignment</Icon>}
                  title="Active Leases"
                  count={stats.kpis?.occupancy?.active_leases ?? 0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="primary"
                  icon={<Icon fontSize="large">payments</Icon>}
                  title="Total Payments"
                  count={`₱${Number(stats.kpis?.collections?.total_payments ?? 0).toLocaleString()}`}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
            </>
          )}

          {/* Collector */}
          {role === "collector" && (
            <Grid item xs={12} sm={6} md={4}>
              <ComplexStatisticsCard
                color="primary"
                icon={<Icon fontSize="large">payments</Icon>}
                title="Today's Collections"
                count={`₱${stats.todays_collections?.toLocaleString() ?? "0"}`}
                percentage={{ color: "success", amount: "", label: "" }}
              />
            </Grid>
          )}

          {/* Tenant */}
          {role === "tenant" && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <ComplexStatisticsCard
                  color="info"
                  icon={<Icon fontSize="large">storefront</Icon>}
                  title="My Stalls"
                  count={stats.my_stalls ?? 0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <ComplexStatisticsCard
                  color="success"
                  icon={<Icon fontSize="large">assignment</Icon>}
                  title="My Leases"
                  count={stats.my_leases ?? 0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <ComplexStatisticsCard
                  color="primary"
                  icon={<Icon fontSize="large">payments</Icon>}
                  title="My Payments"
                  count={`₱${stats.my_payments?.toLocaleString() ?? "0"}`}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
            </>
          )}

          {/* Guest */}
          {role === "guest" && (
            <Grid item xs={12} md={6}>
              <ComplexStatisticsCard
                color="info"
                icon={<Icon fontSize="large">person</Icon>}
                title="Welcome, Guest!"
                count=""
                percentage={{
                  color: "info",
                  amount: "",
                  label: "Please sign up or log in to access your dashboard.",
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/authentication/sign-up")}
                sx={{ mt: 2 }}
              >
                Register Now
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate("/authentication/sign-in")}
                sx={{ mt: 2, ml: 2 }}
              >
                Sign In
              </Button>
            </Grid>
          )}

          {/* Default for unknown roles */}
          {!role ||
            (!["admin", "market_manager", "collector", "tenant", "guest"].includes(role) && (
              <Grid item xs={12}>
                <ComplexStatisticsCard
                  color="warning"
                  icon={<Icon fontSize="large">error</Icon>}
                  title="Unknown Role"
                  count=""
                  percentage={{
                    color: "warning",
                    amount: "",
                    label: "Please contact admin for access.",
                  }}
                />
              </Grid>
            ))}
        </Grid>
      )}
    </DashboardLayout>
  );
}
