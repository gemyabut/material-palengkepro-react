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
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import PropTypes from "prop-types";
import { debugLog } from "layouts/stalls/utils/debug";

import { createStall } from "../api/stalls"; // adjust import path as needed
import {
  STATUS_CHOICES,
  COMMERCE_TYPE_CHOICES,
  FLOOR_LEVEL_CHOICES,
  FRONTAGE_TYPE_CHOICES,
  COMMERCE_SUBTYPE_BY_TYPE,
} from "layouts/stalls/data/choices";

const getLabel = (choices, value) => choices.find((opt) => opt.value === value)?.label || value;

// Utility booleans rendered as a checkbox grid — label + form field name pairs.
// Defaults mirror stalls/models.py::Stall field defaults (electricity/water
// default True, the rest default False).
const UTILITY_FIELDS = [
  { name: "has_electricity", label: "Electricity" },
  { name: "has_electricity_meter", label: "Electricity meter" },
  { name: "has_water", label: "Water" },
  { name: "has_water_meter", label: "Water meter" },
  { name: "has_drainage", label: "Drainage" },
  { name: "has_gas_connection", label: "Gas connection" },
  { name: "has_cold_storage", label: "Cold storage" },
  { name: "has_grease_trap", label: "Grease trap" },
];

const initialForm = {
  stall_number: "",
  zone: "",
  size_sqm: "",
  status: "AVAILABLE",
  commerce_type: COMMERCE_TYPE_CHOICES[0].value,
  section: "",
  classification: "",
  remarks: "",
  floor_level: FLOOR_LEVEL_CHOICES[0].value,
  frontage_type: FRONTAGE_TYPE_CHOICES[0].value,
  size_dimensions: "",
  commerce_subtype: "",
  has_electricity: true,
  has_electricity_meter: false,
  has_water: true,
  has_water_meter: false,
  has_drainage: false,
  has_gas_connection: false,
  has_cold_storage: false,
  has_grease_trap: false,
  description: "",
  photo_urls: "",
};

export default function AddStallForm({ open, onClose, onSuccess, market }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "commerce_type") {
      // Subtype list is keyed by type -- switching type invalidates whatever
      // subtype was previously selected, so clear it rather than leave a
      // stale value that no longer appears in the (now-different) dropdown.
      setForm((prev) => ({ ...prev, commerce_type: value, commerce_subtype: "" }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    debugLog("[AddStallForm] Submitting:", form);
    try {
      if (!form.stall_number || !form.zone || !form.size_sqm) {
        setSnackbar({ open: true, message: "Please fill all required fields.", severity: "error" });
        setLoading(false);
        return;
      }
      await createStall({
        ...form,
        status: form.status.toUpperCase(),
        market,
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

  const subtypeChoices = COMMERCE_SUBTYPE_BY_TYPE[form.commerce_type] || [];

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
                  label="Zone / Aisle / Row"
                  name="zone"
                  value={form.zone}
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

              {/* Group 2 — commerce type + subtype (subtype filters on type) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Type"
                  name="commerce_type"
                  value={form.commerce_type}
                  onChange={handleChange}
                  required
                  fullWidth
                >
                  {COMMERCE_TYPE_CHOICES.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Subtype"
                  name="commerce_subtype"
                  value={form.commerce_subtype}
                  onChange={handleChange}
                  disabled={subtypeChoices.length === 0}
                  fullWidth
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="">
                    {subtypeChoices.length === 0 ? "Select commerce type first" : "— None —"}
                  </MenuItem>
                  {subtypeChoices.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Group 1 — physical attributes */}
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Floor level"
                  name="floor_level"
                  value={form.floor_level}
                  onChange={handleChange}
                  fullWidth
                >
                  {FLOOR_LEVEL_CHOICES.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  label="Frontage type"
                  name="frontage_type"
                  value={form.frontage_type}
                  onChange={handleChange}
                  fullWidth
                >
                  {FRONTAGE_TYPE_CHOICES.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Size dimensions"
                  name="size_dimensions"
                  placeholder="e.g. 3.2 x 4.5"
                  value={form.size_dimensions}
                  onChange={handleChange}
                  fullWidth
                />
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

              {/* Group 3 — utility infrastructure */}
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Utility Infrastructure
                </Typography>
                <FormGroup row>
                  <Grid container spacing={0}>
                    {UTILITY_FIELDS.map((f) => (
                      <Grid item xs={6} key={f.name}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name={f.name}
                              checked={Boolean(form[f.name])}
                              onChange={handleCheckboxChange}
                              size="small"
                            />
                          }
                          label={f.label}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </FormGroup>
              </Grid>

              {/* Group 4 — description / photos / remarks */}
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Photo URLs"
                  name="photo_urls"
                  placeholder="Comma-separated URLs"
                  value={form.photo_urls}
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
  market: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
