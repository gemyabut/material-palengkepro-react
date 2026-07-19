import { useState, useEffect, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { canViewEodCounts } from "utils/permissions";
import { getEodCount } from "api/cashierIntakes";
import CashierIntakeHeader from "./components/CashierIntakeHeader";
import PaymentList from "./components/PaymentList";
import FlagDialog from "./components/FlagDialog";
import CashierIntakeSummary from "./components/CashierIntakeSummary";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

// Unit 21.5 F1b-2: Phase D review page — Cashier verifies the cash count,
// A/R reviews per-payment (flag/correct/approve). Both gates passing fires
// the backend dual-gate signal (finance/signals.py) that posts the intake.
export default function CashierIntakeDetailPage() {
  const role = getRole();
  const { id } = useParams();

  const [intake, setIntake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flagTarget, setFlagTarget] = useState(null);

  const refetch = useCallback(() => {
    return getEodCount(id)
      .then(setIntake)
      .catch(() => setError("Could not load this cashier intake."));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    refetch().finally(() => setLoading(false));
  }, [refetch]);

  if (!canViewEodCounts(role)) return <Navigate to="/dashboard" replace />;

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

        {!loading && intake && (
          <>
            <CashierIntakeHeader intake={intake} role={role} onVerified={setIntake} />

            <PaymentList payments={intake.payments} role={role} onFlag={setFlagTarget} />

            <CashierIntakeSummary intake={intake} role={role} payments={intake.payments} />

            <FlagDialog
              open={!!flagTarget}
              payment={flagTarget}
              onClose={() => setFlagTarget(null)}
              onFlagged={refetch}
            />
          </>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}
