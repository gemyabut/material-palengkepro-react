import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Alert, Button, Card, CardContent, Chip, Divider } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { canViewSettings, canManageChargeTypes } from "utils/permissions";
import {
  getExpenseCategory, updateExpenseCategory,
  deactivateExpenseCategory, deleteExpenseCategory,
} from "api/expenseCategories";
import ExpenseCategoryForm from "./components/ExpenseCategoryForm";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try { return (jwtDecode(t).role || "").toLowerCase(); } catch { return ""; }
}

export default function ExpenseCategoryDetailPage() {
  const role = getRole();
  const { id } = useParams();
  const navigate = useNavigate();
  const [cat, setCat] = useState(null);
  const [values, setValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    getExpenseCategory(id)
      .then((data) => { setCat(data); setValues(data); })
      .catch(() => setError("Expense category not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (!canViewSettings(role)) return <Navigate to="/dashboard" replace />;
  if (loading) return null;
  if (!cat) return <MDTypography p={4}>{error || "Not found."}</MDTypography>;

  const canEdit = canManageChargeTypes(role) && cat.is_active;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateExpenseCategory(id, {
        display_name: values.display_name,
        description: values.description,
        typical_channel: values.typical_channel,
        ...(!cat.is_system ? { code: values.code } : {}),
      });
      setCat(updated);
      setValues(updated);
      setSuccess("Saved.");
    } catch (e) {
      setError(e?.response?.data?.detail || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm(`Deactivate "${cat.display_name}"?`)) return;
    try {
      const updated = await deactivateExpenseCategory(id);
      setCat(updated);
      setValues(updated);
      setSuccess("Deactivated.");
    } catch (e) {
      setError(e?.response?.data?.error || "Deactivate failed.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${cat.display_name}" permanently?`)) return;
    try {
      await deleteExpenseCategory(id);
      navigate("/settings/expense-categories");
    } catch (e) {
      setError(e?.response?.data?.error || "Delete failed.");
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" alignItems="center" gap={2} mb={3}>
          <Button variant="outlined" color="dark" size="small" onClick={() => navigate("/settings/expense-categories")}>
            ← Back
          </Button>
          <MDTypography variant="h4" fontWeight="bold">{cat.display_name}</MDTypography>
          <Chip
            size="small"
            label={cat.is_active ? "Active" : "Inactive"}
            color={cat.is_active ? "success" : "default"}
            variant="outlined"
          />
          {cat.is_system && <Chip size="small" label="system" />}
        </MDBox>

        {error   && <Alert severity="error"   sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Card sx={{ maxWidth: 520 }}>
          <CardContent>
            <ExpenseCategoryForm
              values={values}
              onChange={setValues}
              isSystem={cat.is_system}
              disabled={!canEdit || saving}
            />

            {canEdit && (
              <MDBox mt={3} display="flex" gap={2} flexWrap="wrap">
                <Button variant="contained" color="info" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button variant="outlined" onClick={() => setValues(cat)} disabled={saving}>
                  Reset
                </Button>
              </MDBox>
            )}

            {canManageChargeTypes(role) && (
              <>
                <Divider sx={{ my: 3 }} />
                <MDBox display="flex" gap={2} flexWrap="wrap">
                  {cat.is_active && (
                    <Button variant="outlined" color="warning" onClick={handleDeactivate}>
                      Deactivate
                    </Button>
                  )}
                  {!cat.is_system && (
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
