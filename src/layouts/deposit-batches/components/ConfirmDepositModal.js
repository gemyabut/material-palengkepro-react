import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { destinationLabel } from "utils/destinationLabels";

export default function ConfirmDepositModal({ open, batch, onClose, onConfirm, submitting }) {
  const [ref, setRef]           = useState("");
  const [refError, setRefError] = useState("");

  const dest     = batch?.destination_type ?? "BANK";
  const refLabel = destinationLabel(dest, "refLabel");

  const handleConfirm = () => {
    if (!ref.trim()) {
      setRefError(`${refLabel} is required.`);
      return;
    }
    setRefError("");
    onConfirm(ref.trim());
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Remittance</DialogTitle>
      <DialogContent>
        <MDTypography variant="body2" color="secondary" mb={2}>
          This will transition batch #{batch?.id} from POSTED to CONFIRMED and trigger the
          cash movement from {destinationLabel(dest, "pending")} → {destinationLabel(dest, "settled")}.
        </MDTypography>
        <MDBox>
          <TextField
            label={`${refLabel} *`}
            value={ref}
            onChange={(e) => { setRef(e.target.value); setRefError(""); }}
            error={!!refError}
            helperText={refError || `Enter the ${refLabel.toLowerCase()}`}
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
          {submitting ? "Confirming…" : "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
