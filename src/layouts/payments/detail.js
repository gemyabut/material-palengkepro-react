import { useState, useEffect, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import PaymentStatusBadge from "components/PaymentStatusBadge";
import { canViewPayments, canCorrectFlaggedPayment } from "utils/permissions";
import { getPayment } from "api/payments";
import { correctPayment } from "api/cashierIntakeReview";

const REASON_LABELS = {
  WRONG_TENANT: "Wrong Tenant",
  WRONG_CHARGE: "Wrong Charge Type",
  WRONG_AMOUNT: "Wrong Amount",
  FAKE_RECEIPT: "Suspected Fake Receipt",
  OTHER: "Other",
};

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

// Unit 21.5 F1b-4: minimal payment detail page — status badge, flag reason
// display, and the Correct form for A/R. AuditLog correction history is
// deferred (follow-up item, not built here — see F1b-4 dispatch notes).
export default function PaymentDetailPage() {
  const role = getRole();
  const { id } = useParams();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [leaseId, setLeaseId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [correctError, setCorrectError] = useState(null);
  const [correctSuccess, setCorrectSuccess] = useState(false);

  const refetch = useCallback(() => {
    return getPayment(id)
      .then(setPayment)
      .catch(() => setError("Could not load this payment."));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    refetch().finally(() => setLoading(false));
  }, [refetch]);

  if (!canViewPayments(role)) return <Navigate to="/dashboard" replace />;

  const handleCorrect = async () => {
    setSubmitting(true);
    setCorrectError(null);
    setCorrectSuccess(false);
    const payload = {};
    if (leaseId.trim()) payload.lease_id = leaseId.trim();
    if (amount.trim()) payload.amount = amount.trim();
    try {
      const updated = await correctPayment(id, payload);
      setPayment(updated);
      setLeaseId("");
      setAmount("");
      setCorrectSuccess(true);
    } catch (e) {
      setCorrectError(
        e?.response?.data?.non_field_errors?.[0] ||
          e?.response?.data?.detail ||
          "Could not correct payment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {loading && <CircularProgress size={24} />}

        {!loading && error && (
          <Alert severity="error" icon={false}>
            {error}
          </Alert>
        )}

        {!loading && payment && (
          <Paper variant="outlined" sx={{ p: 3, maxWidth: 640 }}>
            <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <MDTypography variant="h5">Payment #{payment.id}</MDTypography>
              <PaymentStatusBadge status={payment.status} />
            </MDBox>

            <MDTypography variant="body2" color="secondary">
              {payment.tenant_name || "—"} &middot; {payment.stall_code || "—"} &middot;{" "}
              {payment.payment_type}
            </MDTypography>
            <MDTypography variant="h6" mt={1}>
              {peso(payment.amount)}
            </MDTypography>
            <MDTypography variant="body2" color="secondary">
              Receipt: {payment.receipt_type}-{payment.receipt_number || "—"}
            </MDTypography>

            {payment.status === "FLAGGED" && (
              <MDBox mt={3}>
                <Divider sx={{ mb: 2 }} />
                <Alert severity="error" icon={false} sx={{ mb: 2 }}>
                  <MDTypography variant="subtitle2" fontWeight="medium">
                    {REASON_LABELS[payment.ar_flag_reason] || payment.ar_flag_reason}
                  </MDTypography>
                  {payment.ar_flag_note && (
                    <MDTypography variant="body2">{payment.ar_flag_note}</MDTypography>
                  )}
                  <MDTypography variant="caption" color="secondary" display="block" mt={1}>
                    Flagged by {payment.ar_flagged_by_username || "—"} on{" "}
                    {payment.ar_flagged_at ? new Date(payment.ar_flagged_at).toLocaleString() : "—"}
                  </MDTypography>
                </Alert>

                {canCorrectFlaggedPayment(role) && (
                  <MDBox>
                    <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
                      Correct Payment
                    </MDTypography>
                    <MDBox display="flex" gap={2} flexWrap="wrap" alignItems="flex-start">
                      <TextField
                        label="New Lease ID"
                        size="small"
                        value={leaseId}
                        onChange={(e) => setLeaseId(e.target.value)}
                      />
                      <TextField
                        label="New Amount"
                        size="small"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <Button
                        variant="contained"
                        color="warning"
                        disabled={submitting || (!leaseId.trim() && !amount.trim())}
                        onClick={handleCorrect}
                      >
                        {submitting ? "Correcting…" : "Correct"}
                      </Button>
                    </MDBox>
                    {correctError && (
                      <Alert severity="error" sx={{ mt: 1.5 }} icon={false}>
                        {correctError}
                      </Alert>
                    )}
                    {correctSuccess && (
                      <Alert severity="success" sx={{ mt: 1.5 }} icon={false}>
                        Payment corrected and returned to APPROVED.
                      </Alert>
                    )}
                  </MDBox>
                )}
              </MDBox>
            )}
          </Paper>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}
