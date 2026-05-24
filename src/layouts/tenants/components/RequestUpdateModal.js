// src/layouts/tenants/components/RequestUpdateModal.js

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import PropTypes from "prop-types";
import { debugLog } from "../../stalls/utils/debug";

export default function RequestUpdateModal({
  open,
  onClose,
  onSubmit,
  initialFields = {},
  loading = false,
  error = null,
}) {
  const [fields, setFields] = useState(initialFields);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (open) {
      setFields(initialFields || {});
      setLocalError(null);
    }
  }, [open, initialFields]);

  const handleChange = (e) => setFields({ ...fields, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    const hasAnyChange = !!fields.mobile_phone || !!fields.email_address || !!fields.reason;
    if (!hasAnyChange) {
      setLocalError("Please provide at least one field to update or a reason.");
      return;
    }
    debugLog("RequestUpdateModal submit:", fields);
    await onSubmit(fields);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Request Update</DialogTitle>
      <DialogContent>
        {(error || localError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(error || localError)}
          </Alert>
        )}
        <form id="request-update-form" onSubmit={handleSubmit}>
          <TextField
            label="New Mobile Number"
            name="mobile_phone"
            value={fields.mobile_phone || ""}
            onChange={handleChange}
            margin="normal"
            fullWidth
            disabled={loading}
          />
          <TextField
            label="New Email Address"
            name="email_address"
            value={fields.email_address || ""}
            onChange={handleChange}
            margin="normal"
            fullWidth
            disabled={loading}
          />
          <TextField
            label="Reason / Comments"
            name="reason"
            value={fields.reason || ""}
            onChange={handleChange}
            margin="normal"
            fullWidth
            multiline
            minRows={2}
            disabled={loading}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form="request-update-form" variant="contained" disabled={loading}>
          Submit Request
        </Button>
      </DialogActions>
    </Dialog>
  );
}

RequestUpdateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialFields: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.any,
};

RequestUpdateModal.defaultProps = {
  initialFields: {},
  loading: false,
  error: null,
};
