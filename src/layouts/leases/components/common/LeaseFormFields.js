// /src/layouts/leases/components/common/LeaseFormFields.js
// M1 (UNIT_53 Phase D.6 verification): no import of this component exists
// anywhere in the frontend (grepped repo-wide) — AdminAddLease.js/
// AdminEditLease.js each inline their own form fields instead. Deprecation
// candidate; left as-is pending Lead confirmation it's safe to delete.
import React from "react";
import { Stack, TextField, MenuItem } from "@mui/material";
import {
  LEASE_TYPE_CHOICES,
  LEASE_STATUS_CHOICES,
  PAYMENT_SCHEDULE_CHOICES,
} from "../../data/choices";

function LeaseFormFields({ values, onChange, disabled = false }) {
  return (
    <Stack spacing={2} mt={1}>
      <TextField
        name="tenant_id"
        label="Tenant ID"
        value={values.tenant_id || ""}
        onChange={onChange}
        required
        disabled={disabled}
      />
      <TextField
        name="stall_id"
        label="Stall ID"
        value={values.stall_id || ""}
        onChange={onChange}
        required
        disabled={disabled}
      />
      <TextField
        select
        name="lease_type"
        label="Lease Type"
        value={values.lease_type || ""}
        onChange={onChange}
        required
        disabled={disabled}
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
        onChange={onChange}
        InputLabelProps={{ shrink: true }}
        required
        disabled={disabled}
      />
      <TextField
        type="date"
        name="end_date"
        label="End Date"
        value={values.end_date || ""}
        onChange={onChange}
        InputLabelProps={{ shrink: true }}
        required
        disabled={disabled}
      />
      <TextField
        select
        name="payment_schedule"
        label="Payment Schedule"
        value={values.payment_schedule || ""}
        onChange={onChange}
        required
        disabled={disabled}
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
        value={values.lease_amount || ""}
        onChange={onChange}
        type="number"
        required
        disabled={disabled}
      />
      <TextField
        select
        name="status"
        label="Status"
        value={values.status || ""}
        onChange={onChange}
        required
        disabled={disabled}
      >
        {LEASE_STATUS_CHOICES.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}

export default LeaseFormFields;
