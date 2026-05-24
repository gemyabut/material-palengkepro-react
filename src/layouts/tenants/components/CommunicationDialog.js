// src/layouts/tenants/components/CommunicationDialog.js

import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from "@mui/material";
import { debugLog } from "../../stalls/utils/debug";

export default function CommunicationDialog({
  open,
  onClose,
  onSendSMS,
  onSendEmail,
  loading = false,
  error = null,
}) {
  const [mode, setMode] = useState("sms");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    debugLog("CommunicationDialog send", { mode, subject, message });
    if (mode === "sms") onSendSMS?.(message);
    else onSendEmail?.(subject, message);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Communication</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(error)}
          </Alert>
        )}

        <ToggleButtonGroup
          color="primary"
          exclusive
          value={mode}
          onChange={(_, v) => v && setMode(v)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="sms">SMS</ToggleButton>
          <ToggleButton value="email">Email</ToggleButton>
        </ToggleButtonGroup>

        {mode === "email" && (
          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            margin="dense"
            disabled={loading}
          />
        )}
        <TextField
          label={mode === "sms" ? "SMS Message" : "Email Body"}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          fullWidth
          margin="dense"
          multiline
          minRows={4}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSend} variant="contained" disabled={loading}>
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}

CommunicationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSendSMS: PropTypes.func,
  onSendEmail: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.any,
};
