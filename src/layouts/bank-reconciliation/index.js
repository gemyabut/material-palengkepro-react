import React, { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canViewRemittanceRec, canConfirmBatches } from "utils/permissions";
import { destinationLabel } from "utils/destinationLabels";
import { getBankReconciliation } from "api/bankReconciliation";
import { confirmBatch } from "api/remittanceBatches";
import useProfile from "layouts/profile/hooks/useProfile";
import BankAccountAccordion from "./components/BankAccountAccordion";
import ConfirmDepositModal from "../deposit-batches/components/ConfirmDepositModal";
import "./bank-rec.css";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function BankReconciliationPage() {
  const role = getRole();
  const { userProfile, loading: profileLoading } = useProfile();
  const marketId = userProfile?.primary_market ?? userProfile?.primary_market_id;

  const [periodStart, setPeriodStart] = useState(firstOfMonth());
  const [periodEnd, setPeriodEnd] = useState(today());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const load = useCallback(async () => {
    if (profileLoading || !marketId) return;
    setLoading(true);
    setError(null);
    try {
      setData(
        await getBankReconciliation({
          market_id: marketId,
          period_start: periodStart,
          period_end: periodEnd,
        })
      );
    } catch {
      setError("Failed to load reconciliation report.");
    } finally {
      setLoading(false);
    }
  }, [marketId, periodStart, periodEnd, profileLoading]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canViewRemittanceRec(role)) return <Navigate to="/dashboard" replace />;

  const canConfirm = canConfirmBatches(role);
  const destinationType = data?.market?.destination_type ?? "BANK";
  const pageTitle = destinationLabel(destinationType, "pageTitle");

  const handleConfirm = async (refValue) => {
    setConfirming(true);
    try {
      const refField = destinationLabel(
        confirmTarget.destination_type ?? destinationType,
        "refField"
      );
      await confirmBatch(confirmTarget.id, refValue, refField);
      setConfirmTarget(null);
      setSnack({
        open: true,
        message: "Batch confirmed. Cash movements created.",
        severity: "success",
      });
      load();
    } catch (e) {
      const msg = e?.response?.data?.detail || "Confirmation failed.";
      setSnack({ open: true, message: msg, severity: "error" });
    } finally {
      setConfirming(false);
    }
  };

  const totals = data?.totals;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* Header + controls */}
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
          flexWrap="wrap"
          gap={2}
        >
          <MDTypography variant="h4" fontWeight="bold">
            {pageTitle}
          </MDTypography>
          <MDBox display="flex" gap={2} alignItems="center" flexWrap="wrap" className="no-print">
            <TextField
              label="Period start"
              type="date"
              size="small"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Period end"
              type="date"
              size="small"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="outlined"
              color="dark"
              size="small"
              onClick={load}
              className="no-print"
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              color="dark"
              size="small"
              onClick={() => window.print()}
              className="no-print"
            >
              Print
            </Button>
          </MDBox>
        </MDBox>

        {/* Sticky summary bar */}
        {data && (
          <Paper
            variant="outlined"
            sx={{ p: 2, mb: 3, display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}
          >
            <MDBox>
              <MDTypography variant="caption" color="secondary">
                Market
              </MDTypography>
              <MDTypography variant="body2" fontWeight="medium">
                {data.market?.name}
              </MDTypography>
            </MDBox>
            <MDBox>
              <MDTypography variant="caption" color="secondary">
                Period
              </MDTypography>
              <MDTypography variant="body2">
                {data.period_start} → {data.period_end}
              </MDTypography>
            </MDBox>
            <MDBox>
              <MDTypography variant="caption" color="secondary">
                Confirmed
              </MDTypography>
              <MDTypography variant="body2" fontWeight="medium" color="success">
                {totals?.confirmed_count || 0} batches · {peso(totals?.confirmed_amount)}
              </MDTypography>
            </MDBox>
            <MDBox>
              <MDTypography variant="caption" color="secondary">
                Unmatched
              </MDTypography>
              <MDTypography
                variant="body2"
                fontWeight="medium"
                color={totals?.unmatched_count ? "error" : "success"}
              >
                {totals?.unmatched_count || 0} batches · {peso(totals?.unmatched_amount)}
              </MDTypography>
            </MDBox>
          </Paper>
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

        {!loading && data && data.by_bank_account.length === 0 && (
          <MDTypography variant="body2" color="secondary">
            No deposits found for this period.
          </MDTypography>
        )}

        {!loading &&
          data &&
          data.by_bank_account.map((entry) => (
            <BankAccountAccordion
              key={entry.bank_name}
              entry={entry}
              destinationType={destinationType}
              canConfirm={canConfirm}
              onConfirmClick={setConfirmTarget}
            />
          ))}

        {!loading && data?.deductions && (
          <MDBox mt={3}>
            <MDTypography variant="h6" mb={1}>
              Cash Deductions — This Period
            </MDTypography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {data.deductions.by_category?.length === 0 ? (
                <MDTypography variant="body2" color="secondary">
                  No approved deductions.
                </MDTypography>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "#f5f5f5" }}>
                      <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 700 }}>
                        Category
                      </th>
                      <th style={{ textAlign: "right", padding: "6px 10px", fontWeight: 700 }}>
                        Count
                      </th>
                      <th style={{ textAlign: "right", padding: "6px 10px", fontWeight: 700 }}>
                        Approved total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.deductions.by_category || []).map((row) => (
                      <tr key={row.expense_category_id} style={{ borderTop: "1px solid #eee" }}>
                        <td style={{ padding: "5px 10px" }}>{row.display_name}</td>
                        <td style={{ padding: "5px 10px", textAlign: "right" }}>{row.count}</td>
                        <td style={{ padding: "5px 10px", textAlign: "right", fontWeight: 600 }}>
                          {peso(row.total)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: "2px solid #ddd", fontWeight: 700 }}>
                      <td style={{ padding: "6px 10px" }}>Total approved</td>
                      <td />
                      <td style={{ padding: "6px 10px", textAlign: "right" }}>
                        {peso(data.deductions.approved_total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
              {Number(data.deductions.pending_total) > 0 && (
                <MDTypography variant="caption" color="warning.main" display="block" mt={1}>
                  {peso(data.deductions.pending_total)} pending approval (not included above)
                </MDTypography>
              )}
            </Paper>
          </MDBox>
        )}
      </MDBox>

      {confirmTarget && (
        <ConfirmDepositModal
          open={!!confirmTarget}
          batch={confirmTarget}
          onClose={() => !confirming && setConfirmTarget(null)}
          onConfirm={handleConfirm}
          submitting={confirming}
        />
      )}

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
