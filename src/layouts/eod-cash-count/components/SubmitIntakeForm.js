import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function SubmitIntakeForm({ intake, onSubmit, submitting }) {
  const [actualAmount, setActualAmount] = useState(
    intake?.total_cash && parseFloat(intake.total_cash) > 0 ? String(intake.total_cash) : ""
  );
  const [varianceReason, setVarianceReason] = useState(intake?.variance_reason || "");
  const [fieldErr, setFieldErr] = useState({});

  const expected = parseFloat(intake?.expected_amount || 0);
  const actual   = parseFloat(actualAmount) || 0;
  const variance = actualAmount !== "" ? actual - expected : null;

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

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      actual_amount: parseFloat(actualAmount).toFixed(2),
      variance_reason: varianceReason,
    });
  };

  return (
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
        label="Actual Cash Count *"
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

      <MDBox>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting…" : "Submit Count"}
        </Button>
      </MDBox>
    </MDBox>
  );
}
