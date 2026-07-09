import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canViewDailyVerification } from "utils/permissions";
import { getDailyVerification, downloadDailyVerificationPdf } from "api/dailyVerification";
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
  `₱${Number(v ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// eslint-disable-next-line react/prop-types
function StatusChip({ status }) {
  if (!status) return <Chip label="—" size="small" variant="outlined" />;
  const map = { OPEN: "warning", POSTED: "success", LOCKED: "default" };
  return <Chip label={status} size="small" color={map[status] || "default"} />;
}

// eslint-disable-next-line react/prop-types
function SummaryCard({ label, value, alert }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, textAlign: "center", borderColor: alert ? "error.main" : undefined }}
    >
      <MDTypography variant="h5" fontWeight="bold" color={alert ? "error" : "text"}>
        {value}
      </MDTypography>
      <MDTypography variant="caption" color={alert ? "error" : "secondary"}>
        {label}
      </MDTypography>
    </Paper>
  );
}

export default function DailyVerificationPage() {
  const role = getRole();
  const { userProfile } = useProfile();
  const [market, setMarket] = useState("");
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const id = userProfile?.primary_market ?? userProfile?.primary_market_id;
    if (!id) return;
    getMarket(id).then((m) => setMarket(m.code || "")).catch(() => {});
  }, [userProfile]);

  if (!canViewDailyVerification(role)) return <Navigate to="/dashboard" replace />;

  const handleLoad = async () => {
    if (!market.trim()) {
      setError("Enter a market code.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await getDailyVerification(market.trim().toUpperCase(), date);
      setData(result);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        (e?.response?.status === 404 ? `Market '${market}' not found.` : null) ||
        "Failed to load verification data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      const response = await downloadDailyVerificationPdf(market.trim().toUpperCase(), date);
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daily_verification_${market.trim().toUpperCase()}_${date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("PDF download failed.");
    } finally {
      setPdfLoading(false);
    }
  };

  const s = data?.summary || {};
  const hasIssues = s.escalated_count > 0 || s.missing_count > 0 || s.mismatch_count > 0;
  const actionRequired = (data?.collectors || []).filter(
    (r) => !r.has_intake || r.escalated_to_admin || r.denomination_mismatch
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDTypography variant="h4" fontWeight="bold" mb={3}>
          Daily Collection Verification
        </MDTypography>

        {/* Filter bar */}
        <MDBox display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={3}>
          <TextField
            label="Market Code"
            value={market}
            onChange={(e) => setMarket(e.target.value.toUpperCase())}
            size="small"
            sx={{ width: 160 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLoad();
            }}
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180 }}
          />
          <Button variant="contained" color="info" onClick={handleLoad} disabled={loading}>
            {loading ? <CircularProgress size={16} color="inherit" /> : "Load"}
          </Button>
          {data && (
            <Button variant="outlined" color="error" onClick={handlePdf} disabled={pdfLoading}>
              {pdfLoading ? "Generating…" : "Download PDF"}
            </Button>
          )}
        </MDBox>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {data && (
          <>
            {/* Summary cards */}
            <MDTypography variant="h6" mb={1.5}>
              {data.market_name} — {data.date}
            </MDTypography>
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6} sm={3}>
                <SummaryCard label="Collectors" value={s.collector_count} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <SummaryCard label="Total Expected" value={peso(s.total_expected)} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <SummaryCard label="Total Actual" value={peso(s.total_actual)} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <SummaryCard
                  label="Total Variance"
                  value={peso(s.total_variance)}
                  alert={parseFloat(s.total_variance || 0) !== 0}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <SummaryCard
                  label="Missing Handovers"
                  value={s.missing_count}
                  alert={s.missing_count > 0}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <SummaryCard
                  label="Escalated Overrides"
                  value={s.escalated_count}
                  alert={s.escalated_count > 0}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <SummaryCard
                  label="Denomination Mismatch"
                  value={s.mismatch_count}
                  alert={s.mismatch_count > 0}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <SummaryCard label="Posted" value={s.posted_count} />
              </Grid>
            </Grid>

            {/* Action Required */}
            {hasIssues && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <strong>Action Required:</strong>{" "}
                {actionRequired
                  .map((r) => {
                    const flags = [];
                    if (!r.has_intake) flags.push("missing handover");
                    if (r.escalated_to_admin) flags.push("override pending");
                    if (r.denomination_mismatch) flags.push("denom mismatch");
                    return `${r.collector_name} (${flags.join(", ")})`;
                  })
                  .join(" • ")}
              </Alert>
            )}

            {/* Collector table */}
            <MDTypography variant="h6" mb={1}>
              Collector Breakdown
            </MDTypography>
            <Paper variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Collector</TableCell>
                    <TableCell align="right">DC Cash</TableCell>
                    <TableCell align="right">Expected</TableCell>
                    <TableCell align="right">Actual</TableCell>
                    <TableCell align="right">Variance</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Flags</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.collectors || []).map((row) => {
                    const variance = row.variance !== null ? parseFloat(row.variance) : null;
                    const flags = [];
                    if (!row.has_intake) flags.push({ label: "Missing", color: "error" });
                    if (row.escalated_to_admin)
                      flags.push({ label: "Override Pending", color: "warning" });
                    if (row.denomination_mismatch)
                      flags.push({ label: "Denom Mismatch", color: "warning" });

                    return (
                      <TableRow
                        key={row.collector_id}
                        sx={{
                          bgcolor: !row.has_intake ? "error.light" : undefined,
                          opacity: !row.has_intake ? 0.85 : 1,
                        }}
                      >
                        <TableCell>{row.collector_name}</TableCell>
                        <TableCell align="right">
                          {row.dc_total_cash !== null ? peso(row.dc_total_cash) : "—"}
                        </TableCell>
                        <TableCell align="right">
                          {row.expected !== null ? peso(row.expected) : "—"}
                        </TableCell>
                        <TableCell align="right">
                          {row.actual !== null ? peso(row.actual) : "—"}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color:
                              variance === null
                                ? "inherit"
                                : variance === 0
                                ? "success.main"
                                : variance < 0
                                ? "error.main"
                                : "info.main",
                          }}
                        >
                          {variance !== null ? `${variance > 0 ? "+" : ""}${peso(variance)}` : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={row.status} />
                        </TableCell>
                        <TableCell>
                          <MDBox display="flex" gap={0.5} flexWrap="wrap">
                            {flags.map((f) => (
                              <Chip key={f.label} label={f.label} color={f.color} size="small" />
                            ))}
                          </MDBox>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(data.collectors || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <MDTypography variant="body2" color="secondary">
                          No collection activity for this date.
                        </MDTypography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
