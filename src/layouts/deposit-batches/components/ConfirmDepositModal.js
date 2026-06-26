import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

export default function ConfirmDepositModal({ open, batch, onClose, onConfirm, submitting }) {
  const [ref, setRef]         = useState("");
  const [refError, setRefError] = useState("");

  const handleConfirm = () => {
    if (!ref.trim()) {
      setRefError("Bank confirmation reference is required.");
      return;
    }
    setRefError("");
    onConfirm(ref.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Bank Receipt</DialogTitle>
      <DialogContent>
        <MDTypography variant="body2" color="secondary" mb={2}>
          This will transition batch #{batch?.id} from POSTED to CONFIRMED and trigger the
          cash movement from Bank Pending → Bank Confirmed.
        </MDTypography>
        <MDBox>
          <TextField
            label="Bank confirmation reference *"
            value={ref}
            onChange={(e) => { setRef(e.target.value); setRefError(""); }}
            error={!!refError}
            helperText={refError || "e.g. bank transaction ID or reference number"}
            size="small"
            fullWidth
            autoFocus
          />
        </MDBox>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="success"
          disabled={submitting}
        >
          {submitting ? "Confirming…" : "Confirm Receipt"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
