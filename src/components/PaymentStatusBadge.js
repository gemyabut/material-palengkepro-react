import Chip from "@mui/material/Chip";

// Unit 21.5 F1b: 6-state Payment.status color map. VOID gets an explicit dark-grey
// sx override so it reads as distinct from DRAFT's default grey.
const STATUS_CONFIG = {
  DRAFT:         { label: "Draft",         color: "default" },
  UNDER_REVIEW:  { label: "Under Review",  color: "info" },
  FLAGGED:       { label: "Flagged",       color: "error" },
  APPROVED:      { label: "Approved",      color: "warning" },
  POSTED:        { label: "Posted",        color: "success" },
  VOID:          { label: "Voided",        color: "default", sx: { bgcolor: "grey.700", color: "common.white" } },
};

export default function PaymentStatusBadge({ status, size = "small" }) {
  const cfg = STATUS_CONFIG[status] || { label: status || "—", color: "default" };
  return <Chip label={cfg.label} color={cfg.color} size={size} sx={cfg.sx} />;
}
