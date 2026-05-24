// src/layouts/stalls/components/BulkActionDialog.js

import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

export default function BulkActionDialog({ open, onClose, onConfirm, count, actionLabel = "deactivate" }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Bulk {actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to <b>{actionLabel}</b> <b>{count}</b> selected stalls?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
