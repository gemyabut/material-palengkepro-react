import React from "react";
import { Stack, TextField, FormControlLabel, Checkbox, Alert } from "@mui/material";
import MDTypography from "components/MDTypography";

// D4: auto-uppercase + replace spaces with underscores
function normalizeCode(v) {
  return (v || "").toUpperCase().replace(/\s+/g, "_");
}

export default function ChargeTypeForm({ values, onChange, isSystem = false, error = null, disabled = false }) {
  const set = (field) => (e) => {
    const val = field === "code" ? normalizeCode(e.target.value) : e.target.value;
    onChange({ ...values, [field]: val });
  };
  const toggle = (field) => (e) => onChange({ ...values, [field]: e.target.checked });

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

      <TextField
        size="small"
        label="Priority Rank"
        type="number"
        value={values.priority_rank ?? 99}
        onChange={set("priority_rank")}
        disabled={disabled}
        helperText="1 = paid first; 99 = lowest priority"
        inputProps={{ min: 1, max: 99 }}
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={!!values.is_recurring}
            onChange={toggle("is_recurring")}
            disabled={disabled}
          />
        }
        label={
          <MDTypography variant="caption">
            Recurring (auto-generated on monthly invoice)
          </MDTypography>
        }
      />
    </Stack>
  );
}
