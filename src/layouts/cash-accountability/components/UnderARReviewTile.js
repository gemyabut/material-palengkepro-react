import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Unit 21.5 F1b-3: 6th invariant tile. Only renders when the key is present —
// frozen/CLOSED periods from before Unit 21.5 shipped omit it (see
// CashAccountabilityDashboardView's snapshot branch in finance/views.py).
export default function UnderARReviewTile({ invariant }) {
  if (!invariant || invariant.under_ar_review === undefined) return null;

  return (
    <MDBox>
      <MDTypography variant="caption" color="secondary">
        Under A/R Review
      </MDTypography>
      <MDTypography variant="body1" fontWeight="medium">
        {peso(invariant.under_ar_review)}
      </MDTypography>
    </MDBox>
  );
}
