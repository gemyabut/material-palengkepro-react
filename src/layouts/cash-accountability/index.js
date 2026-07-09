import React, { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canViewCashAccountability } from "utils/permissions";
import { getCashAccountabilityDashboard } from "api/cashAccountability";
import { getMarket } from "api/markets";
import useProfile from "layouts/profile/hooks/useProfile";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function currentYYYYMM() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}`;
}

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function splitPeriod(yyyyMM) {
  const [year, month] = yyyyMM.split("-");
  return { year, month };
}

function buildPeriod(year, month) {
  return `${year}-${month}`;
}

const ALERT_SEVERITY_COLOR = { CRITICAL: "error", WARNING: "warning", INFO: "info" };

export default function CashAccountabilityPage() {
  const role = getRole();
  const navigate = useNavigate();
  const { userProfile, loading: profileLoading } = useProfile();

  const nowParts = splitPeriod(currentYYYYMM());
  const [year, setYear] = useState(nowParts.year);
  const [month, setMonth] = useState(nowParts.month);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });
  const [marketCode, setMarketCode] = useState("");

  useEffect(() => {
    const id = userProfile?.primary_market ?? userProfile?.primary_market_id;
    if (!id) return;
    getMarket(id).then((m) => setMarketCode(m.code || "")).catch(() => {});
  }, [userProfile]);

  const period = buildPeriod(year, month);

  const load = useCallback(async () => {
    if (profileLoading || !marketCode) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getCashAccountabilityDashboard({ market: marketCode, period }));
    } catch (e) {
      const msg = e?.response?.data?.detail || "Failed to load cash accountability data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [marketCode, period, profileLoading]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canViewCashAccountability(role)) return <Navigate to="/dashboard" replace />;

  const inv = data?.invariant;
  const pc = data?.period_close;
  const isLocked = data?.is_locked ?? false;
  const isFresh = data?.fresh ?? true;
  const alerts = data?.alerts ?? [];
  const batchSummary = data?.live_batches_summary ?? {};
  const dedSummary = data?.live_deductions_summary ?? {};

  const yearOptions = [
    String(Number(nowParts.year) - 1),
    nowParts.year,
    String(Number(nowParts.year) + 1),
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
          flexWrap="wrap"
          gap={2}
        >
          <MDTypography variant="h4" fontWeight="bold">
            Cash Accountability
          </MDTypography>

          <MDBox display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <TextField
              select
              label="Month"
              size="small"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              sx={{ minWidth: 130 }}
            >
              {MONTHS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Year"
              size="small"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              sx={{ minWidth: 90 }}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="outlined" color="dark" size="small" onClick={load}>
              Refresh
            </Button>
          </MDBox>
        </MDBox>

        {/* ── Lock banner ─────────────────────────────────────────────── */}
        {isLocked && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This period is <strong>locked</strong>. Values shown are snapshot from close time. To
            edit, request reopen from an executive or finance manager.
            {!isFresh && (
              <span>
                {" "}
                Data is frozen — last closed{" "}
                {pc?.locked_at ? new Date(pc.locked_at).toLocaleDateString() : ""}.
              </span>
            )}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {(profileLoading || loading) && (
          <MDBox display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </MDBox>
        )}

        {!loading && data && (
          <>
            {/* ── Invariant card ──────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <MDBox
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                flexWrap="wrap"
                gap={1}
              >
                <MDTypography variant="h6" fontWeight="medium">
                  Cash Accountability Invariant
                </MDTypography>
                {inv && (
                  <Chip
                    label={inv.invariant_pass ? "BALANCED ✓" : "VARIANCE DETECTED ✗"}
                    color={inv.invariant_pass ? "success" : "error"}
                    size="small"
                  />
                )}
                {!isFresh && (
                  <Chip label="Snapshot (locked)" color="warning" variant="outlined" size="small" />
                )}
              </MDBox>

              {inv && (
                <MDBox
                  display="grid"
                  sx={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 2 }}
                >
                  {[
                    { label: "Collected", key: "collected" },
                    { label: "Deposited", key: "deposited" },
                    { label: "Deductions", key: "approved_deductions" },
                    { label: "In Transit", key: "cash_in_transit" },
                    { label: "Variance", key: "variance" },
                  ].map(({ label, key }) => (
                    <MDBox key={key}>
                      <MDTypography variant="caption" color="secondary">
                        {label}
                      </MDTypography>
                      <MDTypography
                        variant="body1"
                        fontWeight="medium"
                        color={
                          key === "variance" && !inv.invariant_pass ? "error" : "text.primary"
                        }
                      >
                        {peso(inv[key])}
                      </MDTypography>
                    </MDBox>
                  ))}
                </MDBox>
              )}
            </Paper>

            {/* ── Alerts panel ────────────────────────────────────────── */}
            {alerts.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <MDTypography variant="h6" fontWeight="medium" mb={1}>
                  Alerts
                </MDTypography>
                {alerts.map((a, i) => (
                  <Alert
                    key={i}
                    severity={ALERT_SEVERITY_COLOR[a.severity] ?? "info"}
                    sx={{ mb: 1 }}
                    action={
                      a.target_url ? (
                        <Button
                          color="inherit"
                          size="small"
                          onClick={() => navigate(a.target_url)}
                        >
                          View
                        </Button>
                      ) : null
                    }
                  >
                    {a.message}
                  </Alert>
                ))}
              </Paper>
            )}

            {/* ── Summary cards row ───────────────────────────────────── */}
            <MDBox
              display="grid"
              sx={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 2, mb: 3 }}
            >
              {/* Batch summary */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
                  Remittance Batches
                </MDTypography>
                <MDBox display="flex" gap={3}>
                  <MDBox>
                    <MDTypography variant="caption" color="secondary">
                      Posted
                    </MDTypography>
                    <MDTypography variant="body2" fontWeight="medium">
                      {batchSummary.posted_count ?? 0} · {peso(batchSummary.posted_amount)}
                    </MDTypography>
                  </MDBox>
                  <MDBox>
                    <MDTypography variant="caption" color="secondary">
                      Confirmed
                    </MDTypography>
                    <MDTypography variant="body2" fontWeight="medium" color="success.main">
                      {batchSummary.confirmed_count ?? 0} · {peso(batchSummary.confirmed_amount)}
                    </MDTypography>
                  </MDBox>
                </MDBox>
              </Paper>

              {/* Deduction summary */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
                  Cash Deductions
                </MDTypography>
                <MDBox display="flex" gap={3} flexWrap="wrap">
                  <MDBox>
                    <MDTypography variant="caption" color="secondary">
                      Pending
                    </MDTypography>
                    <MDTypography
                      variant="body2"
                      fontWeight="medium"
                      color={(dedSummary.pending_count ?? 0) > 0 ? "warning.main" : "text.primary"}
                    >
                      {dedSummary.pending_count ?? 0}
                    </MDTypography>
                  </MDBox>
                  <MDBox>
                    <MDTypography variant="caption" color="secondary">
                      Overdue (&gt;30d)
                    </MDTypography>
                    <MDTypography
                      variant="body2"
                      fontWeight="medium"
                      color={(dedSummary.overdue_count ?? 0) > 0 ? "error.main" : "text.primary"}
                    >
                      {dedSummary.overdue_count ?? 0}
                    </MDTypography>
                  </MDBox>
                  <MDBox>
                    <MDTypography variant="caption" color="secondary">
                      Approved total
                    </MDTypography>
                    <MDTypography variant="body2" fontWeight="medium">
                      {peso(dedSummary.approved_total)}
                    </MDTypography>
                  </MDBox>
                </MDBox>
              </Paper>
            </MDBox>

            {/* ── Monthly Close CTA ───────────────────────────────────── */}
            {pc && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <MDBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                  <MDBox>
                    <MDTypography variant="subtitle2" fontWeight="medium">
                      Monthly Close — {period}
                    </MDTypography>
                    <MDTypography variant="caption" color="secondary">
                      Status:{" "}
                      <strong>
                        {pc.status?.replace(/_/g, " ")}
                      </strong>
                    </MDTypography>
                  </MDBox>
                  <Button
                    variant="contained"
                    color="info"
                    size="small"
                    onClick={() => navigate(`/monthly-close/${pc.id}`)}
                  >
                    View Monthly Close
                  </Button>
                </MDBox>
              </Paper>
            )}
          </>
        )}
      </MDBox>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
