import React from "react";
import Alert from "@mui/material/Alert";
import MDTypography from "components/MDTypography";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function UnmatchedAlert({ count, amount }) {
  if (!count) return null;
  return (
    <Alert severity="warning" sx={{ mb: 1.5 }}>
      <MDTypography variant="body2" fontWeight="medium">
        {count} deposit{count !== 1 ? "s" : ""} awaiting bank confirmation —{" "}
        {peso(amount)} unmatched
      </MDTypography>
    </Alert>
  );
}
