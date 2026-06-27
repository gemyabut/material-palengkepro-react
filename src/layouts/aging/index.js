import React, { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canViewAging } from "utils/permissions";
import { getAgingReport } from "api/aging";
import AgingKPICards from "./components/AgingKPICards";
import AgingBarChart from "./components/AgingBarChart";
import AgingBucketTable from "./components/AgingBucketTable";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try { return (jwtDecode(t).role || "").toLowerCase(); } catch { return ""; }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AgingDashboard() {
  const role = getRole();
  const allowed = canViewAging(role);

  const [asOf, setAsOf]           = useState(todayISO());
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [pastDueOnly, setPastDueOnly] = useState(false);

  const fetchReport = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAgingReport(date);
      setData(result);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Failed to load aging report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) fetchReport(asOf);
  }, [asOf, fetchReport, allowed]);

  if (!allowed) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* Header + controls */}
        <MDBox mb={3} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <MDTypography variant="h4" fontWeight="bold">
            Aging Dashboard
          </MDTypography>
          <MDBox display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <TextField
              type="date"
              size="small"
              label="As of date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={pastDueOnly}
                  onChange={(e) => setPastDueOnly(e.target.checked)}
                  color="error"
                />
              }
              label="Past due only"
            />
          </MDBox>
        </MDBox>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <MDBox display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </MDBox>
        )}

        {!loading && data && (
          <>
            {/* KPI cards */}
            <AgingKPICards byBucket={data.by_bucket} />

            {/* Bar chart + summary stats */}
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} md={8}>
                <AgingBarChart byBucket={data.by_bucket} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <MDTypography variant="h6" gutterBottom>
                      Summary
                    </MDTypography>
                    <MDTypography variant="body2" color="secondary">
                      As of: <strong>{data.as_of}</strong>
                    </MDTypography>
                    <MDTypography variant="body2" color="secondary">
                      Tenants with balances: <strong>{data.by_bucket?.tenant_count ?? 0}</strong>
                    </MDTypography>
                    <MDTypography variant="body2" color="secondary">
                      Open invoices: <strong>{data.by_bucket?.invoice_count ?? 0}</strong>
                    </MDTypography>
                    <MDTypography variant="body2" color="secondary" mt={1}>
                      Total outstanding:{" "}
                      <strong>
                        ₱{Number(data.by_bucket?.total ?? 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </strong>
                    </MDTypography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Per-tenant table */}
            <Card>
              <CardContent>
                <MDTypography variant="h6" gutterBottom>
                  Per-Tenant Breakdown
                </MDTypography>
                <MDTypography variant="caption" color="secondary" display="block" mb={1}>
                  Click a row to open the tenant in Tenant Inquiry.
                </MDTypography>
                <AgingBucketTable rows={data.by_tenant || []} pastDueOnly={pastDueOnly} />
              </CardContent>
            </Card>
          </>
        )}

        {!loading && !data && !error && (
          <MDBox py={4} textAlign="center">
            <MDTypography variant="body2" color="secondary">
              No data loaded.
            </MDTypography>
          </MDBox>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
