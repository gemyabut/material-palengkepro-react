import React from "react";
import { Stack, TextField, Select, MenuItem } from "@mui/material";

const STATUSES = ["OPEN", "PARTIAL", "PAID", "VOID"];

const CHARGE_TYPES = [
  { value: "", label: "All types" },
  { value: "RENT_RIGHTS", label: "Rent + Rights" },
  { value: "ELECTRICITY", label: "Electricity" },
  { value: "WATER", label: "Water" },
  { value: "OTHER", label: "Others" },
];

function InvoiceFilters({ filters, onChange }) {
  const handleChange = (field) => (e) => {
    onChange({ ...filters, [field]: e.target.value });
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
      <TextField
        label="Tenant name"
        value={filters.tenant_name || ""}
        onChange={handleChange("tenant_name")}
        size="small"
        sx={{ minWidth: 180 }}
      />
      <Select
        value={filters.status || ""}
        onChange={handleChange("status")}
        displayEmpty
        size="small"
        sx={{ minWidth: 130 }}
      >
        <MenuItem value="">All Status</MenuItem>
        {STATUSES.map((s) => (
          <MenuItem key={s} value={s}>
            {s}
          </MenuItem>
        ))}
      </Select>
      <Select
        value={filters.charge_type || ""}
        onChange={handleChange("charge_type")}
        displayEmpty
        size="small"
        sx={{ minWidth: 150 }}
        aria-label="Type"
      >
        {CHARGE_TYPES.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
      <TextField
        label="Period from"
        type="date"
        value={filters.period_start || ""}
        onChange={handleChange("period_start")}
        size="small"
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 150 }}
      />
      <TextField
        label="Period to"
        type="date"
        value={filters.period_end || ""}
        onChange={handleChange("period_end")}
        size="small"
        InputLabelProps={{ shrink: true }}
        sx={{ minWidth: 150 }}
      />
    </Stack>
  );
}

export default InvoiceFilters;
