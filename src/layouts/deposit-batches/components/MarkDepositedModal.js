import React, { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export default function MarkDepositedModal({ open, batch, onClose, onConfirm, submitting }) {
  const today = new Date().toISOString().slice(0, 10);

  const [bankName, setBankName]     = useState(batch?.bank_name || "");
  const [last4, setLast4]           = useState(batch?.bank_account_last4 || "");
  const [depositDate, setDepositDate] = useState(today);
  const [file, setFile]             = useState(null);
  const [fileError, setFileError]   = useState("");
  const [fieldErr, setFieldErr]     = useState({});

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) { setFile(null); setFileError(""); return; }
    if (!ALLOWED_TYPES.includes(f.type)) {
      setFile(null);
      setFileError("Only JPEG and PNG files are accepted.");
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setFile(null);
      setFileError("File must be 5 MB or smaller.");
      return;
    }
    setFile(f);
    setFileError("");
  };

  const validate = () => {
    const errs = {};
    if (!bankName.trim()) errs.bankName = "Bank name is required.";
    if (!depositDate)     errs.depositDate = "Deposit date is required.";
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    const fd = new FormData();
    fd.append("bank_name", bankName.trim());
    fd.append("bank_account_last4", last4.trim());
    fd.append("deposit_date", depositDate);
    if (file) fd.append("slip_file", file);
    onConfirm(fd);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Mark as Deposited</DialogTitle>
      <DialogContent>
        <MDTypography variant="body2" color="secondary" mb={2}>
          This will transition batch #{batch?.id} from OPEN to POSTED and trigger the
          cash movement from Operator Safe → Bank Pending.
        </MDTypography>

        <MDBox display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Bank name *"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            error={!!fieldErr.bankName}
            helperText={fieldErr.bankName}
            size="small"
            fullWidth
          />
          <TextField
            label="Account last 4 digits"
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 8))}
            size="small"
            sx={{ width: 200 }}
          />
          <TextField
            label="Deposit date *"
            type="date"
            value={depositDate}
            onChange={(e) => setDepositDate(e.target.value)}
            error={!!fieldErr.depositDate}
            helperText={fieldErr.depositDate}
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          <MDBox>
            <MDTypography variant="caption" color="secondary" display="block" mb={0.5}>
              Deposit slip image (JPG/PNG, max 5 MB — optional)
            </MDTypography>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFile}
              style={{ display: "block" }}
            />
            {fileError && (
              <Alert severity="error" sx={{ mt: 1 }}>{fileError}</Alert>
            )}
            {file && !fileError && (
              <MDTypography variant="caption" color="success">
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </MDTypography>
            )}
          </MDBox>
        </MDBox>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={submitting || !!fileError}
        >
          {submitting ? "Submitting…" : "Mark Deposited"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
