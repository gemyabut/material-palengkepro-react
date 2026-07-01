import React, { useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canApproveDeduction } from "utils/permissions";
import { listPendingDeductions, approveDeduction, rejectDeduction } from "api/deductions";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

const peso = (v) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

function RejectInline({ id, onDone, onCancel }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    if (!reason.trim()) {
      setErr("Required.");
      return;
    }
    setSubmitting(true);
    try {
      await rejectDeduction(id, reason.trim());
      onDone();
    } catch (e) {
      setErr(e?.response?.data?.rejection_reason?.[0] || "Failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MDBox p={1} bgcolor="#fff8e1" borderRadius={1} border="1px solid #ffcc80">
      <TextField
        size="small"
        fullWidth
        placeholder="Rejection reason (required)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={submitting}
      />
      {err && (
        <MDTypography variant="caption" color="error">
          {err}
        </MDTypography>
      )}
      <Stack direction="row" spacing={1} mt={0.5}>
        <Button
          size="small"
          variant="contained"
          color="error"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? <CircularProgress size={14} sx={{ color: "white" }} /> : "Confirm"}
        </Button>
        <Button size="small" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </Stack>
    </MDBox>
  );
}

export default function DeductionApprovalQueue() {
  const role = getRole();
  const allowed = canApproveDeduction(role);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [actionErr, setActionErr] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listPendingDeductions());
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  if (!allowed) return <Navigate to="/dashboard" replace />;

  const act = async (fn, id) => {
    setBusy(id);
    setActionErr(null);
    try {
      await fn(id);
      setItems((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setActionErr(e?.response?.data?.detail || "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  const total = items.reduce((s, d) => s + Number(d.amount || 0), 0);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox p={3}>
        <MDBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <MDTypography variant="h5">Deduction Approval Queue</MDTypography>
          <Button size="small" startIcon={<RefreshIcon />} onClick={fetch} disabled={loading}>
            Refresh
          </Button>
        </MDBox>

        {loading && (
          <MDBox display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </MDBox>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {actionErr && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionErr(null)}>
            {actionErr}
          </Alert>
        )}

        {!loading && items.length === 0 && !error && (
          <MDTypography variant="body2" color="secondary">
            No deductions pending approval.
          </MDTypography>
        )}

        {!loading && items.length > 0 && (
          <>
            <Paper variant="outlined" sx={{ mb: 2, p: 2, display: "inline-block" }}>
              <MDTypography variant="caption" color="secondary">
                {items.length} pending · {peso(total)} total
              </MDTypography>
            </Paper>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  {[
                    "Batch date",
                    "Description",
                    "Recipient",
                    "Category",
                    "Amount",
                    "Submitted by",
                    "",
                  ].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((d) => (
                  <React.Fragment key={d.id}>
                    <TableRow sx={{ verticalAlign: "top" }}>
                      <TableCell sx={{ fontSize: "0.8rem" }}>
                        {d.batch_date || "—"}
                        {d.batch_id && (
                          <Chip
                            size="small"
                            label={`#${d.batch_id}`}
                            sx={{ ml: 0.5, fontSize: "0.65rem" }}
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{d.description}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{d.recipient_name}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>
                        {d.expense_category_name || "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }} align="right">
                        {peso(d.amount)}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{d.created_by_username}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        {busy === d.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => act(approveDeduction, d.id)}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setRejectId(rejectId === d.id ? null : d.id)}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                    {rejectId === d.id && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ pt: 0, pb: 1 }}>
                          <RejectInline
                            id={d.id}
                            onDone={() => {
                              setRejectId(null);
                              setItems((prev) => prev.filter((x) => x.id !== d.id));
                            }}
                            onCancel={() => setRejectId(null)}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
