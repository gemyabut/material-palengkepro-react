import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Alert, Button, Chip, CircularProgress, FormControl, FormControlLabel,
  InputLabel, MenuItem, Paper, Select, Switch,
  Table, TableBody, TableCell, TableHead, TableRow,
} from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { canViewSettings, canManageChargeTypes } from "utils/permissions";
import { listExpenseCategories, deactivateExpenseCategory } from "api/expenseCategories";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try { return (jwtDecode(t).role || "").toLowerCase(); } catch { return ""; }
}

const CHANNELS = [
  { value: "",              label: "All Channels" },
  { value: "CHECK",         label: "Check" },
  { value: "CASH_DEDUCTION",label: "Cash Deduction" },
  { value: "PETTY_CASH",   label: "Petty Cash" },
  { value: "BANK_INITIATED",label: "Bank-Initiated" },
  { value: "ANY",           label: "Any" },
];

export default function ExpenseCategoryListPage() {
  const role = getRole();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [channelFilter, setChannelFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (activeOnly)     params.active_only = "true";
      if (channelFilter)  params.channel = channelFilter;
      // Fetch up to 100 entries (small dataset per market)
      const res = await listExpenseCategories({ ...params, page_size: 100 });
      setRows(res?.results ?? (Array.isArray(res) ? res : []));
    } catch {
      setError("Failed to load expense categories.");
    } finally {
      setLoading(false);
    }
  }, [activeOnly, channelFilter]);

  useEffect(() => { load(); }, [load]);

  if (!canViewSettings(role)) return <Navigate to="/dashboard" replace />;

  const handleDeactivate = async (cat) => {
    if (!window.confirm(`Deactivate "${cat.display_name}"?`)) return;
    try {
      await deactivateExpenseCategory(cat.id);
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
          <MDTypography variant="h4" fontWeight="bold">Expense Categories</MDTypography>
          <MDBox display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Channel</InputLabel>
              <Select value={channelFilter} label="Channel" onChange={(e) => setChannelFilter(e.target.value)}>
                {CHANNELS.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} size="small" />}
              label={<MDTypography variant="caption">Active only</MDTypography>}
            />
            {canManageChargeTypes(role) && (
              <Button variant="contained" color="info" onClick={() => navigate("/settings/expense-categories/new")}>
                + Add Category
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
                  <TableCell>Channel</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell align="center">Status</TableCell>
                  {canManageChargeTypes(role) && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <MDTypography variant="body2" color="secondary">No categories found.</MDTypography>
                    </TableCell>
                  </TableRow>
                ) : rows.map((cat) => (
                  <TableRow key={cat.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/settings/expense-categories/${cat.id}`)}>
                    <TableCell><code>{cat.code}</code></TableCell>
                    <TableCell>{cat.display_name}</TableCell>
                    <TableCell>{cat.channel_display || cat.typical_channel}</TableCell>
                    <TableCell>
                      {cat.market ? (
                        <Chip size="small" label={cat.market_code || "Market"} variant="outlined" color="primary" />
                      ) : (
                        <Chip size="small" label="Global" variant="outlined" color="default" />
                      )}
                      {cat.is_system && <Chip size="small" label="system" sx={{ ml: 0.5 }} />}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={cat.is_active ? "Active" : "Inactive"}
                        color={cat.is_active ? "success" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    {canManageChargeTypes(role) && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button size="small" onClick={() => navigate(`/settings/expense-categories/${cat.id}`)}>Edit</Button>
                        {cat.is_active && (
                          <Button size="small" color="warning" onClick={() => handleDeactivate(cat)}>
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
