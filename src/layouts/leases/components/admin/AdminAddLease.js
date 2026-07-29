// /src/layouts/leases/components/admin/AdminAddLease.js
import React, { useState } from "react";
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
  PAYMENT_SCHEDULE_CHOICES,
} from "../../data/choices";
import { debugLog } from "../../../stalls/utils/debug";
import PropTypes from "prop-types";

const initialState = {
  tenant_id: "",
  stall_id: "",
  lease_type: "",
  start_date: "",
  end_date: "",
  payment_schedule: "",
  lease_amount: "",
  annual_rights_fee: "",
  status: "",
};

function AdminAddLease({ open, onClose, onSuccess }) {
  const [values, setValues] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    debugLog("[AdminAddLease] Submitting", values);
    setSubmitting(true);
    try {
      // You'd call createLease here, but use the parent onSuccess for simplicity
      (await onSuccess) && onSuccess(values);
      setValues(initialState);
      onClose();
    } catch (e) {
      debugLog("[AdminAddLease] Error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setValues(initialState);
    onClose();
    debugLog("[AdminAddLease] Cancelled");
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Lease</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            name="tenant_id"
            label="Tenant ID"
            value={values.tenant_id}
            onChange={handleChange}
            required
          />
          <TextField
            name="stall_id"
            label="Stall ID"
            value={values.stall_id}
            onChange={handleChange}
            required
          />
          <TextField
            select
            name="lease_type"
            label="Lease Type"
            value={values.lease_type}
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
            value={values.start_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            type="date"
            name="end_date"
            label="End Date"
            value={values.end_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            select
            name="payment_schedule"
            label="Payment Schedule"
            value={values.payment_schedule}
            onChange={handleChange}
            required
          >
            {PAYMENT_SCHEDULE_CHOICES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            name="lease_amount"
            label="Lease Amount"
            value={values.lease_amount}
            onChange={handleChange}
            type="number"
            required
          />
          <TextField
            name="annual_rights_fee"
            label="Annual Rights Fee"
            value={values.annual_rights_fee}
            onChange={handleChange}
            type="number"
            inputProps={{ step: "0.01", min: "0" }}
            helperText="Annual amount; amortized to a monthly invoice line. Leave 0 if no rights fee."
          />
          <TextField
            select
            name="status"
            label="Status"
            value={values.status}
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
        <Button onClick={handleCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          Add Lease
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AdminAddLease.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func, // if optional, or .isRequired if not
};

export default AdminAddLease;
