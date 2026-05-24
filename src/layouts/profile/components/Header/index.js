// src/layouts/profile/components/Header/index.js

import React from "react";
import PropTypes from "prop-types";
import MDTypography from "components/MDTypography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

function Header({ profile }) {
  return (
    <Card>
      <CardContent>
        <MDTypography variant="h5">{profile?.full_name || "Unnamed User"}</MDTypography>
        <MDTypography variant="subtitle1" sx={{ color: "text.secondary" }}>
          {profile?.role || "Unknown Role"}
        </MDTypography>
      </CardContent>
    </Card>
  );
}

Header.propTypes = {
  profile: PropTypes.shape({
    full_name: PropTypes.string,
    role: PropTypes.string,
  }).isRequired,
};

export default Header;
