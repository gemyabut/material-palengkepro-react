import React from "react";
import PropTypes from "prop-types";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

const typeOptions = [
  { value: "", label: "All Types" },
  { value: "DRY", label: "Dry" },
  { value: "WET", label: "Wet" },
  { value: "FOOD", label: "Food" },
  { value: "NON-FOOD", label: "Non-Food" },
  // Add more types as needed
];

export default function TypeSelect({ value, onChange, ...rest }) {
  return (
    <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }} {...rest}>
      <InputLabel>Type</InputLabel>
      <Select label="Type" value={value} onChange={onChange}>
        {typeOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

TypeSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
