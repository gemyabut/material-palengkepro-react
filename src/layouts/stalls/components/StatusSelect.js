import React from "react";
import PropTypes from "prop-types";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "RESERVED", label: "Reserved" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "UNDER_MAINTENANCE", label: "Under Maintenance" },
];

export default function StatusSelect({ value, onChange, ...rest }) {
  return (
    <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }} {...rest}>
      <InputLabel>Status</InputLabel>
      <Select label="Status" value={value} onChange={onChange}>
        {statusOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

StatusSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
