import React, { useState } from "react";
import {
  Dialog,
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

import { createStall } from "../api/stalls"; // adjust import path as needed
import { STATUS_CHOICES, STALL_TYPE_CHOICES } from "layouts/stalls/data/choices";

const getLabel = (choices, value) => choices.find((opt) => opt.value === value)?.label || value;

const initialForm = {
  stall_number: "",
  location: "",
  size_sqm: "",
  current_rate: "",
  status: "AVAILABLE",
  stall_type: "WET",
  section: "",
  classification: "",
  remarks: "",
};

export default function AddStallForm({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    debugLog("[AddStallForm] Submitting:", form);
    try {
      if (!form.stall_number || !form.location || !form.size_sqm || !form.current_rate) {
        setSnackbar({ open: true, message: "Please fill all required fields.", severity: "error" });
        setLoading(false);
        return;
      }
      await createStall({
        ...form,
        status: form.status.toUpperCase(),
        stall_type: form.stall_type.toUpperCase(),
      });
      debugLog("[AddStallForm] createStall resolved");
      setSnackbar({ open: true, message: "Stall added successfully!", severity: "success" });
      setForm(initialForm);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      debugLog("[AddStallForm] ERROR", error);
      setSnackbar({ open: true, message: "Error adding stall.", severity: "error" });
    }
    setLoading(false);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Add New Stall</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Stall Number"
                  name="stall_number"
                  value={form.stall_number}
                  onChange={handleChange}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Size (sqm)"
                  name="size_sqm"
                  value={form.size_sqm}
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
                  value={form.current_rate}
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
                  value={form.status}
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
                  value={form.stall_type}
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
                  value={form.section}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Classification"
                  name="classification"
                  value={form.classification}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Remarks"
                  name="remarks"
                  value={form.remarks}
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
                debugLog("[AddStallForm] Cancel button clicked");

                if (onClose) onClose();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              Add Stall
            </Button>
          </DialogActions>
        </form>
      </Dialog>
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

AddStallForm.propTypes = {
  open: PropTypes.bool,
  onSuccess: PropTypes.func,
  onClose: PropTypes.func.isRequired,
};
