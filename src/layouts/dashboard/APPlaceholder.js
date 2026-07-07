import React from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Icon from "@mui/material/Icon";
import Alert from "@mui/material/Alert";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

export default function APPlaceholder({ data }) {
  const upsell = data?.upsell || {};
  const features = upsell.features || [];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={4} mb={3}>
        <Alert severity="info" sx={{ mb: 3 }}>
          {data?.message || "A/P features are coming in Tier 2."}
        </Alert>
        <Card>
          <CardContent>
            <MDTypography variant="h5" gutterBottom>
              {upsell.title || "Accounts Payable — Tier 2"}
            </MDTypography>
            <MDTypography variant="body2" color="text.secondary" mb={2}>
              Tier 1 covers your core market operations. The full A/P module ships in Tier 2.
              Contact Octal Philippines to upgrade your plan.
            </MDTypography>
            {features.length > 0 && (
              <>
                <MDTypography variant="subtitle2" fontWeight="bold" mb={1}>
                  Coming in Tier 2:
                </MDTypography>
                <List dense>
                  {features.map((f) => (
                    <ListItem key={f} disableGutters>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <Icon fontSize="small" color="info">check_circle_outline</Icon>
                      </ListItemIcon>
                      <ListItemText primary={f} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </CardContent>
        </Card>
      </MDBox>
    </DashboardLayout>
  );
}

APPlaceholder.propTypes = {
  data: PropTypes.shape({
    message: PropTypes.string,
    upsell: PropTypes.shape({
      title: PropTypes.string,
      features: PropTypes.arrayOf(PropTypes.string),
    }),
  }),
};
APPlaceholder.defaultProps = { data: null };
