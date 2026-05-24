// /src/layouts/leases/components/common/LeaseSummaryWidget.js
import React from "react";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import PropTypes from "prop-types";

function LeaseSummaryWidget({ summaryData }) {
  return (
    <Grid container spacing={2} sx={{ mb: 1 }}>
      {summaryData.map((item) => (
        <Grid item xs={12} sm={6} md={3} key={item.label}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                {item.label}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {item.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

LeaseSummaryWidget.propTypes = {
  summaryData: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.number,
    })
  ).isRequired,
};

export default LeaseSummaryWidget;
