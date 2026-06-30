import React from "react";
import {
  Alert, FormControl, InputLabel, MenuItem, Select, Stack, TextField,
} from "@mui/material";

const CHANNELS = [
  { value: "CHECK",          label: "Check Release" },
  { value: "CASH_DEDUCTION", label: "Cash Deduction" },
  { value: "PETTY_CASH",     label: "Petty Cash" },
  { value: "BANK_INITIATED", label: "Bank-Initiated" },
  { value: "ANY",            label: "Any" },
];

// D4: auto-uppercase + replace spaces with underscores
function normalizeCode(v) {
  return (v || "").toUpperCase().replace(/\s+/g, "_");
}

export default function ExpenseCategoryForm({ values, onChange, isSystem = false, error = null, disabled = false }) {
  const set = (field) => (e) => {
    const val = field === "code" ? normalizeCode(e.target.value) : e.target.value;
    onChange({ ...values, [field]: val });
  };

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        size="small"
        label="Code"
        value={values.code || ""}
        onChange={set("code")}
        disabled={disabled || isSystem}
        helperText={isSystem ? "System code — locked" : "Uppercase + underscores (auto-formatted)"}
        required
        inputProps={{ style: { fontFamily: "monospace" } }}
      />

      <TextField
        size="small"
        label="Display Name"
        value={values.display_name || ""}
        onChange={set("display_name")}
        disabled={disabled}
        required
      />

      <TextField
        size="small"
        label="Description"
        value={values.description || ""}
        onChange={set("description")}
        disabled={disabled}
        multiline
        minRows={2}
      />

      <FormControl size="small" disabled={disabled}>
        <InputLabel>Typical Channel</InputLabel>
        <Select value={values.typical_channel || "ANY"} label="Typical Channel" onChange={set("typical_channel")}>
          {CHANNELS.map((c) => (
            <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
