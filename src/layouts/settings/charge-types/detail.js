import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Alert, Button, Card, CardContent, Chip, Divider } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { canViewSettings, canManageChargeTypes } from "utils/permissions";
import { getChargeType, updateChargeType, deactivateChargeType, deleteChargeType } from "api/chargeTypes";
import ChargeTypeForm from "./components/ChargeTypeForm";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try { return (jwtDecode(t).role || "").toLowerCase(); } catch { return ""; }
}

export default function ChargeTypeDetailPage() {
  const role = getRole();
  const { id } = useParams();
  const navigate = useNavigate();
  const [ct, setCt] = useState(null);
  const [values, setValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    getChargeType(id)
      .then((data) => { setCt(data); setValues(data); })
      .catch(() => setError("Charge type not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (!canViewSettings(role)) return <Navigate to="/dashboard" replace />;
  if (loading) return null;
  if (!ct) return <MDTypography p={4}>{error || "Not found."}</MDTypography>;

  const canEdit = canManageChargeTypes(role) && ct.is_active;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateChargeType(id, {
        display_name: values.display_name,
        description: values.description,
        priority_rank: Number(values.priority_rank) || 99,
        is_recurring: values.is_recurring,
        ...(!ct.is_system ? { code: values.code } : {}),
      });
      setCt(updated);
      setValues(updated);
      setSuccess("Saved.");
    } catch (e) {
      setError(e?.response?.data?.detail || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm(`Deactivate "${ct.display_name}"? It will be hidden from dropdowns.`)) return;
    try {
      const updated = await deactivateChargeType(id);
      setCt(updated);
      setValues(updated);
      setSuccess("Deactivated.");
    } catch (e) {
      setError(e?.response?.data?.error || "Deactivate failed.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${ct.display_name}" permanently?`)) return;
    try {
      await deleteChargeType(id);
      navigate("/settings/charge-types");
    } catch (e) {
      setError(e?.response?.data?.error || "Delete failed.");
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
          <MDTypography variant="h4" fontWeight="bold">{ct.display_name}</MDTypography>
          <Chip
            size="small"
            label={ct.is_active ? "Active" : "Inactive"}
            color={ct.is_active ? "success" : "default"}
            variant="outlined"
          />
          {ct.is_system && <Chip size="small" label="system" />}
        </MDBox>

        {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Card sx={{ maxWidth: 520 }}>
          <CardContent>
            <ChargeTypeForm
              values={values}
              onChange={setValues}
              isSystem={ct.is_system}
              disabled={!canEdit || saving}
            />

            {canEdit && (
              <MDBox mt={3} display="flex" gap={2} flexWrap="wrap">
                <Button variant="contained" color="info" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button variant="outlined" onClick={() => setValues(ct)} disabled={saving}>
                  Reset
                </Button>
              </MDBox>
            )}

            {canManageChargeTypes(role) && (
              <>
                <Divider sx={{ my: 3 }} />
                <MDBox display="flex" gap={2} flexWrap="wrap">
                  {ct.is_active && (
                    <Button variant="outlined" color="warning" onClick={handleDeactivate}>
                      Deactivate
                    </Button>
                  )}
                  {!ct.is_system && (
                    <Button variant="outlined" color="error" onClick={handleDelete}>
                      Delete
                    </Button>
                  )}
                </MDBox>
              </>
            )}
          </CardContent>
        </Card>
      </MDBox>
    </DashboardLayout>
  );
}
