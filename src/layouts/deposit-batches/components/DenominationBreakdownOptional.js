import React, { useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import FormControlLabel from "@mui/material/FormControlLabel";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DenominationBreakdown, {
  computeDenomTotal,
  denomFieldsEntered,
} from "layouts/eod-cash-count/components/DenominationBreakdown";

export const EMPTY_DENOM = {
  bill_1000: 0,
  bill_500: 0,
  bill_200: 0,
  bill_100: 0,
  bill_50: 0,
  bill_20: 0,
  coin_20: 0,
  coin_10: 0,
  coin_5: 0,
  coin_1: 0,
  coin_025: 0,
  coin_010: 0,
};

export { computeDenomTotal, denomFieldsEntered };

// eslint-disable-next-line react/prop-types
export default function DenominationBreakdownOptional({ fields, onChange, cashTotal }) {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = (e) => {
    setEnabled(e.target.checked);
    if (!e.target.checked) onChange(EMPTY_DENOM);
  };

  return (
    <MDBox>
      <FormControlLabel
        control={<Checkbox checked={enabled} onChange={handleToggle} size="small" />}
        label={
          <MDTypography variant="body2">
            Enter denomination breakdown
            <MDTypography component="span" variant="caption" color="secondary" ml={0.5}>
              (optional — required for Bank Deposit Tally Sheet)
            </MDTypography>
          </MDTypography>
        }
      />
      <Collapse in={enabled}>
        <MDBox mt={1} pl={1} borderLeft="3px solid #e0e0e0">
          <DenominationBreakdown fields={fields} onChange={onChange} actualAmount={cashTotal} />
        </MDBox>
      </Collapse>
    </MDBox>
  );
}
