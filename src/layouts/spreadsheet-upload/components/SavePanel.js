import PropTypes from "prop-types";
import { Button, Card, CardContent, FormControl, FormControlLabel, Radio, RadioGroup, TextField } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const SAVE_MODES = [
  { value: "commit", label: "Commit — save valid rows, report rejects (default)" },
  { value: "all_or_nothing", label: "All or nothing — roll back everything if any row is rejected" },
  { value: "all_with_warnings", label: "Save with warnings — commit despite rejects (requires approver)" },
];

function SavePanel({ saveMode, onSaveModeChange, approverId, onApproverIdChange, onSave, saving }) {
  const needsApprover = saveMode === "all_with_warnings";
  const disabled = saving || (needsApprover && !approverId.trim());

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <MDTypography variant="h6" mb={1}>
          2. Save options
        </MDTypography>
        <FormControl>
          <RadioGroup value={saveMode} onChange={(e) => onSaveModeChange(e.target.value)}>
            {SAVE_MODES.map((m) => (
              <FormControlLabel key={m.value} value={m.value} control={<Radio size="small" />} label={m.label} />
            ))}
          </RadioGroup>
        </FormControl>

        {needsApprover && (
          <MDBox mt={1} maxWidth={320}>
            <TextField
              label="Approver user ID"
              size="small"
              fullWidth
              value={approverId}
              onChange={(e) => onApproverIdChange(e.target.value)}
              helperText="Must be an Owner, Finance Manager, or Market Administrator user ID."
            />
          </MDBox>
        )}

        <MDBox mt={2}>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={disabled}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </MDBox>
      </CardContent>
    </Card>
  );
}

SavePanel.propTypes = {
  saveMode: PropTypes.string.isRequired,
  onSaveModeChange: PropTypes.func.isRequired,
  approverId: PropTypes.string.isRequired,
  onApproverIdChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
SavePanel.defaultProps = { saving: false };

export default SavePanel;
