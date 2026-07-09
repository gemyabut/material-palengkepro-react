import React from "react";
import Chip from "@mui/material/Chip";

const STATUS_CONFIG = {
  OPEN:   { label: "Open",   color: "default" },
  POSTED: { label: "Posted", color: "success" },
  LOCKED: { label: "Locked", color: "info" },
};

export default function CashierIntakeStatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status || "—", color: "default" };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
}
