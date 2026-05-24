// src/layouts/profile/components/GovernmentIDUpload/index.js
import React, { useRef } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Grid, Button, Typography, Avatar } from "@mui/material";

import MDTypography from "components/MDTypography";

function GovernmentIDUpload({ profile, setProfile }) {
  const fileInputRef = useRef(null);

  const handleIDChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile((prev) => ({
        ...prev,
        government_id_photo: file,
        government_id_preview: URL.createObjectURL(file),
      }));
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Government ID Upload
        </MDTypography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <Avatar
              src={profile.government_id_preview || profile.government_id_photo || ""}
              alt="Government ID"
              variant="rounded"
              sx={{ width: 100, height: 100 }}
            />
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography variant="body2" gutterBottom>
              Upload a valid government-issued ID (e.g. UMID, Driver’s License)
            </Typography>
            <Button variant="outlined" onClick={() => fileInputRef.current.click()}>
              Upload ID
            </Button>
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileInputRef}
              onChange={handleIDChange}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

GovernmentIDUpload.propTypes = {
  profile: PropTypes.object.isRequired,
  setProfile: PropTypes.func.isRequired,
};

export default GovernmentIDUpload;
