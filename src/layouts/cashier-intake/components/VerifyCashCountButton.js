import { useState } from "react";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import MDBox from "components/MDBox";
import { verifyCashCount } from "api/cashierIntakeReview";
import { denominationSumMatchesTotalCash } from "./DenominationEntryPanel";

export default function VerifyCashCountButton({ intake, onVerified }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await verifyCashCount(intake.id);
      onVerified(updated);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not verify cash count.");
    } finally {
      setSubmitting(false);
    }
  };

  if (intake.cashier_verified) {
    return (
      <Alert severity="success" sx={{ mt: 2 }} icon={false}>
        Cash count verified ✓
      </Alert>
    );
  }

  const disabled = submitting || !denominationSumMatchesTotalCash(intake);

  return (
    <MDBox mt={2}>
      <Button variant="contained" color="primary" disabled={disabled} onClick={handleVerify}>
        {submitting ? "Verifying…" : "Verify Cash Count"}
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }} icon={false}>
          {error}
        </Alert>
      )}
    </MDBox>
  );
}
