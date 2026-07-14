import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { DENOM_CONFIG, computeDenomTotal } from "layouts/eod-collection/components/DenominationBreakdown";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Unit 21.5 F1b-2: read-only denomination summary for the Phase D review page
// (per §6.1 mockup — denomination is entered upstream on the EOD Collection
// page; this panel just shows the saved total vs total_cash before Verify).
export default function DenominationEntryPanel({ intake }) {
  const total = computeDenomTotal(intake);
  const totalCash = Number(intake.total_cash ?? 0);
  const mismatch = Math.abs(total - totalCash) > 0.009;

  const bills = DENOM_CONFIG.slice(0, 6);
  const coins = DENOM_CONFIG.slice(6);

  const renderRow = (d) => {
    const count = intake[d.field] || 0;
    const subtotal = (parseInt(count, 10) || 0) * d.value;
    if (!count) return null;
    return (
      <MDBox key={d.field} display="flex" justifyContent="space-between" mb={0.5}>
        <MDTypography variant="caption" color="secondary">
          {d.label} × {count}
        </MDTypography>
        <MDTypography variant="caption" fontWeight="medium">
          {peso(subtotal)}
        </MDTypography>
      </MDBox>
    );
  };

  return (
    <MDBox mt={2}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <MDTypography variant="caption" color="secondary" fontWeight="bold" display="block" mb={1}>
            BILLS
          </MDTypography>
          {bills.map(renderRow)}
        </Grid>
        <Grid item xs={12} sm={6}>
          <MDTypography variant="caption" color="secondary" fontWeight="bold" display="block" mb={1}>
            COINS
          </MDTypography>
          {coins.map(renderRow)}
        </Grid>
      </Grid>

      <Divider sx={{ my: 1 }} />

      <MDBox display="flex" justifyContent="space-between" alignItems="center">
        <MDTypography variant="body2" fontWeight="bold">
          Denomination Total
        </MDTypography>
        <MDTypography variant="body2" fontWeight="bold" color={mismatch ? "error" : "success"}>
          {peso(total)}
        </MDTypography>
      </MDBox>

      {mismatch && (
        <Alert severity="warning" sx={{ mt: 1.5 }} icon={false}>
          Denomination total {peso(total)} does not match total cash {peso(totalCash)}. Return to
          the EOD Collection page to correct the count before verifying.
        </Alert>
      )}
    </MDBox>
  );
}

export function denominationSumMatchesTotalCash(intake) {
  const total = computeDenomTotal(intake);
  const totalCash = Number(intake?.total_cash ?? 0);
  return Math.abs(total - totalCash) <= 0.009;
}
