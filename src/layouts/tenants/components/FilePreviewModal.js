// src/layouts/tenants/components/FilePreviewModal.js

import React from "react";
import { Dialog, DialogTitle, DialogContent, Button, DialogActions } from "@mui/material";
import PropTypes from "prop-types";

export default function FilePreviewModal({ open, onClose, fileUrl, fileType }) {
  const isImage = fileType?.startsWith("image") || /\.(png|jpe?g|gif|webp)$/i.test(fileUrl || "");
  const isPDF = fileType?.includes("pdf") || /\.pdf$/i.test(fileUrl || "");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Preview</DialogTitle>
      <DialogContent dividers>
        {isImage && (
          <img src={fileUrl} alt="preview" style={{ maxWidth: "100%", display: "block" }} />
        )}
        {isPDF && (
          <iframe
            title="pdf-preview"
            src={fileUrl}
            style={{ width: "100%", height: 600, border: 0 }}
          />
        )}
        {!isImage && !isPDF && (
          <p>
            Preview not available.{" "}
            <a href={fileUrl} target="_blank" rel="noreferrer">
              Open file
            </a>
          </p>
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

FilePreviewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fileUrl: PropTypes.string,
  fileType: PropTypes.string,
};

FilePreviewModal.defaultProps = { fileUrl: "", fileType: "" };
