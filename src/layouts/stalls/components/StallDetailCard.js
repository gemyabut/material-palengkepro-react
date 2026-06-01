import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent, CardHeader, Grid, Divider } from "@mui/material";
import MDTypography from "components/MDTypography";

export default function StallDetailCard({ stall }) {
  if (!stall) return null;

  return (
    <Card sx={{ minWidth: 350, maxWidth: 520 }}>
      <CardHeader
        title={`Stall Detail: ${stall.stall_number || ""}`}
        subheader={stall.status ? `Status: ${stall.status}` : ""}
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2}>
          {/* Zone */}
          <Grid item xs={6}>
            <MDTypography variant="button" color="text">
              Zone:
            </MDTypography>
            <MDTypography variant="body2">{stall.zone || "—"}</MDTypography>
          </Grid>
          {/* Type */}
          <Grid item xs={6}>
            <MDTypography variant="button" color="text">
              Type:
            </MDTypography>
            <MDTypography variant="body2">{stall.stall_type || "—"}</MDTypography>
          </Grid>
          {/* Section */}
          <Grid item xs={6}>
            <MDTypography variant="button" color="text">
              Section:
            </MDTypography>
            <MDTypography variant="body2">{stall.section || "—"}</MDTypography>
          </Grid>
          {/* Classification */}
          <Grid item xs={6}>
            <MDTypography variant="button" color="text">
              Classification:
            </MDTypography>
            <MDTypography variant="body2">{stall.classification || "—"}</MDTypography>
          </Grid>
          {/* Size */}
          <Grid item xs={6}>
            <MDTypography variant="button" color="text">
              Size (sqm):
            </MDTypography>
            <MDTypography variant="body2">{stall.size_sqm || "—"}</MDTypography>
          </Grid>
          {/* Rate */}
          <Grid item xs={6}>
            <MDTypography variant="button" color="text">
              Current Rate:
            </MDTypography>
            <MDTypography variant="body2">{stall.current_rate || "—"}</MDTypography>
          </Grid>
          {/* Current Tenant */}
          <Grid item xs={12}>
            <MDTypography variant="button" color="text.secondary">
              Current Tenant:
            </MDTypography>
            <MDTypography variant="body2">{stall.current_tenant || "—"}</MDTypography>
          </Grid>
          {/* Remarks */}
          <Grid item xs={12}>
            <MDTypography variant="button" color="text">
              Remarks:
            </MDTypography>
            <MDTypography variant="body2">{stall.remarks || "—"}</MDTypography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

StallDetailCard.propTypes = {
  stall: PropTypes.object.isRequired,
};
