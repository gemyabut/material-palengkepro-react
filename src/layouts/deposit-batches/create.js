import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canEditBatches, canOverrideDestination } from "utils/permissions";
import { createBatch } from "api/remittanceBatches";
import { getMarket } from "api/markets";
import CreateBatchForm from "./components/CreateBatchForm";
import useProfile from "layouts/profile/hooks/useProfile";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

export default function CreateDepositBatchPage() {
  const role = getRole();
  const navigate = useNavigate();
  const { userProfile } = useProfile();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [marketData, setMarketData] = useState(null); // { code, destinationType }

  useEffect(() => {
    const mid = userProfile?.primary_market ?? userProfile?.primary_market_id;
    if (!mid) return;
    getMarket(mid)
      .then((m) => setMarketData({ code: m.code, destinationType: m.destination_type ?? "BANK" }))
      .catch(() => setMarketData({ code: "", destinationType: "BANK" }));
  }, [userProfile]);

  if (!canEditBatches(role)) return <Navigate to="/deposit-batches" replace />;

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError(null);
    try {
      const batch = await createBatch(payload);
      navigate(`/deposit-batches/${batch.id}`);
    } catch (e) {
      const detail =
        e?.response?.data?.dc_ids || e?.response?.data?.detail || "Failed to create batch.";
      setError(Array.isArray(detail) ? detail.join(" ") : detail);
      setSubmitting(false);
    }
  };

  const profileReady = userProfile !== null && userProfile?.role !== "guest";
  const showForm = profileReady && marketData !== null;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" alignItems="center" gap={2} mb={3}>
          <Button variant="outlined" color="dark" size="small" onClick={() => navigate("/deposit-batches")}>
            ← Back
          </Button>
          <MDTypography variant="h4" fontWeight="bold">
            New Deposit Batch
          </MDTypography>
        </MDBox>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {showForm ? (
          <CreateBatchForm
            marketCode={marketData.code}
            destinationType={marketData.destinationType}
            canOverride={canOverrideDestination(role)}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        ) : (
          <MDTypography variant="body2" color="secondary">
            {profileReady ? "Loading market…" : "Loading profile…"}
          </MDTypography>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
