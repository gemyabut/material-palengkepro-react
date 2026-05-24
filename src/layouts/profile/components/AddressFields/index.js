// src/layouts/profile/components/DetailedAddressFields/index.js
import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Grid, TextField } from "@mui/material";
import MDTypography from "components/MDTypography";

function DetailedAddressFields({ profile, setProfile }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Residential Address
        </MDTypography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="House/Street/Unit"
              name="address_line1"
              value={profile.address_line1 || ""}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Purok/Sitio"
              name="address_line2"
              value={profile.address_line2 || ""}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Barangay"
              name="barangay"
              value={profile.barangay || ""}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="City/Municipality"
              name="city"
              value={profile.city || ""}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Province"
              name="province"
              value={profile.province || ""}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Postal Code"
              name="postal_code"
              value={profile.postal_code || ""}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

DetailedAddressFields.propTypes = {
  profile: PropTypes.object.isRequired,
  setProfile: PropTypes.func.isRequired,
};

export default DetailedAddressFields;
