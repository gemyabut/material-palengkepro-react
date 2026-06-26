import Chip from "@mui/material/Chip";

const STATUS_COLOR = {
  OPEN:      "info",
  POSTED:    "warning",
  CONFIRMED: "success",
  VOID:      "default",
};

export default function BatchStatusChip({ status, size = "small" }) {
  return (
    <Chip
      label={status || "—"}
      color={STATUS_COLOR[status] || "default"}
      size={size}
    />
  );
}
