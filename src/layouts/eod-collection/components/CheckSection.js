import React from "react";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import PropTypes from "prop-types";

export default function CheckSection({ checkCount, onCheckCountChange, value, onChange, error }) {
  return (
    <MDBox>
      <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
        ✍️ Checks
      </MDTypography>
      <Divider sx={{ mb: 1.5 }} />
      <MDBox display="flex" gap={2} flexWrap="wrap" alignItems="flex-start">
        <TextField
          label="Number of checks received"
          type="number"
          inputProps={{ min: 0, step: 1 }}
          value={checkCount}
          onChange={(e) => onCheckCountChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
          size="small"
          sx={{ width: 180 }}
        />
        <TextField
          label="Total check amount"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          sx={{ width: 200 }}
          error={!!error}
          helperText={error}
          InputProps={{
            startAdornment: <InputAdornment position="start">₱</InputAdornment>,
          }}
        />
      </MDBox>
    </MDBox>
  );
}

CheckSection.propTypes = {
  checkCount: PropTypes.number.isRequired,
  onCheckCountChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
};
CheckSection.defaultProps = { error: null };
