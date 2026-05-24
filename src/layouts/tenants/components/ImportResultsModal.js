// src/layouts/tenants/components/ImportResultsModal.js

import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Alert,
  Typography,
  Divider,
  Box,
} from "@mui/material";

export default function ImportResultsModal({ open, onClose, result, error }) {
  const created = result?.created ?? 0;
  const skipped = result?.skipped ?? 0;
  const failed = result?.failed ?? [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>CSV Import Results</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {String(error)}
          </Alert>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <Alert severity="success" sx={{ flex: 1 }}>
            <strong>Created:</strong> {created}
          </Alert>
          <Alert severity="info" sx={{ flex: 1 }}>
            <strong>Skipped (duplicates):</strong> {skipped}
          </Alert>
          <Alert severity="warning" sx={{ flex: 1 }}>
            <strong>Failed:</strong> {failed.length}
          </Alert>
        </Stack>

        {failed.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Failed Rows
            </Typography>
            <Box
              sx={{
                border: "1px solid #eee",
                borderRadius: 1,
                p: 1,
                maxHeight: 320,
                overflow: "auto",
                fontFamily: "monospace",
                fontSize: 13,
              }}
            >
              {failed.map((f, idx) => (
                <Box key={idx} sx={{ mb: 1 }}>
                  <div>
                    <strong>Row:</strong> {JSON.stringify(f.row)}
                  </div>
                  <div>
                    <strong>Errors:</strong> {JSON.stringify(f.errors)}
                  </div>
                </Box>
              ))}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ImportResultsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  result: PropTypes.shape({
    created: PropTypes.number,
    skipped: PropTypes.number,
    failed: PropTypes.arrayOf(
      PropTypes.shape({
        row: PropTypes.object,
        errors: PropTypes.any,
      })
    ),
  }),
  error: PropTypes.any,
};

ImportResultsModal.defaultProps = {
  result: { created: 0, skipped: 0, failed: [] },
  error: null,
};
