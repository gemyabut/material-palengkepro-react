// src/layouts/octal-console/index.js — Unit 26 / F1.4
// Markets-first view: every Market in the platform with its subscription status.
// Unsubscribed markets show "Onboard" → /administration.
// Subscribed markets show tier/status and "View" → detail placeholder.
// Access: role=system_administrator OR is_staff=True.
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  LinearProgress,
  MenuItem,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { useAuthProfile } from "context/AuthContext";
import { getOctalConsoleData } from "api/octalConsole";
import { billMonth } from "../subscription/api/subscription";

// ── Helpers ───────────────────────────────────────────────────────────────────

// BillingAccount.company StringRelatedField returns "Name (CODE)" — extract name only
function companyName(accountDetail) {
  if (!accountDetail?.company) return "—";
  const m = String(accountDetail.company).match(/^(.*)\s+\([^)]+\)$/);
  return m ? m[1] : accountDetail.company;
}

const TIER_COLOR = {
  community: "default",
  standard: "info",
  pro: "secondary",
  enterprise: "success",
};

const STATUS_COLOR = {
  active: "success",
  trialing: "warning",
  suspended: "error",
  cancelled: "error",
  expired: "error",
};

function TierChip({ tier }) {
  const t = (tier || "").toLowerCase();
  return (
    <Chip
      size="small"
      label={t ? t.charAt(0).toUpperCase() + t.slice(1) : "—"}
      color={TIER_COLOR[t] || "default"}
    />
  );
}

function StatusChip({ status }) {
  if (!status) return <Chip size="small" label="—" color="default" />;
  const s = status.toLowerCase();
  const isOrange = s === "past_due";
  return (
    <Chip
      size="small"
      label={s.replace(/_/g, " ")}
      color={isOrange ? "default" : STATUS_COLOR[s] || "default"}
      sx={isOrange ? { bgcolor: "warning.main", color: "white" } : undefined}
    />
  );
}

// ── Summary cards ─────────────────────────────────────────────────────────────

function SummaryCards({ markets, subscriptionByMarketCode }) {
  const total = markets.length;
  const subscribed = markets.filter((m) => subscriptionByMarketCode[m.code]).length;
  const pending = total - subscribed;

  const stats = [
    { label: "Total Markets", value: total, color: "info" },
    { label: "Subscribed", value: subscribed, color: "success" },
    { label: "Pending Onboarding", value: pending, color: pending > 0 ? "warning" : "default" },
  ];

  return (
    <Grid container spacing={2} mb={2}>
      {stats.map((s) => (
        <Grid item xs={12} sm={4} key={s.label}>
          <Card>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <MDTypography variant="caption" color="text" display="block">
                {s.label}
              </MDTypography>
              <MDTypography variant="h4" color={s.color}>
                {s.value}
              </MDTypography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OctalConsole() {
  const { userProfile, loading: authLoading } = useAuthProfile();
  const navigate = useNavigate();

  const [markets, setMarkets] = useState([]);
  const [subscriptionByMarketCode, setSubscriptionByMarketCode] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [billMonthOpen, setBillMonthOpen] = useState(false);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dryRun, setDryRun] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [billSubmitting, setBillSubmitting] = useState(false);
  const [billResult, setBillResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const isAllowed =
    !authLoading &&
    ((userProfile?.role || "").toLowerCase() === "system_administrator" ||
      userProfile?.is_staff === true);

  // Derived from already-loaded subscription data — no extra fetch needed.
  // BillingAccount.company is a StringRelatedField: "Name (CODE)".
  const companyOptions = useMemo(() => {
    const byCode = new Map();
    Object.values(subscriptionByMarketCode).forEach((entry) => {
      const raw = entry?.account?.company;
      if (!raw) return;
      const m = String(raw).match(/\(([^)]+)\)$/);
      const code = m ? m[1] : null;
      if (code && !byCode.has(code)) byCode.set(code, raw);
    });
    return Array.from(byCode.entries()).map(([code, label]) => ({ code, label }));
  }, [subscriptionByMarketCode]);

  const openBillMonth = () => {
    setBillResult(null);
    setBillMonthOpen(true);
  };

  const handleRunBilling = async () => {
    setBillSubmitting(true);
    try {
      const res = await billMonth({
        month,
        dryRun,
        companies: selectedCompanies.length ? selectedCompanies : null,
      });
      setBillResult(res);
      setSnackbar({
        open: true,
        message: dryRun ? "Preview ready." : "Billing run complete — invoices persisted.",
        severity: "success",
      });
      if (!dryRun) load();
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Billing run failed.";
      setSnackbar({ open: true, message: String(msg), severity: "error" });
    } finally {
      setBillSubmitting(false);
    }
  };

  const load = () => {
    setLoading(true);
    setError(null);
    getOctalConsoleData()
      .then(({ markets: m, subscriptionByMarketCode: s }) => {
        setMarkets(m);
        setSubscriptionByMarketCode(s);
      })
      .catch((e) => setError(e?.response?.data?.detail || e.message || "Failed to load."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAllowed) {
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line
  }, [authLoading, isAllowed]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDTypography variant="h4">Octal Console</MDTypography>
          {isAllowed && (
            <MDBox display="flex" gap={1}>
              <Button variant="outlined" color="warning" size="small" onClick={openBillMonth}>
                Bill Month
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={load}
                disabled={loading}
              >
                Refresh
              </Button>
            </MDBox>
          )}
        </MDBox>

        {!authLoading && !isAllowed ? (
          <Alert severity="error">
            Access restricted to Octal platform administrators. Log in as{" "}
            <strong>system_administrator</strong> or an is_staff account.
          </Alert>
        ) : authLoading || loading ? (
          <LinearProgress color="info" />
        ) : error ? (
          <Alert severity="error">{String(error)}</Alert>
        ) : (
          <>
            <SummaryCards
              markets={markets}
              subscriptionByMarketCode={subscriptionByMarketCode}
            />

            <Card>
              <CardContent sx={{ p: 0 }}>
                {markets.length === 0 ? (
                  <MDBox p={4} textAlign="center">
                    <MDTypography variant="body2" color="text">
                      No markets in platform yet.
                    </MDTypography>
                  </MDBox>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: 110 }}>Market Code</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Market Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 130 }}>Subscription Tier</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 110 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 115 }}>Start Date</TableCell>
                        <TableCell sx={{ width: 120 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {markets.map((market) => {
                        const entry = subscriptionByMarketCode[market.code];
                        const sub = entry?.sub;
                        const acct = entry?.account;
                        return (
                          <TableRow key={market.id} hover>
                            <TableCell>
                              <MDTypography variant="button" fontWeight="medium">
                                {market.code}
                              </MDTypography>
                            </TableCell>
                            <TableCell>{market.name}</TableCell>
                            <TableCell>{companyName(acct)}</TableCell>
                            <TableCell>
                              {sub ? (
                                <TierChip tier={sub.tier} />
                              ) : (
                                <Chip size="small" label="Not subscribed" color="default" />
                              )}
                            </TableCell>
                            <TableCell>
                              {sub ? <StatusChip status={sub.status} /> : "—"}
                            </TableCell>
                            <TableCell>{sub?.start_date ?? "—"}</TableCell>
                            <TableCell>
                              {sub ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() =>
                                    navigate(`/octal-console/subscription/${sub.id}`)
                                  }
                                >
                                  View
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => navigate("/administration")}
                                >
                                  Onboard
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Bill Month dialog */}
        <Dialog open={billMonthOpen} onClose={() => setBillMonthOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Run monthly billing</DialogTitle>
          <DialogContent>
            <TextField
              type="month"
              fullWidth
              margin="normal"
              label="Billing period"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={<Switch checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />}
              label={dryRun ? "Dry run (preview only, nothing persisted)" : "Live run — will persist invoices"}
            />
            <TextField
              select
              fullWidth
              margin="normal"
              label="Companies (optional — leave empty for all)"
              SelectProps={{ multiple: true }}
              value={selectedCompanies}
              onChange={(e) => setSelectedCompanies(e.target.value)}
            >
              {companyOptions.map((c) => (
                <MenuItem key={c.code} value={c.code}>{c.label}</MenuItem>
              ))}
            </TextField>

            {billResult && (
              <MDBox mt={2}>
                <MDTypography variant="body2" fontWeight="medium">
                  {billResult.dry_run ? "Preview" : "Persisted"}: {billResult.invoice_count} invoice(s),
                  {" "}total ₱{billResult.total_amount}
                </MDTypography>
                {billResult.invoices.length > 0 && (
                  <Table size="small" sx={{ mt: 1 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Number</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {billResult.invoices.map((inv) => (
                        <TableRow key={inv.number}>
                          <TableCell><code>{inv.number}</code></TableCell>
                          <TableCell>{inv.company_code}</TableCell>
                          <TableCell align="right">₱{inv.total}</TableCell>
                          <TableCell>
                            <Chip size="small" label={inv.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </MDBox>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBillMonthOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color={dryRun ? "info" : "warning"}
              disabled={!month || billSubmitting}
              onClick={handleRunBilling}
            >
              {billSubmitting ? "Running…" : "Run Billing"}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </MDBox>
    </DashboardLayout>
  );
}
