import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import PostAddIcon from "@mui/icons-material/PostAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canViewEodCounts, canAcceptPayments, canPostPayments } from "utils/permissions";
import { listEodCounts } from "api/cashierIntakes";
import { useAuth } from "context/AuthContext";

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

const DEFAULT_LIMIT = 20;

const STATUS_OPTIONS = [
  { value: "PENDING_APPROVAL",  label: "Pending Approval" },
  { value: "ESCALATED",         label: "Override Queue" },
  { value: "POSTED",            label: "Posted" },
  { value: "LOCKED",            label: "Locked" },
  { value: "",                  label: "All" },
];

// Unit 21.5 F1b-6/F1b-7: one button per row, driven by the dual-gate state —
// each state routes to its own dedicated page (F1b-7 split the old shared
// /cashier-intake/:id page into a Cashier page and an A/R page).
function rowStatusLabel(c) {
  if (c.status === "LOCKED") return { label: "Locked", color: "default" };
  if (c.status === "POSTED") return { label: "Posted", color: "success" };
  return c.cashier_verified
    ? { label: "Submitted", color: "info" }
    : { label: "Open", color: "default" };
}

// Unit 21.5 F1b-9: role-gated — Cashier only ever sees Accept Payments, A/R
// only ever sees Post Payments; Owner (executive) or staff sees whichever
// the row's state calls for. Returns null (no button, chip-only) otherwise.
function rowAction(c, role, isStaff) {
  if (c.status === "POSTED" || c.status === "LOCKED") return null;
  if (c.cashier_verified) {
    return canPostPayments(role, isStaff)
      ? {
          label: "Post Payments",
          color: "info",
          icon: <PostAddIcon />,
          route: (id) => `/eod-collection/${id}/post-payments`,
        }
      : null;
  }
  return canAcceptPayments(role, isStaff)
    ? {
        label: "Accept Payments",
        color: "info",
        icon: <CheckCircleIcon />,
        route: (id) => `/eod-collection/${id}/verify-cash`,
      }
    : null;
}

export default function EodCashCountPage() {
  const role = getRole();
  const { userProfile } = useAuth();
  const isStaff = userProfile?.is_staff || false;
  const navigate = useNavigate();
  const [counts, setCounts]             = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [statusFilter, setStatusFilter] = useState("PENDING_APPROVAL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: DEFAULT_LIMIT };
      if (statusFilter === "ESCALATED") {
        params.escalated_to_admin = "true";
      } else if (statusFilter) {
        params.status = statusFilter;
      }
      const resp = await listEodCounts(params);
      const results = Array.isArray(resp) ? resp : (resp?.results ?? []);
      const count = Array.isArray(resp) ? resp.length : (resp?.count ?? results.length);
      setCounts(results);
      setTotal(count);
    } catch {
      setError("Failed to load EOD collections.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePageChange = (_, value) => setPage(value);

  if (!canViewEodCounts(role)) return <Navigate to="/dashboard" replace />;

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
            End of Day Collections
          </MDTypography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => handleStatusFilterChange(e.target.value)}
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
                  <TableCell align="right">Cash</TableCell>
                  <TableCell align="right">Check</TableCell>
                  <TableCell align="right">GCASH</TableCell>
                  <TableCell align="right">Bank</TableCell>
                  <TableCell align="right">Total</TableCell>
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
                      <TableCell align="right">{peso(c.total_cash)}</TableCell>
                      <TableCell align="right">{peso(c.total_check)}</TableCell>
                      <TableCell align="right">{peso(c.total_gcash)}</TableCell>
                      <TableCell align="right">{peso(c.total_bank)}</TableCell>
                      <TableCell align="right">
                        {peso(
                          (parseFloat(c.total_cash  || 0)) +
                          (parseFloat(c.total_check || 0)) +
                          (parseFloat(c.total_gcash || 0)) +
                          (parseFloat(c.total_bank  || 0))
                        )}
                      </TableCell>
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
                          <Chip {...rowStatusLabel(c)} size="small" />
                          {c.escalated_to_admin && (
                            <Chip label="Override Pending" color="warning" size="small" />
                          )}
                        </MDBox>
                      </TableCell>
                      <TableCell align="center">
                        {(() => {
                          const action = rowAction(c, role, isStaff);
                          if (!action) {
                            return (
                              <MDTypography variant="body2" color="secondary">
                                —
                              </MDTypography>
                            );
                          }
                          return (
                            <Button
                              size="small"
                              variant="contained"
                              color={action.color}
                              startIcon={action.icon}
                              onClick={() => navigate(action.route(c.id))}
                            >
                              {action.label}
                            </Button>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        )}

        {!loading && counts.length > 0 && (
          <MDBox mt={2} display="flex" justifyContent="center">
            <Pagination
              count={Math.ceil(total / DEFAULT_LIMIT) || 1}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </MDBox>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
