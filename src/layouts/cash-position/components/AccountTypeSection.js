import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import AccountTile from "./AccountTile";

const SECTION_LABELS = {
  COLLECTOR_POCKET: "Collector Pockets",
  OPERATOR_SAFE:    "Operator Safe",
  BANK_PENDING:     "Bank Pending",
  BANK:             "Bank Confirmed",
};

export default function AccountTypeSection({ accountType, accounts }) {
  if (!accounts || accounts.length === 0) return null;
  const label = SECTION_LABELS[accountType] || accountType;

  return (
    <MDBox mb={3}>
      <MDTypography variant="h6" fontWeight="medium" mb={1}>
        {label}
      </MDTypography>
      <Grid container spacing={2}>
        {accounts.map((acct) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={acct.id}>
            <AccountTile account={acct} />
          </Grid>
        ))}
      </Grid>
    </MDBox>
  );
}
