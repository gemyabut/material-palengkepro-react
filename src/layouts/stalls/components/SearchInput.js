import React from "react";
import TextField from "@mui/material/TextField";
import PropTypes from "prop-types";

export default function SearchInput({ value, onChange, placeholder = "Search...", ...rest }) {
  return (
    <TextField
      variant="outlined"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      size="small"
      {...rest}
    />
  );
}

SearchInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};
