import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import AccountTile from "./AccountTile";
import { DESTINATION_LABELS } from "utils/destinationLabels";

const SECTION_LABELS = {
  COLLECTOR_POCKET:     "Collector Pockets",
  OPERATOR_SAFE:        "Operator Safe",
  BANK_PENDING:         DESTINATION_LABELS.BANK.pending,
  BANK:                 DESTINATION_LABELS.BANK.settled,
  LGU_TREASURY_PENDING: DESTINATION_LABELS.LGU_TREASURY.pending,
  LGU_TREASURY:         DESTINATION_LABELS.LGU_TREASURY.settled,
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
