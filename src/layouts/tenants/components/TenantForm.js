// src/layouts/tenants/components/TenantForm.js

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import PropTypes from "prop-types";

import { debugLog } from "../../stalls/utils/debug";
import { canEdit } from "../../leases/utils/roleUtils";

export default function TenantForm({
  open,
  initialValues = {},
  onSubmit,
  onClose,
  user,
  loading = false,
}) {
  const [form, setForm] = useState(initialValues || {});

  useEffect(() => {
    if (open) {
      setForm(initialValues || {});
    }
  }, [initialValues, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    debugLog("[TenantForm] Submit:", form);
    onSubmit(form);
  };

  const editable = canEdit(user);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{form?.id ? "Edit Tenant" : "Add Tenant"}</DialogTitle>
      <DialogContent>
        <form id="tenant-form" onSubmit={handleSubmit}>
          <TextField
            label="Full Name"
            name="full_name"
            value={form?.full_name || ""}
            onChange={handleChange}
            margin="normal"
            fullWidth
            required
            disabled={!editable || loading}
          />
          <TextField
            label="Mobile Phone"
            name="mobile_phone"
            value={form?.mobile_phone || ""}
            onChange={handleChange}
            margin="normal"
            fullWidth
            required
            disabled={!editable || loading}
          />
          {/* Future fields:
            - Email Address
            - Barangay
            - Address
            - Status
            - File Uploads
          */}
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        {editable && (
          <Button type="submit" form="tenant-form" variant="contained" disabled={loading}>
            Save
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

TenantForm.propTypes = {
  open: PropTypes.bool,
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  user: PropTypes.object,
  loading: PropTypes.bool,
};

TenantForm.defaultProps = {
  open: false,
  initialValues: {},
  loading: false,
};
