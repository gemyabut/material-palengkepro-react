// src/layouts/profile/components/SaveButton/index.js

import React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import SaveIcon from "@mui/icons-material/Save";
import PropTypes from "prop-types";

const SaveButton = ({ onClick, loading }) => {
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={!loading && <SaveIcon />}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? <CircularProgress size={24} color="inherit" /> : "Save Profile"}
    </Button>
  );
};

SaveButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default SaveButton;
