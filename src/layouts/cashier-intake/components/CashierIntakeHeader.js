import Chip from "@mui/material/Chip";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { canVerifyCashCount } from "utils/permissions";
import DenominationEntryPanel from "./DenominationEntryPanel";
import VerifyCashCountButton from "./VerifyCashCountButton";

function GatePill({ label, passed }) {
  return (
    <Chip
      size="small"
      label={passed ? `${label} ✓` : `${label} pending`}
      color={passed ? "success" : "default"}
      variant={passed ? "filled" : "outlined"}
    />
  );
}

export default function CashierIntakeHeader({ intake, role, onVerified }) {
  return (
    <MDBox mb={3}>
      <MDTypography variant="h5">Cashier Intake #{intake.id}</MDTypography>
      <MDTypography variant="body2" color="secondary">
        Collector: {intake.collector_name} &middot; Date: {intake.date}
      </MDTypography>

      <MDBox display="flex" gap={1} mt={1}>
        <Chip size="small" label={intake.status} />
        <GatePill label="Cashier" passed={intake.cashier_verified} />
        <GatePill label="A/R" passed={intake.ar_reviewed} />
      </MDBox>

      <DenominationEntryPanel intake={intake} />

      {canVerifyCashCount(role) && <VerifyCashCountButton intake={intake} onVerified={onVerified} />}
    </MDBox>
  );
}
