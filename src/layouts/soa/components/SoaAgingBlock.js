import React from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import MDTypography from "components/MDTypography";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

function Bucket({ label, value, highlight }) {
  return (
    <Box
      sx={{
        p: 1.5,
        border: "1px solid",
        borderColor: highlight ? "error.main" : "divider",
        borderRadius: 1,
        bgcolor: highlight ? "error.light" : "background.paper",
        textAlign: "center",
      }}
    >
      <MDTypography variant="caption" color={highlight ? "error" : "secondary"} display="block">
        {label}
      </MDTypography>
      <MDTypography variant="h6" color={highlight ? "error" : "text"} fontWeight="bold">
        {peso(value)}
      </MDTypography>
    </Box>
  );
}

function SoaAgingBlock({ aging }) {
  if (!aging) return null;

  return (
    <Box mt={2}>
      <MDTypography variant="overline" color="text" mb={1} display="block">
        Aging Summary (as of {aging.as_of || "today"})
      </MDTypography>
      <Grid container spacing={1}>
        <Grid item xs={6} sm={2}>
          <Bucket label="Current" value={aging.current} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <Bucket label="31–60 days" value={aging.d31_60} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <Bucket label="61–90 days" value={aging.d61_90} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <Bucket label="90+ days" value={aging.d90_plus} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <Bucket label="Past Due > 30" value={aging.past_due_over_30} highlight />
        </Grid>
        <Grid item xs={6} sm={2}>
          <Bucket label="Total Outstanding" value={aging.total} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default SoaAgingBlock;
