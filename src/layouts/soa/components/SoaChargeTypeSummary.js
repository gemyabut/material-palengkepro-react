import React from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const peso = (v) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

// M1 (UNIT_53 Phase D.3) — 5 cards, one per canonical charge-type section
// (RENT, RIGHTS, ELECTRICITY, WATER, OTHER — the order generate_statement's
// `sections` array is already returned in). Mirrors the cash-position
// summary tile style (AccountTile.js / DeductionsTodayWidget.js) for
// visual consistency with the rest of the dashboard.
function SoaChargeTypeSummary({ sections }) {
  if (!sections || sections.length === 0) return null;

  return (
    <Grid container spacing={2} mb={3}>
      {sections.map((section) => (
        <Grid item xs={12} sm={6} md={2.4} key={section.charge_type_code}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <MDTypography variant="h6" fontWeight="medium" noWrap>
                {section.charge_type_label}
              </MDTypography>
              <MDTypography variant="caption" color="secondary" display="block">
                Balance
              </MDTypography>
              <MDTypography
                variant="h5"
                fontWeight="bold"
                color={Number(section.balance) > 0 ? "error.main" : "success.main"}
              >
                {peso(section.balance)}
              </MDTypography>
              <MDBox mt={1}>
                <MDTypography variant="caption" color="secondary" display="block">
                  Charged: {peso(section.total_charged)}
                </MDTypography>
                <MDTypography variant="caption" color="secondary" display="block">
                  Paid: {peso(section.total_paid)}
                </MDTypography>
              </MDBox>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

SoaChargeTypeSummary.propTypes = {
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      charge_type_code: PropTypes.string.isRequired,
      charge_type_label: PropTypes.string,
      balance: PropTypes.string,
      total_charged: PropTypes.string,
      total_paid: PropTypes.string,
    })
  ),
};

SoaChargeTypeSummary.defaultProps = {
  sections: [],
};

export default SoaChargeTypeSummary;
