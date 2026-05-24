// /src/layouts/leases/components/admin/AdminEditLease.js
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  LEASE_STATUS_CHOICES,
  LEASE_TYPE_CHOICES,
  PAYMENT_TERMS_CHOICES,
} from "../../data/choices";
import { debugLog } from "../../../stalls/utils/debug";
import PropTypes from "prop-types";

function AdminEditLease({ open, lease, onClose, onSuccess }) {
  const [values, setValues] = useState(lease || {});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setValues(lease || {});
  }, [lease]);

  const handleChange = (e) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    debugLog("[AdminEditLease] Submitting", values);
    setSubmitting(true);
    try {
      (await onSuccess) && onSuccess(values);
      onClose();
    } catch (e) {
      debugLog("[AdminEditLease] Error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Lease</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            name="tenant_id"
            label="Tenant ID"
            value={values.tenant_id || ""}
            onChange={handleChange}
            required
          />
          <TextField
            name="stall_id"
            label="Stall ID"
            value={values.stall_id || ""}
            onChange={handleChange}
            required
          />
          <TextField
            select
            name="lease_type"
            label="Lease Type"
            value={values.lease_type || ""}
            onChange={handleChange}
            required
          >
            {LEASE_TYPE_CHOICES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            name="start_date"
            label="Start Date"
            value={values.start_date || ""}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            type="date"
            name="end_date"
            label="End Date"
            value={values.end_date || ""}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            select
            name="payment_terms"
            label="Payment Terms"
            value={values.payment_terms || ""}
            onChange={handleChange}
            required
          >
            {PAYMENT_TERMS_CHOICES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            name="lease_amount"
            label="Lease Amount"
            value={values.lease_amount || ""}
            onChange={handleChange}
            type="number"
            required
          />
          <TextField
            select
            name="status"
            label="Status"
            value={values.status || ""}
            onChange={handleChange}
            required
          >
            {LEASE_STATUS_CHOICES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AdminEditLease.propTypes = {
  open: PropTypes.bool.isRequired,
  lease: PropTypes.object, // or shape({ ... }) for strict validation
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};

export default AdminEditLease;
