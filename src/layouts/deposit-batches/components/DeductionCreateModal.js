import React, { useState, useEffect } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import MDTypography from "components/MDTypography";
import { createDeduction } from "api/deductions";
import { listExpenseCategories } from "api/expenseCategories";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/jpg", "image/png"];

const EMPTY = {
  amount: "",
  description: "",
  recipient_name: "",
  expense_category_id: "",
};

export default function DeductionCreateModal({ open, batchId, pendingCount, onClose, onCreated }) {
  const [fields, setFields] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState("");
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState(null);

  useEffect(() => {
    if (!open) return;
    setFields(EMPTY);
    setFile(null);
    setFileErr("");
    setErrors({});
    setApiErr(null);
    setCatLoading(true);
    listExpenseCategories({ is_active: true })
      .then((data) => setCategories(Array.isArray(data) ? data : data.results || []))
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false));
  }, [open]);

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) {
      setFile(null);
      setFileErr("");
      return;
    }
    if (!ALLOWED.includes(f.type)) {
      setFileErr("JPEG or PNG only.");
      setFile(null);
      return;
    }
    if (f.size > MAX_SIZE) {
      setFileErr("File must be under 5 MB.");
      setFile(null);
      return;
    }
    setFile(f);
    setFileErr("");
  };

  const validate = () => {
    const e = {};
    if (!fields.amount || isNaN(Number(fields.amount)) || Number(fields.amount) <= 0)
      e.amount = "Enter a positive amount.";
    if (!fields.description.trim()) e.description = "Description is required.";
    if (!fields.recipient_name.trim()) e.recipient_name = "Recipient name is required.";
    if (!fields.expense_category_id) e.expense_category_id = "Select an expense category.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    setApiErr(null);
    const fd = new FormData();
    fd.append("amount", fields.amount);
    fd.append("description", fields.description.trim());
    fd.append("recipient_name", fields.recipient_name.trim());
    fd.append("expense_category_id", fields.expense_category_id);
    if (file) fd.append("receipt_image", file);
    try {
      await createDeduction(batchId, fd);
      onCreated();
    } catch (err) {
      const d = err?.response?.data;
      if (d && typeof d === "object" && !d.detail) {
        setErrors(
          Object.fromEntries(Object.entries(d).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
        );
      } else {
        setApiErr(d?.detail || "Submission failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const warn = pendingCount >= 10;

  return (
    <Dialog open={open} onClose={!submitting ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>Add Cash Deduction</DialogTitle>
      <DialogContent dividers>
        {warn && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {pendingCount} pending deduction{pendingCount !== 1 ? "s" : ""} already on this batch —
            Market Administrator approval needed before they are counted.
          </Alert>
        )}
        {apiErr && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiErr}
          </Alert>
        )}

        <TextField
          label="Amount (₱)"
          type="number"
          inputProps={{ min: 0.01, step: 0.01 }}
          fullWidth
          required
          sx={{ mb: 2 }}
          value={fields.amount}
          onChange={set("amount")}
          disabled={submitting}
          error={!!errors.amount}
          helperText={errors.amount}
        />
        <TextField
          label="Description"
          fullWidth
          required
          multiline
          rows={2}
          sx={{ mb: 2 }}
          value={fields.description}
          onChange={set("description")}
          disabled={submitting}
          error={!!errors.description}
          helperText={errors.description}
        />
        <TextField
          label="Recipient name"
          fullWidth
          required
          sx={{ mb: 2 }}
          value={fields.recipient_name}
          onChange={set("recipient_name")}
          disabled={submitting}
          error={!!errors.recipient_name}
          helperText={errors.recipient_name}
        />
        <FormControl fullWidth required sx={{ mb: 2 }} error={!!errors.expense_category_id}>
          <InputLabel>Expense category</InputLabel>
          <Select
            value={fields.expense_category_id}
            label="Expense category"
            onChange={set("expense_category_id")}
            disabled={submitting || catLoading}
          >
            {catLoading && (
              <MenuItem value="">
                <em>Loading…</em>
              </MenuItem>
            )}
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.display_name}
              </MenuItem>
            ))}
          </Select>
          {errors.expense_category_id && (
            <MDTypography variant="caption" color="error" ml={1.5}>
              {errors.expense_category_id}
            </MDTypography>
          )}
        </FormControl>

        <MDTypography variant="caption" color="secondary" display="block" mb={0.5}>
          Receipt image (optional — JPEG/PNG, max 5 MB)
        </MDTypography>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFile}
          disabled={submitting}
        />
        {fileErr && (
          <MDTypography variant="caption" color="error" display="block" mt={0.5}>
            {fileErr}
          </MDTypography>
        )}
        {file && (
          <MDTypography variant="caption" color="success" display="block" mt={0.5}>
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </MDTypography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <CircularProgress size={18} sx={{ color: "white" }} /> : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
