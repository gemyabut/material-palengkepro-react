// src/layouts/profile/components/ContactInfoCard/index.js
import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Grid, TextField } from "@mui/material";
import MDTypography from "components/MDTypography";

function ContactInfoCard({ profile, setProfile }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Emergency Contact Information
        </MDTypography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Contact Person"
              name="contact_person"
              value={profile.contact_person || ""}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Emergency Contact Number"
              name="emergency_contact_info"
              value={profile.emergency_contact_info || ""}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

ContactInfoCard.propTypes = {
  profile: PropTypes.object.isRequired,
  setProfile: PropTypes.func.isRequired,
};

export default ContactInfoCard;
