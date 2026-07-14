import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import MDBox from "components/MDBox";
import { approveAndAdvance } from "api/cashierIntakeReview";

export default function ApproveAllButton({ intake, payments }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const hasFlagged = (payments || []).some((p) => p.status === "FLAGGED");
  const disabled = submitting || hasFlagged || !intake.cashier_verified;

  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await approveAndAdvance(intake.id);
      navigate("/cash-accountability");
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.detail || "Could not approve intake.");
      setSubmitting(false);
    }
  };

  const tooltip = hasFlagged
    ? "Resolve all flagged payments before approving."
    : !intake.cashier_verified
    ? "Cashier must Verify Cash Count first."
    : "";

  return (
    <MDBox mt={2}>
      <Tooltip title={tooltip}>
        <span>
          <Button variant="contained" color="success" disabled={disabled} onClick={handleApprove}>
            {submitting ? "Approving…" : "Approve All + Advance Intake"}
          </Button>
        </span>
      </Tooltip>
      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }} icon={false}>
          {error}
        </Alert>
      )}
    </MDBox>
  );
}
