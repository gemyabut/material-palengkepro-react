import React, { useState } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DenominationBreakdown, {
  computeDenomTotal,
  denomFieldsEntered,
} from "./DenominationBreakdown";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EMPTY_DENOM = {
  bill_1000: 0, bill_500: 0, bill_200: 0, bill_100: 0, bill_50: 0, bill_20: 0,
  coin_20: 0, coin_10: 0, coin_5: 0, coin_1: 0, coin_025: 0, coin_010: 0,
};

export default function SubmitIntakeForm({ intake, onSubmit, submitting }) {
  const [actualAmount, setActualAmount] = useState(
    intake?.total_cash && parseFloat(intake.total_cash) > 0 ? String(intake.total_cash) : ""
  );
  const [varianceReason, setVarianceReason] = useState(intake?.variance_reason || "");
  const [denomEnabled, setDenomEnabled] = useState(false);
  const [denomFields, setDenomFields] = useState(EMPTY_DENOM);
  const [fieldErr, setFieldErr] = useState({});
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);

  const expected = parseFloat(intake?.expected_amount || 0);
  const actual   = parseFloat(actualAmount) || 0;
  const variance = actualAmount !== "" ? actual - expected : null;

  const denomTotal   = computeDenomTotal(denomFields);
  const denomEntered = denomEnabled && denomFieldsEntered(denomFields);
  const denomMismatch = denomEntered && Math.abs(denomTotal - actual) > 0.009;

  const varianceColor =
    variance === null ? "text" :
    variance === 0    ? "success" :
    variance < 0      ? "error" : "info";

  const validate = () => {
    const errs = {};
    if (actualAmount === "" || isNaN(parseFloat(actualAmount))) {
      errs.actualAmount = "Actual amount is required.";
    } else if (parseFloat(actualAmount) < 0) {
      errs.actualAmount = "Amount cannot be negative.";
    }
    if (variance !== null && variance !== 0 && !varianceReason.trim()) {
      errs.varianceReason = "Reason is required when variance is not zero.";
    }
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = () => ({
    actual_amount: parseFloat(actualAmount).toFixed(2),
    variance_reason: varianceReason,
    ...(denomEntered ? denomFields : {}),
  });

  const handleSubmit = () => {
    if (!validate()) return;
    if (denomMismatch) {
      setOverrideDialogOpen(true);
      return;
    }
    onSubmit(buildPayload());
  };

  const handleConfirmOverride = () => {
    setOverrideDialogOpen(false);
    onSubmit(buildPayload());
  };

  return (
    <>
      <MDBox display="flex" flexDirection="column" gap={2.5}>
        <MDBox>
          <MDTypography variant="caption" color="secondary" display="block">
            System Expected Amount
          </MDTypography>
          <MDTypography variant="h5" fontWeight="bold">
            {peso(expected)}
          </MDTypography>
        </MDBox>

        <TextField
          label="Actual Cash Amount *"
          type="number"
          inputProps={{ min: 0, step: "0.01" }}
          value={actualAmount}
          onChange={(e) => { setActualAmount(e.target.value); setFieldErr({}); }}
          error={!!fieldErr.actualAmount}
          helperText={fieldErr.actualAmount}
          size="small"
          sx={{ maxWidth: 280 }}
          InputProps={{
            startAdornment: <InputAdornment position="start">₱</InputAdornment>,
          }}
        />

        {variance !== null && (
          <MDBox>
            <MDTypography variant="caption" color="secondary" display="block">Variance</MDTypography>
            <MDTypography variant="h6" fontWeight="bold" color={varianceColor}>
              {variance > 0 ? "+" : ""}{peso(variance)}
              {variance === 0 ? " ✓" : variance < 0 ? " (short)" : " (over)"}
            </MDTypography>
          </MDBox>
        )}

        {variance !== null && variance !== 0 && (
          <TextField
            label="Variance Reason *"
            multiline
            rows={3}
            value={varianceReason}
            onChange={(e) => { setVarianceReason(e.target.value); setFieldErr({}); }}
            error={!!fieldErr.varianceReason}
            helperText={fieldErr.varianceReason}
            fullWidth
          />
        )}

        {/* D3: Denomination breakdown — optional */}
        <MDBox>
          <FormControlLabel
            control={
              <Checkbox
                checked={denomEnabled}
                onChange={(e) => {
                  setDenomEnabled(e.target.checked);
                  if (!e.target.checked) setDenomFields(EMPTY_DENOM);
                }}
                size="small"
              />
            }
            label={
              <MDTypography variant="body2">
                Enter denomination breakdown
                <MDTypography component="span" variant="caption" color="secondary" ml={0.5}>
                  (optional)
                </MDTypography>
              </MDTypography>
            }
          />
          <Collapse in={denomEnabled}>
            <MDBox mt={1} pl={1} borderLeft="3px solid #e0e0e0">
              <DenominationBreakdown
                fields={denomFields}
                onChange={setDenomFields}
                actualAmount={actual}
              />
            </MDBox>
          </Collapse>
        </MDBox>

        <MDBox>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : denomMismatch ? "Submit for Override" : "Submit Count"}
          </Button>
        </MDBox>
      </MDBox>

      {/* D2 override confirmation dialog */}
      <Dialog open={overrideDialogOpen} onClose={() => setOverrideDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Denomination Mismatch</DialogTitle>
        <DialogContent>
          <MDTypography variant="body2" gutterBottom>
            Denomination total <strong>{peso(denomTotal)}</strong> does not match
            your count <strong>{peso(actual)}</strong>.
          </MDTypography>
          <MDTypography variant="body2" color="secondary">
            Submitting will flag this for Market Administrator review. You can resubmit
            after the override is approved.
          </MDTypography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialogOpen(false)}>Recount</Button>
          <Button onClick={handleConfirmOverride} variant="contained" color="warning">
            Submit for Override
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
