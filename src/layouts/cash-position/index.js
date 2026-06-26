import React, { useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canViewCash } from "utils/permissions";
import { getCashPosition } from "api/cashPosition";
import AccountTypeSection from "./components/AccountTypeSection";

const ACCOUNT_TYPES = ["COLLECTOR_POCKET", "OPERATOR_SAFE", "BANK_PENDING", "BANK"];

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try { return (jwtDecode(t).role || "").toLowerCase(); } catch { return ""; }
}

function fmtAsOf(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function CashPositionDashboard() {
  const role = getRole();
  if (!canViewCash(role)) return <Navigate to="/dashboard" replace />;

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getCashPosition());
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.detail || e.message || "Failed to load cash position.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load on first render
  React.useEffect(() => { fetchData(); }, [fetchData]);

  const totalCount = data
    ? ACCOUNT_TYPES.reduce((n, t) => n + (data[t]?.length ?? 0), 0)
    : 0;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* Header */}
        <MDBox mb={3} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <MDBox>
            <MDTypography variant="h4" fontWeight="bold">
              Cash Position
            </MDTypography>
            {data?.market && (
              <MDTypography variant="caption" color="secondary">
                {data.market.name} ({data.market.code})
              </MDTypography>
            )}
          </MDBox>
          <MDBox display="flex" alignItems="center" gap={2} flexWrap="wrap">
            {data?.as_of && (
              <MDTypography variant="caption" color="secondary">
                As of: <strong>{fmtAsOf(data.as_of)}</strong>
              </MDTypography>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<Icon>refresh</Icon>}
              onClick={fetchData}
              disabled={loading}
            >
              Refresh
            </Button>
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
            {/* 4 account type sections */}
            {ACCOUNT_TYPES.map((type) => (
              <AccountTypeSection
                key={type}
                accountType={type}
                accounts={data[type] ?? []}
              />
            ))}

            {/* Grand total footer */}
            <Card>
              <CardContent>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs>
                    <MDTypography variant="h6">Total cash in market</MDTypography>
                    <MDTypography variant="caption" color="secondary">
                      Across {totalCount} account{totalCount !== 1 ? "s" : ""}
                    </MDTypography>
                  </Grid>
                  <Grid item>
                    <MDTypography variant="h4" fontWeight="bold">
                      {peso(data.totals?.grand_total ?? 0)}
                    </MDTypography>
                  </Grid>
                </Grid>
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
