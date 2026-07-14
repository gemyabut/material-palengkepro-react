import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { canApproveIntake } from "utils/permissions";
import ApproveAllButton from "./ApproveAllButton";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Total({ label, value }) {
  return (
    <Grid item xs={6} sm={3}>
      <MDTypography variant="caption" color="secondary" display="block">
        {label}
      </MDTypography>
      <MDTypography variant="body2" fontWeight="bold">
        {peso(value)}
      </MDTypography>
    </Grid>
  );
}

export default function CashierIntakeSummary({ intake, role, payments }) {
  return (
    <MDBox mt={3}>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Total label="Cash" value={intake.total_cash} />
        <Total label="GCash" value={intake.total_gcash} />
        <Total label="Bank" value={intake.total_bank} />
        <Total label="Check" value={intake.total_check} />
      </Grid>

      {canApproveIntake(role) && <ApproveAllButton intake={intake} payments={payments} />}
    </MDBox>
  );
}
