import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const peso = (v) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function DeductionsTodayWidget({ deductionsToday }) {
  if (!deductionsToday) return null;

  const approved = deductionsToday.approved ?? 0;
  const pending = deductionsToday.pending ?? 0;

  return (
    <Card sx={{ mt: 2, border: "1px solid #e0e0e0" }}>
      <CardContent>
        <MDTypography variant="h6" mb={1}>
          Cash Deductions — Today
        </MDTypography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <MDBox>
              <MDTypography variant="caption" color="secondary">
                Approved
              </MDTypography>
              <MDTypography variant="h5" fontWeight="bold" color="success.main">
                {peso(approved)}
              </MDTypography>
            </MDBox>
          </Grid>
          <Grid item xs={6}>
            <MDBox>
              <MDTypography variant="caption" color="secondary">
                Pending approval
              </MDTypography>
              <MDTypography variant="h5" fontWeight="bold" color="warning.main">
                {peso(pending)}
              </MDTypography>
              {Number(pending) > 0 && (
                <Tooltip title="Pending deductions require Market Administrator approval before they reduce the net cash position.">
                  <Chip
                    size="small"
                    label="Informational"
                    color="warning"
                    variant="outlined"
                    sx={{ mt: 0.5, fontSize: "0.65rem" }}
                  />
                </Tooltip>
              )}
            </MDBox>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
