import React from "react";
import PropTypes from "prop-types";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

// Update this list to match your market's actual sections
const sectionOptions = [
  { value: "", label: "All Sections" },
  { value: "A", label: "Section A" },
  { value: "B", label: "Section B" },
  { value: "C", label: "Section C" },
  { value: "D", label: "Section D" },
  // ...add more as needed
];

export default function SectionSelect({ value, onChange, ...rest }) {
  return (
    <FormControl size="small" variant="outlined" sx={{ minWidth: 140 }} {...rest}>
      <InputLabel>Section</InputLabel>
      <Select label="Section" value={value} onChange={onChange}>
        {sectionOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

SectionSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
