import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MDTypography from "components/MDTypography";

// Unit 21.5 F1b-3: dedicated, prominent card for the PHASE_D_BOTTLENECK alert
// (backend: finance/utils.py generate_cash_alerts). Rendered separately from
// the generic Alerts panel so "N intakes stuck in Phase D" stands out rather
// than blending into the catch-all warning list.
export default function BottleneckAlertCard({ alert }) {
  const navigate = useNavigate();

  if (!alert) return null;

  return (
    <Alert
      severity="warning"
      sx={{ mb: 3 }}
      action={
        <Button
          color="inherit"
          size="small"
          onClick={() => navigate(alert.target_url || "/eod-collection")}
        >
          View Intakes
        </Button>
      }
    >
      <MDTypography variant="subtitle2" fontWeight="medium">
        Phase D Bottleneck
      </MDTypography>
      <MDTypography variant="body2">{alert.message}</MDTypography>
    </Alert>
  );
}
