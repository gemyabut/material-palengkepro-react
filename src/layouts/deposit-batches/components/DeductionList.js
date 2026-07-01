import React, { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { approveDeduction, rejectDeduction, voidDeduction, deleteDeduction } from "api/deductions";
import { canCreateDeduction, canApproveDeduction } from "utils/permissions";

const peso = (v) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const STATUS_COLOR = {
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

const STATUS_LABEL = {
  PENDING_APPROVAL: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

function RejectDialog({ deductionId, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setErr("Rejection reason is required.");
      return;
    }
    setSubmitting(true);
    try {
      await rejectDeduction(deductionId, reason.trim());
      onDone();
    } catch (e) {
      setErr(
        e?.response?.data?.rejection_reason?.[0] || e?.response?.data?.detail || "Rejection failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MDBox mt={1} p={1.5} bgcolor="#fff3e0" borderRadius={1} border="1px solid #ffcc80">
      <MDTypography variant="caption" fontWeight="medium">
        Rejection reason (required)
      </MDTypography>
      <TextField
        fullWidth
        size="small"
        multiline
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={submitting}
        sx={{ mt: 0.5 }}
      />
      {err && (
        <MDTypography variant="caption" color="error">
          {err}
        </MDTypography>
      )}
      <Stack direction="row" spacing={1} mt={1}>
        <Button
          size="small"
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <CircularProgress size={14} sx={{ color: "white" }} /> : "Confirm Reject"}
        </Button>
        <Button size="small" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
      </Stack>
    </MDBox>
  );
}

export default function DeductionList({ deductions, batchId, role, onOpenCreate, onRefresh }) {
  const [busy, setBusy] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [error, setError] = useState(null);

  const canCreate = canCreateDeduction(role);
  const canApprove = canApproveDeduction(role);

  const summary = deductions || {};
  const items = summary.items || [];

  const act = async (fn, id) => {
    setBusy(id);
    setError(null);
    try {
      await fn(id);
      onRefresh();
    } catch (e) {
      setError(e?.response?.data?.detail || "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <MDBox mt={3}>
      <Divider />
      <MDBox display="flex" alignItems="center" justifyContent="space-between" mt={2} mb={1}>
        <MDTypography variant="h6">Cash Deductions</MDTypography>
        {canCreate && (
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onOpenCreate}>
            Add Deduction
          </Button>
        )}
      </MDBox>

      {/* Summary row */}
      {items.length > 0 && (
        <Stack direction="row" spacing={3} mb={2}>
          <MDBox>
            <MDTypography variant="caption" color="secondary">
              Approved
            </MDTypography>
            <MDTypography variant="body2" fontWeight="bold" color="success.main">
              {peso(summary.approved_total)}
            </MDTypography>
          </MDBox>
          <MDBox>
            <MDTypography variant="caption" color="secondary">
              Pending
            </MDTypography>
            <MDTypography variant="body2" fontWeight="bold" color="warning.main">
              {peso(summary.pending_total)}
            </MDTypography>
          </MDBox>
          <MDBox>
            <MDTypography variant="caption" color="secondary">
              Rejected
            </MDTypography>
            <MDTypography variant="body2" fontWeight="bold" color="error.main">
              {peso(summary.rejected_total)}
            </MDTypography>
          </MDBox>
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {items.length === 0 ? (
        <MDTypography variant="body2" color="secondary">
          No deductions recorded.
        </MDTypography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              {["Description", "Recipient", "Category", "Amount", "Status", "By", ""].map((h) => (
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
                  <TableCell sx={{ fontSize: "0.8rem" }}>{d.description}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>{d.recipient_name}</TableCell>
                  <TableCell sx={{ fontSize: "0.8rem" }}>
                    {d.expense_category_name || "—"}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }} align="right">
                    {peso(d.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={STATUS_LABEL[d.status] || d.status}
                      color={STATUS_COLOR[d.status] || "default"}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.75rem" }}>
                    {d.created_by_username}
                    {d.approved_by_username && (
                      <Box component="span" sx={{ color: "text.secondary" }}>
                        {" "}
                        → {d.approved_by_username}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {busy === d.id ? (
                      <CircularProgress size={16} />
                    ) : (
                      <>
                        {canApprove && d.status === "PENDING_APPROVAL" && (
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
                                onClick={() => setRejectingId(rejectingId === d.id ? null : d.id)}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {canApprove && d.status === "APPROVED" && (
                          <Tooltip title="Void (reverse approval)">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => act((id) => voidDeduction(id, "Voided by admin"), id)}
                            >
                              <RemoveCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {d.status === "PENDING_APPROVAL" && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="default"
                              onClick={() => act(deleteDeduction, d.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
                {rejectingId === d.id && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ pt: 0, pb: 1 }}>
                      <RejectDialog
                        deductionId={d.id}
                        onClose={() => setRejectingId(null)}
                        onDone={() => {
                          setRejectingId(null);
                          onRefresh();
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </MDBox>
  );
}
