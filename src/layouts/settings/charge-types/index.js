import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Alert, Button, Chip, CircularProgress, FormControlLabel,
  Paper, Switch, Table, TableBody, TableCell, TableHead, TableRow,
} from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { canViewSettings, canManageChargeTypes } from "utils/permissions";
import { listChargeTypes, deactivateChargeType } from "api/chargeTypes";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try { return (jwtDecode(t).role || "").toLowerCase(); } catch { return ""; }
}

export default function ChargeTypeListPage() {
  const role = getRole();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeOnly, setActiveOnly] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listChargeTypes(activeOnly ? { active_only: "true" } : {});
      // Collect all pages (small dataset; max ~50 entries per market)
      const items = res?.results ?? (Array.isArray(res) ? res : []);
      setRows(items);
    } catch {
      setError("Failed to load charge types.");
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => { load(); }, [load]);

  if (!canViewSettings(role)) return <Navigate to="/dashboard" replace />;

  const handleDeactivate = async (ct) => {
    if (!window.confirm(`Deactivate "${ct.display_name}"? It will be hidden from dropdowns.`)) return;
    try {
      await deactivateChargeType(ct.id);
      load();
    } catch (e) {
      setError(e?.response?.data?.error || "Deactivate failed.");
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
          <MDTypography variant="h4" fontWeight="bold">Charge Types</MDTypography>
          <MDBox display="flex" alignItems="center" gap={2}>
            <FormControlLabel
              control={<Switch checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} size="small" />}
              label={<MDTypography variant="caption">Active only</MDTypography>}
            />
            {canManageChargeTypes(role) && (
              <Button variant="contained" color="info" onClick={() => navigate("/settings/charge-types/new")}>
                + Add Charge Type
              </Button>
            )}
          </MDBox>
        </MDBox>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <MDBox display="flex" justifyContent="center" py={6}><CircularProgress /></MDBox>
        ) : (
          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Display Name</TableCell>
                  <TableCell align="center">Priority</TableCell>
                  <TableCell align="center">Recurring</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell align="center">Status</TableCell>
                  {canManageChargeTypes(role) && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <MDTypography variant="body2" color="secondary">No charge types found.</MDTypography>
                    </TableCell>
                  </TableRow>
                ) : rows.map((ct) => (
                  <TableRow key={ct.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/settings/charge-types/${ct.id}`)}>
                    <TableCell><code>{ct.code}</code></TableCell>
                    <TableCell>{ct.display_name}</TableCell>
                    <TableCell align="center">{ct.priority_rank}</TableCell>
                    <TableCell align="center">{ct.is_recurring ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {ct.market ? (
                        <Chip size="small" label={ct.market_code || "Market"} variant="outlined" color="primary" />
                      ) : (
                        <Chip size="small" label="Global" variant="outlined" color="default" />
                      )}
                      {ct.is_system && <Chip size="small" label="system" sx={{ ml: 0.5 }} />}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={ct.is_active ? "Active" : "Inactive"}
                        color={ct.is_active ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    {canManageChargeTypes(role) && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button size="small" onClick={() => navigate(`/settings/charge-types/${ct.id}`)}>Edit</Button>
                        {ct.is_active && (
                          <Button size="small" color="warning" onClick={() => handleDeactivate(ct)}>
                            Deactivate
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
