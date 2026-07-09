import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canViewEodCounts, canApproveDenomOverride } from "utils/permissions";
import {
  getEodCount,
  submitEodCount,
  approveDenominationOverride,
  downloadTallyPdf,
} from "api/cashierIntakes";
import CashierIntakeStatusChip from "./components/CashierIntakeStatusChip";
import SubmitIntakeForm from "./components/SubmitIntakeForm";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

export default function SubmitEodCountPage() {
  const role = getRole();
  const { id } = useParams();
  const navigate = useNavigate();
  const [intake, setIntake]                 = useState(null);
  const [loading, setLoading]               = useState(true);
  const [fetchErr, setFetchErr]             = useState(null);
  const [submitErr, setSubmitErr]           = useState(null);
  const [submitting, setSubmitting]         = useState(false);
  const [submitted, setSubmitted]           = useState(false);
  const [denomEscalated, setDenomEscalated] = useState(false);
  const [pdfLoading, setPdfLoading]         = useState(false);
  const [overrideOpen, setOverrideOpen]     = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overriding, setOverriding]         = useState(false);
  const [overrideErr, setOverrideErr]       = useState(null);

  useEffect(() => {
    getEodCount(id)
      .then(setIntake)
      .catch(() => setFetchErr("Could not load cash count record."))
      .finally(() => setLoading(false));
  }, [id]);

  if (!canViewEodCounts(role)) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setSubmitErr(null);
    setDenomEscalated(false);
    try {
      const updated = await submitEodCount(id, payload);
      setIntake(updated);
      setSubmitted(true);
    } catch (e) {
      if (e?.response?.data?.denomination_total) {
        // D2 ASYNC: server escalated; reload to get new escalated_to_admin=True state
        setDenomEscalated(true);
        try { const r = await getEodCount(id); setIntake(r); } catch {}
        setSubmitErr(
          e.response.data.denomination_total[0] ||
          "Denomination mismatch — flagged for Market Admin override."
        );
      } else {
        setSubmitErr(
          e?.response?.data?.variance_reason?.[0] ||
          e?.response?.data?.detail ||
          "Submission failed."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleTallyPdf = async () => {
    setPdfLoading(true);
    try {
      const response = await downloadTallyPdf(id);
      const url = URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cash_tally_${id}_${intake?.date || ""}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setSubmitErr("Tally PDF download failed.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleApproveOverride = async () => {
    if (!overrideReason.trim()) { setOverrideErr("Reason is required."); return; }
    setOverriding(true);
    setOverrideErr(null);
    try {
      const updated = await approveDenominationOverride(id, {
        denomination_override_reason: overrideReason,
      });
      setIntake(updated);
      setOverrideOpen(false);
      setOverrideReason("");
      setDenomEscalated(false);
    } catch (e) {
      setOverrideErr(e?.response?.data?.detail || "Override approval failed.");
    } finally {
      setOverriding(false);
    }
  };

  const isOverrideApprover = canApproveDenomOverride(role);
  const showOverrideApproveBtn = intake?.escalated_to_admin && isOverrideApprover;
  const showTallyPdfBtn = intake && intake.status !== "OPEN";

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
          <Button variant="outlined" size="small" onClick={() => navigate("/eod-collection")}>
            ← Back
          </Button>
          <MDTypography variant="h4" fontWeight="bold">
            End-of-Day Cash Count
          </MDTypography>
          {showTallyPdfBtn && (
            <Button
              variant="outlined"
              color="info"
              size="small"
              onClick={handleTallyPdf}
              disabled={pdfLoading}
            >
              {pdfLoading ? "Generating…" : "Download Tally PDF"}
            </Button>
          )}
        </MDBox>

        {loading && (
          <MDBox display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </MDBox>
        )}

        {!loading && fetchErr && <Alert severity="error">{fetchErr}</Alert>}

        {!loading && intake && (
          <>
            <MDBox display="flex" gap={4} mb={3} flexWrap="wrap">
              <MDBox>
                <MDTypography variant="caption" color="secondary">Collector</MDTypography>
                <MDTypography variant="body2" fontWeight="medium">
                  {intake.collector_name}
                </MDTypography>
              </MDBox>
              <MDBox>
                <MDTypography variant="caption" color="secondary">Date</MDTypography>
                <MDTypography variant="body2" fontWeight="medium">{intake.date}</MDTypography>
              </MDBox>
              <MDBox>
                <MDTypography variant="caption" color="secondary">Status</MDTypography>
                <MDBox mt={0.5}><CashierIntakeStatusChip status={intake.status} /></MDBox>
              </MDBox>
              {intake.escalated_to_admin && (
                <MDBox>
                  <MDTypography variant="caption" color="secondary">Override</MDTypography>
                  <MDTypography variant="caption" display="block" color="warning" fontWeight="bold">
                    ⚠ Pending Admin Approval
                  </MDTypography>
                </MDBox>
              )}
              {intake.denomination_override_by && (
                <MDBox>
                  <MDTypography variant="caption" color="secondary">Override Approved By</MDTypography>
                  <MDTypography variant="caption" display="block" color="success" fontWeight="medium">
                    {intake.denomination_override_by}
                  </MDTypography>
                </MDBox>
              )}
            </MDBox>

            {denomEscalated && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Denomination mismatch escalated to Market Administrator.
                {intake.denomination_override_by
                  ? " Override approved — you may resubmit."
                  : " Await approval before resubmitting."}
              </Alert>
            )}

            {intake.escalated_to_admin && !denomEscalated && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Denomination mismatch is pending Market Admin override.
                {isOverrideApprover ? ' Use "Approve Denomination Override" below.' : ""}
              </Alert>
            )}

            {intake.denomination_override_by && !intake.escalated_to_admin && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Denomination override approved — you may resubmit.
              </Alert>
            )}

            {showOverrideApproveBtn && (
              <MDBox mb={2}>
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  onClick={() => setOverrideOpen(true)}
                >
                  Approve Denomination Override
                </Button>
              </MDBox>
            )}

            {submitErr && <Alert severity="error" sx={{ mb: 2 }}>{submitErr}</Alert>}

            {submitted ? (
              <Alert severity="success">
                Count submitted successfully. Awaiting operator approval.
              </Alert>
            ) : intake.status !== "OPEN" ? (
              <Alert severity="info">
                This count is {intake.status} — it cannot be edited.
              </Alert>
            ) : (
              <SubmitIntakeForm
                intake={intake}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            )}
          </>
        )}
      </MDBox>

      <Dialog open={overrideOpen} onClose={() => setOverrideOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Approve Denomination Override</DialogTitle>
        <DialogContent>
          <MDTypography variant="body2" color="secondary" gutterBottom>
            Provide a reason. The cashier will be able to resubmit after approval.
          </MDTypography>
          <TextField
            label="Override reason *"
            multiline
            rows={3}
            fullWidth
            value={overrideReason}
            onChange={(e) => { setOverrideReason(e.target.value); setOverrideErr(null); }}
            error={!!overrideErr}
            helperText={overrideErr}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideOpen(false)} disabled={overriding}>Cancel</Button>
          <Button
            onClick={handleApproveOverride}
            variant="contained"
            color="warning"
            disabled={overriding}
          >
            {overriding ? "Approving…" : "Approve Override"}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
