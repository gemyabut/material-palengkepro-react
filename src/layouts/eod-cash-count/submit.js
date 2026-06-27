import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canViewEodCounts } from "utils/permissions";
import { getEodCount, submitEodCount } from "api/cashierIntakes";
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
  const [intake, setIntake]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [fetchErr, setFetchErr]   = useState(null);
  const [submitErr, setSubmitErr] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    try {
      const updated = await submitEodCount(id, payload);
      setIntake(updated);
      setSubmitted(true);
    } catch (e) {
      const msg =
        e?.response?.data?.variance_reason?.[0] ||
        e?.response?.data?.detail ||
        "Submission failed.";
      setSubmitErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" alignItems="center" gap={2} mb={3}>
          <Button variant="outlined" size="small" onClick={() => navigate("/eod-cash-count")}>
            ← Back
          </Button>
          <MDTypography variant="h4" fontWeight="bold">
            End-of-Day Cash Count
          </MDTypography>
        </MDBox>

        {loading && (
          <MDBox display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </MDBox>
        )}

        {!loading && fetchErr && (
          <Alert severity="error">{fetchErr}</Alert>
        )}

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
                <MDBox mt={0.5}>
                  <CashierIntakeStatusChip status={intake.status} />
                </MDBox>
              </MDBox>
            </MDBox>

            {submitErr && (
              <Alert severity="error" sx={{ mb: 2 }}>{submitErr}</Alert>
            )}

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
    </DashboardLayout>
  );
}
