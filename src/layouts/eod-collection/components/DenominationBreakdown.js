import React from "react";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

export const DENOM_CONFIG = [
  { field: "bill_1000", label: "₱1,000 bills", value: 1000 },
  { field: "bill_500", label: "₱500 bills", value: 500 },
  { field: "bill_200", label: "₱200 bills", value: 200 },
  { field: "bill_100", label: "₱100 bills", value: 100 },
  { field: "bill_50", label: "₱50 bills", value: 50 },
  { field: "bill_20", label: "₱20 bills", value: 20 },
  { field: "coin_20", label: "₱20 coin", value: 20 },
  { field: "coin_10", label: "₱10 coin", value: 10 },
  { field: "coin_5", label: "₱5 coin", value: 5 },
  { field: "coin_1", label: "₱1 coin", value: 1 },
  { field: "coin_025", label: "25¢ coin", value: 0.25 },
  { field: "coin_010", label: "10¢ coin", value: 0.1 },
];

export function computeDenomTotal(fields) {
  return DENOM_CONFIG.reduce((sum, d) => {
    const count = parseInt(fields[d.field] || 0, 10);
    return sum + (isNaN(count) ? 0 : count) * d.value;
  }, 0);
}

export function denomFieldsEntered(fields) {
  return DENOM_CONFIG.some((d) => parseInt(fields[d.field] || 0, 10) > 0);
}

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// eslint-disable-next-line react/prop-types
export default function DenominationBreakdown({ fields, onChange, actualAmount }) {
  const handleChange = (fieldName, raw) => {
    const val = raw === "" ? 0 : Math.max(0, parseInt(raw, 10) || 0);
    onChange({ ...fields, [fieldName]: val });
  };

  const total = computeDenomTotal(fields);
  const entered = denomFieldsEntered(fields);
  const actual = parseFloat(actualAmount) || 0;
  const mismatch = entered && Math.abs(total - actual) > 0.009;

  const bills = DENOM_CONFIG.slice(0, 6);
  const coins = DENOM_CONFIG.slice(6);

  const renderField = (d) => {
    const count = fields[d.field] || 0;
    const subtotal = (parseInt(count, 10) || 0) * d.value;
    return (
      <MDBox key={d.field} display="flex" alignItems="center" gap={1} mb={0.75}>
        <TextField
          label={d.label}
          type="number"
          inputProps={{ min: 0, step: 1 }}
          value={count || ""}
          onChange={(e) => handleChange(d.field, e.target.value)}
          size="small"
          sx={{ width: 90 }}
        />
        <MDTypography variant="caption" color="secondary" sx={{ minWidth: 70 }}>
          × {d.value >= 1 ? `₱${d.value}` : `${d.value * 100}¢`}
        </MDTypography>
        <MDTypography
          variant="caption"
          fontWeight="medium"
          sx={{ minWidth: 80, textAlign: "right" }}
        >
          {subtotal > 0 ? peso(subtotal) : "—"}
        </MDTypography>
      </MDBox>
    );
  };

  return (
    <MDBox>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <MDTypography
            variant="caption"
            color="secondary"
            fontWeight="bold"
            display="block"
            mb={1}
          >
            BILLS
          </MDTypography>
          {bills.map(renderField)}
        </Grid>
        <Grid item xs={12} sm={6}>
          <MDTypography
            variant="caption"
            color="secondary"
            fontWeight="bold"
            display="block"
            mb={1}
          >
            COINS
          </MDTypography>
          {coins.map(renderField)}
        </Grid>
      </Grid>

      <Divider sx={{ my: 1 }} />

      <MDBox display="flex" justifyContent="space-between" alignItems="center">
        <MDTypography variant="body2" fontWeight="bold">
          Denomination Total
        </MDTypography>
        <MDTypography
          variant="body2"
          fontWeight="bold"
          color={!entered ? "text" : mismatch ? "error" : "success"}
        >
          {entered ? peso(total) : "—"}
        </MDTypography>
      </MDBox>

      {mismatch && (
        <Alert severity="warning" sx={{ mt: 1.5 }} icon={false}>
          Denomination total {peso(total)} does not match actual count {peso(actual)}. Recount or
          submit to escalate for Market Admin override.
        </Alert>
      )}

      {entered && !mismatch && (
        <Alert severity="success" sx={{ mt: 1.5 }} icon={false}>
          Denomination total matches actual count ✓
        </Alert>
      )}
    </MDBox>
  );
}
