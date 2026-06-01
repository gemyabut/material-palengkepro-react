import React, { useState, useEffect } from "react";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  Grid,
} from "@mui/material";
import PropTypes from "prop-types";
import { debugLog } from "layouts/stalls/utils/debug";
import { updateStall } from "../api/stalls"; // adjust import if needed
import { STATUS_CHOICES, STALL_TYPE_CHOICES } from "layouts/stalls/data/choices";

export default function EditStallForm({ stall, onClose, onSuccess }) {
  // Pre-populate form when stall changes

  const [form, setForm] = useState({
    stall_number: "",
    zone: "",
    size_sqm: "",
    current_rate: "",
    status: "AVAILABLE",
    stall_type: "WET",
    section: "",
    classification: "",
    remarks: "",
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const initialForm = {
    ...stall, // (where stall is the object being edited)
    status: stall.status?.toUpperCase() || "AVAILABLE",
    stall_type: stall.stall_type?.toUpperCase() || "WET",
  };

  useEffect(() => {
    if (stall) {
      setForm({
        ...stall,
        status: (stall.status || "AVAILABLE").toUpperCase(),
        stall_type: (stall.stall_type || "WET").toUpperCase(),
      });
    }
  }, [stall]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    debugLog("[EditStallForm] Submitting update:", form);
    try {
      // Simple validation
      if (!form.stall_number || !form.zone || !form.size_sqm || !form.current_rate) {
        setSnackbar({ open: true, message: "Please fill all required fields.", severity: "error" });
        setLoading(false);
        return;
      }
      await updateStall(stall.id, {
        ...form,
        status: form.status.toUpperCase(),
        stall_type: form.stall_type.toUpperCase(),
      });

      setSnackbar({ open: true, message: "Stall updated successfully!", severity: "success" });
      if (onSuccess) onSuccess();
    } catch (error) {
      setSnackbar({ open: true, message: "Error updating stall.", severity: "error" });
    }
    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Stall</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Stall Number"
                name="stall_number"
                value={form.stall_number || ""}
                onChange={handleChange}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Zone / Aisle / Row"
                name="zone"
                value={form.zone || ""}
                onChange={handleChange}
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Size (sqm)"
                name="size_sqm"
                value={form.size_sqm || ""}
                onChange={handleChange}
                required
                type="number"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Current Rate"
                name="current_rate"
                value={form.current_rate || ""}
                onChange={handleChange}
                required
                type="number"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Status"
                name="status"
                value={form.status?.toUpperCase() || "AVAILABLE"}
                onChange={handleChange}
                required
                fullWidth
              >
                {STATUS_CHOICES.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Type"
                name="stall_type"
                value={form.stall_type?.toUpperCase() || "WET"}
                onChange={handleChange}
                required
                fullWidth
              >
                {STALL_TYPE_CHOICES.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Section"
                name="section"
                value={form.section || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Classification"
                name="classification"
                value={form.classification || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Remarks"
                name="remarks"
                value={form.remarks || ""}
                onChange={handleChange}
                multiline
                rows={2}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              debugLog("[EditStallForm] Cancel button clicked");
              if (onClose) onClose();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            Save Changes
          </Button>
        </DialogActions>
      </form>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

EditStallForm.propTypes = {
  stall: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
