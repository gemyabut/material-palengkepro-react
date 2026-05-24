// src/layouts/stalls/components/StallsSummaryWidget.js

import React from "react";
import { Card, CardContent, Grid, Chip, CircularProgress } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import PropTypes from "prop-types";

StallsSummaryWidget.propTypes = {
  summary: PropTypes.array.isRequired,
  total: PropTypes.number.isRequired,
  loading: PropTypes.bool.isRequired,
};

// Status colors and labels
const statusMap = {
  AVAILABLE: { color: "success", label: "Available" },
  OCCUPIED: { color: "error", label: "Occupied" },
  RESERVED: { color: "warning", label: "Reserved" },
  UNDER_MAINTENANCE: { color: "info", label: "Under Maintenance" },
  INACTIVE: { color: "default", label: "Inactive" },
};

export default function StallsSummaryWidget({ summary = [], total = 0, loading }) {
  // summary: [{ status: "AVAILABLE", count: 10 }, ...]
  // total: total number of stalls
  // loading: bool

  return (
    <MDBox mb={3}>
      <Grid container spacing={2}>
        {loading ? (
          <Grid item xs={12}>
            <MDBox display="flex" justifyContent="center" alignItems="center" p={2}>
              <CircularProgress />
            </MDBox>
          </Grid>
        ) : (
          <>
            {Object.keys(statusMap).map((status) => {
              const entry = summary.find((s) => s.status === status) || { count: 0 };
              return (
                <Grid item xs={12} sm={6} md={2.4} key={status}>
                  <Card>
                    <CardContent>
                      <MDBox display="flex" flexDirection="column" alignItems="center">
                        <Chip
                          label={statusMap[status].label}
                          color={statusMap[status].color}
                          sx={{ mb: 1, fontWeight: "bold" }}
                        />
                        <MDTypography variant="h5" fontWeight="medium">
                          {entry.count}
                        </MDTypography>
                      </MDBox>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <MDBox display="flex" flexDirection="column" alignItems="center">
                    <Chip label="Total" color="primary" sx={{ mb: 1, fontWeight: "bold" }} />
                    <MDTypography variant="h5" fontWeight="medium">
                      {total}
                    </MDTypography>
                  </MDBox>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </MDBox>
  );
}
