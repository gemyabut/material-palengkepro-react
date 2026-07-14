import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { canVerifyCashCount } from "utils/permissions";
import { getEodCount } from "api/cashierIntakes";
import DenominationEntryPanel from "layouts/cashier-intake/components/DenominationEntryPanel";
import VerifyCashCountButton from "layouts/cashier-intake/components/VerifyCashCountButton";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ReadOnlyTotal({ label, value }) {
  return (
    <MDBox mt={3}>
      <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
        {label}
      </MDTypography>
      <Divider sx={{ mb: 1.5 }} />
      <MDTypography variant="h6">{peso(value)}</MDTypography>
    </MDBox>
  );
}

// Unit 21.5 F1b-7 Page 2 — Cashier's Cash Verification page. Separates the
// cashier's own work (accept the day's cash) from A/R's Post Payments page,
// instead of both roles sharing /cashier-intake/:id.
export default function CashVerificationPage() {
  const role = getRole();
  const { id } = useParams();
  const navigate = useNavigate();

  const [intake, setIntake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    return getEodCount(id)
      .then(setIntake)
      .catch(() => setError("Could not load this cashier intake."));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  if (!canVerifyCashCount(role)) return <Navigate to="/eod-collection" replace />;

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
          <Paper variant="outlined" sx={{ p: 3, maxWidth: 640 }}>
            <MDTypography variant="h5">Cash Verification</MDTypography>
            <MDTypography variant="body2" color="secondary">
              {intake.collector_name} &middot; {intake.date}
            </MDTypography>

            <MDBox mt={3}>
              <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
                Cash
              </MDTypography>
              <Divider sx={{ mb: 1.5 }} />
              <DenominationEntryPanel intake={intake} />
            </MDBox>

            <ReadOnlyTotal label="GCash" value={intake.total_gcash} />
            <ReadOnlyTotal label="Bank" value={intake.total_bank} />
            <ReadOnlyTotal label="Check" value={intake.total_check} />

            <VerifyCashCountButton
              intake={intake}
              label="Accept Cash"
              onVerified={() => navigate("/eod-collection")}
            />
          </Paper>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}
