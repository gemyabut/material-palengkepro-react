import React, { useState, useEffect, useCallback } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import {
  canViewCashAccountability,
  canSignMarketAdmin,
  canSignAR,
  canSignOwner,
  canReopenPeriodClose,
} from "utils/permissions";
import {
  getPeriodClose,
  signMarketAdmin,
  signAR,
  signOwner,
  reopenPeriod,
  closePeriodManually,
  periodClosePdfUrl,
} from "api/periodClose";
import { getCashAccountabilityDashboard } from "api/cashAccountability";
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

const STATUS_COLOR = {
  DRAFT: "default",
  PENDING_SIGN_OFF: "warning",
  CLOSED: "success",
  RE_OPENED: "info",
};

function StatusBadge({ status }) {
  return (
    <Chip
      label={status?.replace(/_/g, " ") ?? "—"}
      color={STATUS_COLOR[status] ?? "default"}
      size="small"
    />
  );
}

function SignerPanel({ label, signedAt, signedBy, canSign, onSign, signing }) {
  const signed = Boolean(signedAt);
  return (
    <Paper variant="outlined" sx={{ p: 2, flex: "1 1 180px", minWidth: 0 }}>
      <MDTypography variant="caption" color="secondary" display="block" mb={0.5}>
        {label}
      </MDTypography>
      {signed ? (
        <>
          <Chip label="Signed ✓" color="success" size="small" sx={{ mb: 0.5 }} />
          <MDTypography variant="body2" color="text.secondary" display="block">
            {signedBy?.username ?? "—"}
          </MDTypography>
          <MDTypography variant="caption" color="text.secondary">
            {signedAt ? new Date(signedAt).toLocaleString() : ""}
          </MDTypography>
        </>
      ) : (
        <>
          <MDTypography variant="body2" color="text.secondary">
            Awaiting signature
          </MDTypography>
          {canSign && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mt: 1 }}
              disabled={signing}
              onClick={onSign}
            >
              {signing ? "Signing…" : "Sign"}
            </Button>
          )}
        </>
      )}
    </Paper>
  );
}

function ReopenModal({ open, onClose, onConfirm, submitting }) {
  const [reason, setReason] = useState("");
  const handleSubmit = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };
  return (
    <Dialog open={open} onClose={() => !submitting && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Reopen Period</DialogTitle>
      <DialogContent>
        <MDTypography variant="body2" color="text.secondary" mb={2}>
          Re-opening will clear existing signatures. Both Market Admin and AR must re-sign before
          the period can be closed again.
        </MDTypography>
        <TextField
          autoFocus
          label="Reason for reopening"
          multiline
          rows={3}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={submitting}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          disabled={submitting || !reason.trim()}
        >
          {submitting ? "Reopening…" : "Reopen"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function MonthlyClosePage() {
  const { id } = useParams();
  const role = getRole();
  const navigate = useNavigate();
  const { userProfile, loading: profileLoading } = useProfile();
  const marketId = userProfile?.primary_market ?? userProfile?.primary_market_id;

  const [pc, setPc] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signing, setSigning] = useState(null); // "admin" | "ar" | "owner"
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const loadPc = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pcData = await getPeriodClose(id);
      setPc(pcData);
      if (marketId) {
        const period = `${pcData.period_start?.slice(0, 7)}`;
        const dash = await getCashAccountabilityDashboard({ market: marketId, period });
        setDashboard(dash);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load period close.");
    } finally {
      setLoading(false);
    }
  }, [id, marketId]);

  useEffect(() => {
    if (!profileLoading) loadPc();
  }, [loadPc, profileLoading]);

  if (!canViewCashAccountability(role)) return <Navigate to="/dashboard" replace />;

  const showSnack = (message, severity = "success") => setSnack({ open: true, message, severity });

  const handleSign = async (which) => {
    setSigning(which);
    try {
      const fn = which === "admin" ? signMarketAdmin : which === "ar" ? signAR : signOwner;
      const updated = await fn(id);
      setPc(updated);
      showSnack("Signed successfully.");
    } catch (e) {
      const msg = e?.response?.data?.error || "Sign action failed.";
      showSnack(msg, "error");
    } finally {
      setSigning(null);
    }
  };

  const handleReopen = async (reason) => {
    setReopening(true);
    try {
      const updated = await reopenPeriod(id, reason);
      setPc(updated);
      setReopenOpen(false);
      showSnack("Period reopened. Signatures cleared.");
    } catch (e) {
      const msg = e?.response?.data?.error || "Reopen failed.";
      showSnack(msg, "error");
    } finally {
      setReopening(false);
    }
  };

  const handleDownloadPdf = () => {
    const url = periodClosePdfUrl(id);
    window.open(`/api${url}`, "_blank");
  };

  const inv = pc?.status === "CLOSED"
    ? {
        collected: pc.snapshot_collected,
        deposited: pc.snapshot_deposited,
        approved_deductions: pc.snapshot_approved_deductions,
        cash_in_transit: pc.snapshot_cash_in_transit,
        variance:
          Number(pc.snapshot_collected ?? 0) -
          Number(pc.snapshot_deposited ?? 0) -
          Number(pc.snapshot_approved_deductions ?? 0) -
          Number(pc.snapshot_cash_in_transit ?? 0),
        invariant_pass: pc.snapshot_invariant_pass,
      }
    : dashboard?.invariant;

  const alerts = dashboard?.alerts ?? [];
  const batchSummary = dashboard?.live_batches_summary ?? {};
  const dedSummary = dashboard?.live_deductions_summary ?? {};

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={3}
          flexWrap="wrap"
          gap={2}
        >
          <MDBox>
            <MDTypography variant="h4" fontWeight="bold">
              Monthly Close
            </MDTypography>
            {pc && (
              <MDTypography variant="body2" color="text.secondary" mt={0.5}>
                Market: <strong>{pc.market}</strong> &nbsp;·&nbsp; Period:{" "}
                <strong>
                  {pc.period_start} to {pc.period_end}
                </strong>
              </MDTypography>
            )}
          </MDBox>
          <MDBox display="flex" gap={1} alignItems="center" flexWrap="wrap">
            {pc && <StatusBadge status={pc.status} />}
            {pc?.status === "CLOSED" && (
              <Button
                variant="outlined"
                size="small"
                color="info"
                onClick={handleDownloadPdf}
              >
                Download PDF
              </Button>
            )}
            {pc && canReopenPeriodClose(role) && pc.status === "CLOSED" && (
              <Button
                variant="outlined"
                size="small"
                color="warning"
                onClick={() => setReopenOpen(true)}
              >
                Reopen Period
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              color="dark"
              onClick={() => navigate("/cash-accountability")}
            >
              ← Dashboard
            </Button>
          </MDBox>
        </MDBox>

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

        {!loading && pc && (
          <>
            {/* ── Signature block ──────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <MDTypography variant="h6" fontWeight="medium" mb={2}>
                Sign-Off
              </MDTypography>
              <MDBox display="flex" gap={2} flexWrap="wrap">
                <SignerPanel
                  label="Market Administrator"
                  signedAt={pc.market_admin_signed_at}
                  signedBy={pc.market_admin_signed_by}
                  canSign={canSignMarketAdmin(role) && !pc.market_admin_signed_at && pc.status !== "CLOSED"}
                  onSign={() => handleSign("admin")}
                  signing={signing === "admin"}
                />
                <SignerPanel
                  label="AR Lead"
                  signedAt={pc.ar_signed_at}
                  signedBy={pc.ar_signed_by}
                  canSign={
                    canSignAR(role) &&
                    !pc.ar_signed_at &&
                    Boolean(pc.market_admin_signed_at) &&
                    pc.status !== "CLOSED"
                  }
                  onSign={() => handleSign("ar")}
                  signing={signing === "ar"}
                />
                <SignerPanel
                  label="Owner (Optional)"
                  signedAt={pc.owner_signed_at}
                  signedBy={pc.owner_signed_by}
                  canSign={canSignOwner(role) && !pc.owner_signed_at && pc.status !== "CLOSED"}
                  onSign={() => handleSign("owner")}
                  signing={signing === "owner"}
                />
              </MDBox>
              {pc.status !== "CLOSED" && !pc.market_admin_signed_at && (
                <MDTypography variant="caption" color="text.secondary" display="block" mt={1}>
                  Market Administrator must sign first.
                </MDTypography>
              )}
              {pc.status === "PENDING_SIGN_OFF" && pc.market_admin_signed_at && !pc.ar_signed_at && (
                <MDTypography variant="caption" color="text.secondary" display="block" mt={1}>
                  Waiting for AR Lead signature. Period closes automatically once both sign.
                </MDTypography>
              )}
            </Paper>

            <Divider sx={{ mb: 3 }} />

            {/* ── Invariant snapshot ───────────────────────────────────── */}
            {inv && (
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                  <MDTypography variant="h6" fontWeight="medium">
                    Cash Accountability Invariant
                    {pc.status === "CLOSED" && (
                      <Chip
                        label="Snapshot"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </MDTypography>
                  <Chip
                    label={inv.invariant_pass ? "BALANCED ✓" : "VARIANCE DETECTED ✗"}
                    color={inv.invariant_pass ? "success" : "error"}
                    size="small"
                  />
                </MDBox>
                <MDBox
                  display="grid"
                  sx={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 2 }}
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
                        color={key === "variance" && !inv.invariant_pass ? "error" : "text.primary"}
                      >
                        {peso(inv[key])}
                      </MDTypography>
                    </MDBox>
                  ))}
                </MDBox>
              </Paper>
            )}

            {/* ── Alerts ───────────────────────────────────────────────── */}
            {alerts.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <MDTypography variant="h6" fontWeight="medium" mb={1}>
                  Alerts
                </MDTypography>
                {alerts.map((a, i) => (
                  <Alert
                    key={i}
                    severity={{ CRITICAL: "error", WARNING: "warning", INFO: "info" }[a.severity] ?? "info"}
                    sx={{ mb: 1 }}
                  >
                    {a.message}
                  </Alert>
                ))}
              </Paper>
            )}

            {/* ── Batch + Deduction summaries ───────────────────────────── */}
            <MDBox
              display="grid"
              sx={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 2, mb: 3 }}
            >
              <Paper variant="outlined" sx={{ p: 2 }}>
                <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
                  Remittance Batches
                </MDTypography>
                <MDBox display="flex" gap={3}>
                  <MDBox>
                    <MDTypography variant="caption" color="secondary">Posted</MDTypography>
                    <MDTypography variant="body2" fontWeight="medium">
                      {batchSummary.posted_count ?? 0} · {peso(batchSummary.posted_amount)}
                    </MDTypography>
                  </MDBox>
                  <MDBox>
                    <MDTypography variant="caption" color="secondary">Confirmed</MDTypography>
                    <MDTypography variant="body2" fontWeight="medium" color="success.main">
                      {batchSummary.confirmed_count ?? 0} · {peso(batchSummary.confirmed_amount)}
                    </MDTypography>
                  </MDBox>
                </MDBox>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
                  Cash Deductions
                </MDTypography>
                <MDBox display="flex" gap={3} flexWrap="wrap">
                  <MDBox>
                    <MDTypography variant="caption" color="secondary">Pending</MDTypography>
                    <MDTypography
                      variant="body2"
                      fontWeight="medium"
                      color={(dedSummary.pending_count ?? 0) > 0 ? "warning.main" : "text.primary"}
                    >
                      {dedSummary.pending_count ?? 0}
                    </MDTypography>
                  </MDBox>
                  <MDBox>
                    <MDTypography variant="caption" color="secondary">Overdue</MDTypography>
                    <MDTypography
                      variant="body2"
                      fontWeight="medium"
                      color={(dedSummary.overdue_count ?? 0) > 0 ? "error.main" : "text.primary"}
                    >
                      {dedSummary.overdue_count ?? 0}
                    </MDTypography>
                  </MDBox>
                  <MDBox>
                    <MDTypography variant="caption" color="secondary">Approved total</MDTypography>
                    <MDTypography variant="body2" fontWeight="medium">
                      {peso(dedSummary.approved_total)}
                    </MDTypography>
                  </MDBox>
                </MDBox>
              </Paper>
            </MDBox>

            {/* ── Reopen info (if RE_OPENED) ───────────────────────────── */}
            {pc.status === "RE_OPENED" && pc.reopened_by && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <MDTypography variant="subtitle2" fontWeight="medium" mb={0.5}>
                  Reopened
                </MDTypography>
                <MDTypography variant="body2" color="text.secondary">
                  By {pc.reopened_by?.username} on{" "}
                  {pc.reopened_at ? new Date(pc.reopened_at).toLocaleString() : "—"}
                </MDTypography>
                <MDTypography variant="body2" mt={0.5}>
                  Reason: {pc.reopened_reason}
                </MDTypography>
              </Paper>
            )}
          </>
        )}
      </MDBox>

      <ReopenModal
        open={reopenOpen}
        onClose={() => !reopening && setReopenOpen(false)}
        onConfirm={handleReopen}
        submitting={reopening}
      />

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
