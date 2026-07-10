import React from "react";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import PropTypes from "prop-types";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DigitalVerifySection({
  icon, label, systemAmount, value, onChange, confirmed, onConfirmChange, confirmError,
}) {
  const overrideVal = parseFloat(value) || 0;
  const systemVal   = parseFloat(systemAmount) || 0;
  const hasDelta    = value !== "" && Math.abs(overrideVal - systemVal) > 0.005;

  return (
    <MDBox>
      <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
        {icon} {label}
        <MDTypography component="span" variant="caption" color="secondary" ml={1}>
          (auto-tallied from Payments)
        </MDTypography>
      </MDTypography>
      <Divider sx={{ mb: 1.5 }} />

      <MDBox mb={1.5}>
        <MDTypography variant="caption" color="secondary" display="block">
          System recorded
        </MDTypography>
        <MDTypography variant="body1" fontWeight="medium">
          {peso(systemAmount)}
        </MDTypography>
      </MDBox>

      <TextField
        label="Override (leave blank to accept system amount)"
        type="number"
        inputProps={{ min: 0, step: "0.01" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="small"
        sx={{ width: 280, mb: 1 }}
        InputProps={{
          startAdornment: <InputAdornment position="start">₱</InputAdornment>,
        }}
      />

      {hasDelta && (
        <MDTypography variant="caption" color="warning.main" display="block" mb={1}>
          Δ {overrideVal > systemVal ? "+" : ""}{peso(overrideVal - systemVal)} from system amount
        </MDTypography>
      )}

      <FormControlLabel
        control={
          <Checkbox
            checked={confirmed}
            onChange={(e) => onConfirmChange(e.target.checked)}
            size="small"
            color={confirmError ? "error" : "primary"}
          />
        }
        label={
          <MDTypography variant="body2" color={confirmError ? "error" : "text"}>
            I&apos;ve verified {label} receipts match
          </MDTypography>
        }
      />
      {confirmError && (
        <MDTypography variant="caption" color="error" display="block" ml={4}>
          {confirmError}
        </MDTypography>
      )}
    </MDBox>
  );
}

DigitalVerifySection.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  systemAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  confirmed: PropTypes.bool.isRequired,
  onConfirmChange: PropTypes.func.isRequired,
  confirmError: PropTypes.string,
};
DigitalVerifySection.defaultProps = { systemAmount: 0, confirmError: null };
