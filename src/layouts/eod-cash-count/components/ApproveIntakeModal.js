import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ApproveIntakeModal({ open, intake, onClose, onConfirm, submitting }) {
  const [approvalNotes, setApprovalNotes] = useState("");

  const variance = parseFloat(intake?.variance || 0);

  return (
    <Dialog open={open} onClose={!submitting ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>Approve Cash Count</DialogTitle>
      <DialogContent>
        <MDTypography variant="body2" color="secondary" mb={2}>
          Approving will post this count and create handover cash movements (Pocket → Safe).
        </MDTypography>

        <MDBox display="flex" flexDirection="column" gap={1.5} mb={2.5}>
          <MDBox display="flex" gap={4}>
            <MDBox>
              <MDTypography variant="caption" color="secondary">Collector</MDTypography>
              <MDTypography variant="body2" fontWeight="medium">
                {intake?.collector_name || "—"}
              </MDTypography>
            </MDBox>
            <MDBox>
              <MDTypography variant="caption" color="secondary">Date</MDTypography>
              <MDTypography variant="body2" fontWeight="medium">{intake?.date || "—"}</MDTypography>
            </MDBox>
          </MDBox>

          <MDBox display="flex" gap={4}>
            <MDBox>
              <MDTypography variant="caption" color="secondary">Expected</MDTypography>
              <MDTypography variant="body2">{peso(intake?.expected_amount)}</MDTypography>
            </MDBox>
            <MDBox>
              <MDTypography variant="caption" color="secondary">Actual</MDTypography>
              <MDTypography variant="body2" fontWeight="bold">{peso(intake?.actual_amount)}</MDTypography>
            </MDBox>
          </MDBox>

          {variance !== 0 && (
            <MDBox>
              <MDTypography variant="caption" color="secondary">Variance</MDTypography>
              <MDTypography
                variant="body2"
                fontWeight="medium"
                color={variance < 0 ? "error" : "info"}
              >
                {variance > 0 ? "+" : ""}{peso(variance)}
                {" — "}
                {intake?.variance_reason || "(no reason on record)"}
              </MDTypography>
            </MDBox>
          )}
        </MDBox>

        <TextField
          label="Approval Notes (optional)"
          multiline
          rows={3}
          value={approvalNotes}
          onChange={(e) => setApprovalNotes(e.target.value)}
          fullWidth
          size="small"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button
          onClick={() => onConfirm({ approval_notes: approvalNotes })}
          variant="contained"
          color="success"
          disabled={submitting}
        >
          {submitting ? "Approving…" : "Approve"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
