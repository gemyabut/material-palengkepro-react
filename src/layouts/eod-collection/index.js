import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canViewEodCounts, canApproveEodCounts } from "utils/permissions";
import { listEodCounts, approveEodCount } from "api/cashierIntakes";
import CashierIntakeStatusChip from "./components/CashierIntakeStatusChip";
import ApproveIntakeModal from "./components/ApproveIntakeModal";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_OPTIONS = [
  { value: "PENDING_APPROVAL",  label: "Pending Approval" },
  { value: "ESCALATED",         label: "Override Queue" },
  { value: "POSTED",            label: "Posted" },
  { value: "LOCKED",            label: "Locked" },
  { value: "",                  label: "All" },
];

export default function EodCashCountPage() {
  const role = getRole();
  const navigate = useNavigate();
  const [counts, setCounts]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [statusFilter, setStatusFilter] = useState("PENDING_APPROVAL");
  const [approveTarget, setApproveTarget] = useState(null);
  const [approving, setApproving]       = useState(false);
  const [snack, setSnack]               = useState({ open: false, message: "", severity: "success" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter === "ESCALATED") {
        params.escalated_to_admin = "true";
      } else if (statusFilter) {
        params.status = statusFilter;
      }
      const resp = await listEodCounts(params);
      setCounts(Array.isArray(resp) ? resp : (resp?.results ?? []));
    } catch {
      setError("Failed to load EOD collections.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  if (!canViewEodCounts(role)) return <Navigate to="/dashboard" replace />;

  const handleApprove = async (payload) => {
    setApproving(true);
    try {
      await approveEodCount(approveTarget.id, payload);
      setApproveTarget(null);
      setSnack({ open: true, message: "Count approved. Handover movements created.", severity: "success" });
      load();
    } catch (e) {
      const msg = e?.response?.data?.detail || "Approval failed.";
      setSnack({ open: true, message: msg, severity: "error" });
    } finally {
      setApproving(false);
    }
  };

  const canApprove = canApproveEodCounts(role);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          flexWrap="wrap"
          gap={2}
        >
          <MDTypography variant="h4" fontWeight="bold">
            EOD Collections
          </MDTypography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </MDBox>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <MDBox display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </MDBox>
        ) : counts.length === 0 ? (
          <MDTypography variant="body2" color="secondary">
            No counts found for the selected filter.
          </MDTypography>
        ) : (
          <Paper>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Collector</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Expected</TableCell>
                  <TableCell align="right">Actual</TableCell>
                  <TableCell align="right">Variance</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {counts.map((c) => {
                  const variance = parseFloat(c.variance || 0);
                  return (
                    <TableRow key={c.id} hover>
                      <TableCell>{c.collector_name}</TableCell>
                      <TableCell>{c.date}</TableCell>
                      <TableCell align="right">{peso(c.expected_amount)}</TableCell>
                      <TableCell align="right">{peso(c.actual_amount)}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color:
                            variance === 0 ? "success.main" :
                            variance < 0   ? "error.main" : "info.main",
                        }}
                      >
                        {variance !== 0 && (variance > 0 ? "+" : "")}
                        {peso(variance)}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        <MDTypography variant="caption" sx={{ wordBreak: "break-word" }}>
                          {c.variance_reason || "—"}
                        </MDTypography>
                      </TableCell>
                      <TableCell>
                        <MDBox display="flex" gap={0.5} flexWrap="wrap">
                          <CashierIntakeStatusChip status={c.status} />
                          {c.escalated_to_admin && (
                            <Chip label="Override Pending" color="warning" size="small" />
                          )}
                        </MDBox>
                      </TableCell>
                      <TableCell>
                        {c.status === "OPEN" && (
                          <Button
                            size="small"
                            variant="contained"
                            color="info"
                            onClick={() => navigate(`/eod-collection/${c.id}/submit`)}
                          >
                            Submit Count
                          </Button>
                        )}
                        {c.status === "PENDING_APPROVAL" && (
                          <MDBox display="flex" gap={1} alignItems="center">
                            <Chip label="Submitted" color="info" size="small" />
                            {canApprove && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => setApproveTarget(c)}
                              >
                                Approve
                              </Button>
                            )}
                          </MDBox>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        )}
      </MDBox>

      {approveTarget && (
        <ApproveIntakeModal
          open={!!approveTarget}
          intake={approveTarget}
          onClose={() => !approving && setApproveTarget(null)}
          onConfirm={handleApprove}
          submitting={approving}
        />
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
