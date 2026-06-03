// src/layouts/profile/components/TenantDetails/index.js

import React from "react";
import { Card, CardContent, Grid, TextField } from "@mui/material";
import MDTypography from "components/MDTypography";
import PropTypes from "prop-types";

const TenantDetails = ({ profile, setProfile }) => {
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  return (
    <Card>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Tenant-Specific Details
        </MDTypography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Barangay Permit Number"
              name="barangay_permit_num"
              value={profile.barangay_permit_num || ""}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Emergency Contact Info"
              name="emergency_contact_info"
              value={profile.emergency_contact_info || ""}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>
          {/* Government ID is a sensitive field — never surfaced at Tier 1 (doc 21 §6 / doc 02 §10). */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Social Media Account"
              name="social_media_account"
              value={profile.social_media_account || ""}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

TenantDetails.propTypes = {
  profile: PropTypes.shape({
    barangay_permit_num: PropTypes.string,
    emergency_contact_info: PropTypes.string,
    social_media_account: PropTypes.string,
  }).isRequired,
  setProfile: PropTypes.func.isRequired,
};

export default TenantDetails;
