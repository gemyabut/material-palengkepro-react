import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Button, Card, CardContent } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { canManageChargeTypes } from "utils/permissions";
import { createChargeType } from "api/chargeTypes";
import ChargeTypeForm from "./components/ChargeTypeForm";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try { return (jwtDecode(t).role || "").toLowerCase(); } catch { return ""; }
}

const DEFAULTS = { code: "", display_name: "", description: "", priority_rank: 99, is_recurring: false };

export default function CreateChargeTypePage() {
  const role = getRole();
  const navigate = useNavigate();
  const [values, setValues] = useState(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!canManageChargeTypes(role)) return <Navigate to="/settings/charge-types" replace />;

  const handleSubmit = async () => {
    if (!values.code || !values.display_name) {
      setError("Code and Display Name are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const ct = await createChargeType({
        code: values.code,
        display_name: values.display_name,
        description: values.description,
        priority_rank: Number(values.priority_rank) || 99,
        is_recurring: values.is_recurring,
      });
      navigate(`/settings/charge-types/${ct.id}`);
    } catch (e) {
      const msg = e?.response?.data?.code?.[0] || e?.response?.data?.detail || "Create failed.";
      setError(msg);
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" alignItems="center" gap={2} mb={3}>
          <Button variant="outlined" color="dark" size="small" onClick={() => navigate("/settings/charge-types")}>
            ← Back
          </Button>
          <MDTypography variant="h4" fontWeight="bold">New Charge Type</MDTypography>
        </MDBox>
        <Card sx={{ maxWidth: 520 }}>
          <CardContent>
            <ChargeTypeForm values={values} onChange={setValues} error={error} disabled={submitting} />
            <MDBox mt={3} display="flex" gap={2}>
              <Button
                variant="contained"
                color="info"
                onClick={handleSubmit}
                disabled={submitting || !values.code || !values.display_name}
              >
                {submitting ? "Saving…" : "Create"}
              </Button>
              <Button variant="outlined" onClick={() => navigate("/settings/charge-types")}>
                Cancel
              </Button>
            </MDBox>
          </CardContent>
        </Card>
      </MDBox>
    </DashboardLayout>
  );
}
