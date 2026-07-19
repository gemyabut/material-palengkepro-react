import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { canAcceptPayments } from "utils/permissions";
import { getEodCount, submitEodCount } from "api/cashierIntakes";
import { verifyCashCount } from "api/cashierIntakeReview";
import { useAuth } from "context/AuthContext";
import AcceptPaymentsForm from "./components/AcceptPaymentsForm";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

// Unit 21.5 F1b-8 — Cashier's one-stop-shop Accept Payments page. Ported the
// rich editable form from the old /eod-collection/:id/submit page (kept
// as-is, unused fallback for now — see AcceptPaymentsForm.js) since the
// read-only F1b-2 DenominationEntryPanel gave the Cashier no way to actually
// enter a count that hadn't already been populated upstream.
//
// Accept Payments now chains 2 backend calls:
//   1. submit  — persists denomination + per-method totals (existing endpoint)
//   2. verify-cash — sets cashier_verified=True (F1a endpoint)
// then navigates back to the list. A denomination-mismatch escalation from
// step 1 stops the chain — step 2 never runs on an escalated intake.
export default function CashVerificationPage() {
  const role = getRole();
  const { userProfile } = useAuth();
  const isStaff = userProfile?.is_staff || false;
  const { id } = useParams();
  const navigate = useNavigate();

  const [intake, setIntake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [acceptErr, setAcceptErr] = useState(null);
  const [denomEscalated, setDenomEscalated] = useState(false);

  const load = useCallback(() => {
    return getEodCount(id).then(setIntake).catch(() => setFetchErr("Could not load this cashier intake."));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  if (!canAcceptPayments(role, isStaff)) return <Navigate to="/eod-collection" replace />;

  const handleAccept = async (payload) => {
    setSubmitting(true);
    setAcceptErr(null);
    setDenomEscalated(false);
    try {
      await submitEodCount(id, payload);
    } catch (e) {
      if (e?.response?.data?.denomination_total) {
        // D2 ASYNC: server escalated for Market Admin override — stop here,
        // do not attempt verify-cash on an escalated intake.
        setDenomEscalated(true);
        try {
          const r = await getEodCount(id);
          setIntake(r);
        } catch {
          // ignore — banner will still show from denomEscalated
        }
        setAcceptErr(
          e.response.data.denomination_total[0] ||
          "Denomination mismatch — flagged for Market Admin override."
        );
      } else {
        setAcceptErr(
          e?.response?.data?.variance_reason?.[0] ||
          e?.response?.data?.detail ||
          "Submission failed."
        );
      }
      setSubmitting(false);
      return;
    }

    try {
      await verifyCashCount(id);
      navigate("/eod-collection");
    } catch (e) {
      setAcceptErr(
        e?.response?.data?.message ||
        "Cash count was recorded, but verification failed — please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {loading && <CircularProgress size={24} />}

        {!loading && fetchErr && (
          <Alert severity="error" icon={false}>
            {fetchErr}
          </Alert>
        )}

        {!loading && intake && (
          <Paper variant="outlined" sx={{ p: 3, maxWidth: 720 }}>
            <MDTypography variant="h5">Accept Payments</MDTypography>
            <MDTypography variant="body2" color="secondary" mb={2}>
              {intake.collector_name} &middot; {intake.date}
            </MDTypography>

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
              </Alert>
            )}

            {intake.denomination_override_by && !intake.escalated_to_admin && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Denomination override approved — you may resubmit.
              </Alert>
            )}

            {acceptErr && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {acceptErr}
              </Alert>
            )}

            {intake.cashier_verified ? (
              <Alert severity="success" icon={false}>
                Cash count verified ✓
              </Alert>
            ) : intake.status !== "OPEN" ? (
              <Alert severity="info">
                This intake is {intake.status} — it cannot be edited.
              </Alert>
            ) : (
              <AcceptPaymentsForm intake={intake} onAccept={handleAccept} submitting={submitting} />
            )}
          </Paper>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}
