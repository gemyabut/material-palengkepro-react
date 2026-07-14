import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import MDTypography from "components/MDTypography";
import { flagPayment } from "api/cashierIntakeReview";

const REASONS = [
  { value: "WRONG_TENANT", label: "Wrong Tenant" },
  { value: "WRONG_CHARGE", label: "Wrong Charge Type" },
  { value: "WRONG_AMOUNT", label: "Wrong Amount" },
  { value: "FAKE_RECEIPT", label: "Suspected Fake Receipt" },
  { value: "OTHER", label: "Other" },
];

export default function FlagDialog({ open, payment, onClose, onFlagged }) {
  const [reason, setReason] = useState("WRONG_TENANT");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    if (submitting) return;
    setReason("WRONG_TENANT");
    setNote("");
    setError(null);
    onClose();
  };

  const handleFlag = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await flagPayment(payment.id, { reason, note });
      onFlagged();
      handleClose();
    } catch (e) {
      setError(e?.response?.data?.note?.[0] || e?.response?.data?.detail || "Could not flag payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Flag Payment #{payment.id} for Correction</DialogTitle>
      <DialogContent>
        <MDTypography variant="caption" color="secondary" fontWeight="bold" display="block" mb={1}>
          Reason
        </MDTypography>
        <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => (
            <FormControlLabel key={r.value} value={r.value} control={<Radio size="small" />} label={r.label} />
          ))}
        </RadioGroup>

        <TextField
          label="Note"
          multiline
          minRows={3}
          fullWidth
          required={reason === "OTHER"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mt: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} icon={false}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={handleFlag} disabled={submitting}>
          {submitting ? "Flagging…" : "Flag Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
