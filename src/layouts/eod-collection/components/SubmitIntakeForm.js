import React, { useState } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DenominationBreakdown, {
  computeDenomTotal,
  denomFieldsEntered,
} from "./DenominationBreakdown";
import CheckSection from "./CheckSection";
import DigitalVerifySection from "./DigitalVerifySection";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EMPTY_DENOM = {
  bill_1000: 0, bill_500: 0, bill_200: 0, bill_100: 0, bill_50: 0, bill_20: 0,
  coin_20: 0, coin_10: 0, coin_5: 0, coin_1: 0, coin_025: 0, coin_010: 0,
};

export default function SubmitIntakeForm({ intake, onSubmit, submitting }) {
  // Cash — Unit 48: renamed from actualAmount to actualCash (API key renamed to actual_cash)
  const [actualCash, setActualCash] = useState(
    intake?.total_cash && parseFloat(intake.total_cash) > 0 ? String(intake.total_cash) : ""
  );
  const [denomEnabled, setDenomEnabled] = useState(false);
  const [denomFields, setDenomFields]   = useState(EMPTY_DENOM);

  // Check
  const [checkCount, setCheckCount]   = useState(0);
  const [actualCheck, setActualCheck] = useState("0");

  // GCASH — pre-populate from rollup
  const [actualGcash, setActualGcash]     = useState(String(intake?.total_gcash ?? "0"));
  const [gcashConfirmed, setGcashConfirmed] = useState(false);

  // Bank — pre-populate from rollup
  const [actualBank, setActualBank]       = useState(String(intake?.total_bank ?? "0"));
  const [bankConfirmed, setBankConfirmed]   = useState(false);

  // Common
  const [varianceReason, setVarianceReason] = useState(intake?.variance_reason || "");
  const [fieldErr, setFieldErr]             = useState({});
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);

  // Derived totals
  const expected    = parseFloat(intake?.expected_amount || 0);
  const cash        = parseFloat(actualCash) || 0;
  const check       = parseFloat(actualCheck) || 0;
  const gcash       = parseFloat(actualGcash) || 0;
  const bank        = parseFloat(actualBank) || 0;
  const grandTotal  = cash + check + gcash + bank;
  const variance    = actualCash !== "" ? grandTotal - expected : null;

  const denomTotal    = computeDenomTotal(denomFields);
  const denomEntered  = denomEnabled && denomFieldsEntered(denomFields);
  const denomMismatch = denomEntered && Math.abs(denomTotal - cash) > 0.009;

  const varianceColor =
    variance === null ? "text" :
    variance === 0    ? "success" :
    variance < 0      ? "error" : "info";

  const clearErrors = () => setFieldErr({});

  const validate = () => {
    const errs = {};
    if (actualCash === "" || isNaN(parseFloat(actualCash))) {
      errs.actualCash = "Actual cash amount is required.";
    } else if (parseFloat(actualCash) < 0) {
      errs.actualCash = "Amount cannot be negative.";
    }
    if (!gcashConfirmed) {
      errs.gcashConfirmed = "Please verify GCASH receipts before submitting.";
    }
    if (!bankConfirmed) {
      errs.bankConfirmed = "Please verify bank deposit receipts before submitting.";
    }
    if (variance !== null && variance !== 0 && !varianceReason.trim()) {
      errs.varianceReason = "Reason is required when variance is not zero.";
    }
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = () => ({
    actual_cash:     parseFloat(actualCash).toFixed(2),
    actual_check:    parseFloat(actualCheck || 0).toFixed(2),
    actual_gcash:    parseFloat(actualGcash || 0).toFixed(2),
    actual_bank:     parseFloat(actualBank || 0).toFixed(2),
    check_count:     checkCount,
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
      <MDBox display="flex" flexDirection="column" gap={3}>
        {/* Expected header */}
        <MDBox>
          <MDTypography variant="caption" color="secondary" display="block">
            System Expected Amount
          </MDTypography>
          <MDTypography variant="h5" fontWeight="bold">
            {peso(expected)}
          </MDTypography>
        </MDBox>

        {/* ── Cash section ─────────────────────────────────────────────── */}
        <MDBox>
          <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
            💵 Cash
          </MDTypography>
          <Divider sx={{ mb: 1.5 }} />
          <TextField
            label="Actual Cash Amount *"
            type="number"
            inputProps={{ min: 0, step: "0.01" }}
            value={actualCash}
            onChange={(e) => { setActualCash(e.target.value); clearErrors(); }}
            error={!!fieldErr.actualCash}
            helperText={fieldErr.actualCash}
            size="small"
            sx={{ maxWidth: 280 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">₱</InputAdornment>,
            }}
          />

          <MDBox mt={2}>
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
                  actualAmount={cash}
                />
              </MDBox>
            </Collapse>
          </MDBox>
        </MDBox>

        {/* ── Check section ─────────────────────────────────────────────── */}
        <CheckSection
          checkCount={checkCount}
          onCheckCountChange={setCheckCount}
          value={actualCheck}
          onChange={(v) => { setActualCheck(v); clearErrors(); }}
        />

        {/* ── GCASH section ─────────────────────────────────────────────── */}
        <DigitalVerifySection
          icon="📱"
          label="GCASH"
          systemAmount={intake?.total_gcash ?? 0}
          value={actualGcash}
          onChange={(v) => { setActualGcash(v); clearErrors(); }}
          confirmed={gcashConfirmed}
          onConfirmChange={(v) => { setGcashConfirmed(v); clearErrors(); }}
          confirmError={fieldErr.gcashConfirmed}
        />

        {/* ── Bank section ──────────────────────────────────────────────── */}
        <DigitalVerifySection
          icon="🏦"
          label="Bank Deposit"
          systemAmount={intake?.total_bank ?? 0}
          value={actualBank}
          onChange={(v) => { setActualBank(v); clearErrors(); }}
          confirmed={bankConfirmed}
          onConfirmChange={(v) => { setBankConfirmed(v); clearErrors(); }}
          confirmError={fieldErr.bankConfirmed}
        />

        {/* ── Grand total + variance ────────────────────────────────────── */}
        <MDBox p={2} sx={{ background: "#f5f5f5", borderRadius: 1 }}>
          <MDBox display="flex" justifyContent="space-between" mb={0.5}>
            <MDTypography variant="body2" color="secondary">Actual grand total</MDTypography>
            <MDTypography variant="body2" fontWeight="medium">{peso(grandTotal)}</MDTypography>
          </MDBox>
          <MDBox display="flex" justifyContent="space-between" mb={0.5}>
            <MDTypography variant="body2" color="secondary">Expected</MDTypography>
            <MDTypography variant="body2" fontWeight="medium">{peso(expected)}</MDTypography>
          </MDBox>
          {variance !== null && (
            <MDBox display="flex" justifyContent="space-between">
              <MDTypography variant="body2" color="secondary">Variance</MDTypography>
              <MDTypography variant="body2" fontWeight="bold" color={varianceColor}>
                {variance > 0 ? "+" : ""}{peso(variance)}
                {variance === 0 ? " ✓" : variance < 0 ? " (short)" : " (over)"}
              </MDTypography>
            </MDBox>
          )}
        </MDBox>

        {variance !== null && variance !== 0 && (
          <TextField
            label="Variance Reason *"
            multiline
            rows={3}
            value={varianceReason}
            onChange={(e) => { setVarianceReason(e.target.value); clearErrors(); }}
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
            your cash count <strong>{peso(cash)}</strong>.
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
