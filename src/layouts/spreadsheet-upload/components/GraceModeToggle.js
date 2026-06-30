import PropTypes from "prop-types";
import { FormControlLabel, Switch, Tooltip } from "@mui/material";
import MDTypography from "components/MDTypography";

function GraceModeToggle({ value, onChange }) {
  return (
    <Tooltip
      title="GRACE mode: converts FK-not-found errors to warnings for historical data where receipt books may not yet be loaded. Use during Stage 1A office-prep only."
      placement="right"
    >
      <FormControlLabel
        control={<Switch checked={value} onChange={(e) => onChange(e.target.checked)} color="warning" />}
        label={
          <MDTypography variant="caption" color={value ? "warning" : "text"}>
            GRACE mode (historical import — Finance Mgr / Market Admin only)
          </MDTypography>
        }
      />
    </Tooltip>
  );
}

GraceModeToggle.propTypes = {
  value: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default GraceModeToggle;
