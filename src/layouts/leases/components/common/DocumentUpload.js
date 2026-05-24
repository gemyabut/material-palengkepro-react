// /src/layouts/leases/components/common/DocumentUpload.js
import React, { useRef } from 'react';
import { Button, Box, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

function DocumentUpload({ onChange, value, accept = ".pdf,.jpg,.jpeg,.png", label = "Upload Document" }) {
  const fileInputRef = useRef();

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      onChange(event.target.files[0]);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<UploadFileIcon />}
        onClick={() => fileInputRef.current.click()}
      >
        {label}
      </Button>
      <input
        type="file"
        accept={accept}
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      {value && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Selected: {value.name}
        </Typography>
      )}
    </Box>
  );
}

export default DocumentUpload;
