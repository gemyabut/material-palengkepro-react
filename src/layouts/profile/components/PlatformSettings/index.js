import React from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import MDTypography from "components/MDTypography";

function PlatformSettings({ profile, setProfile }) {
  const role = profile?.role ?? "";

  const handleToggle = (key) => (event) => {
    setProfile((prev) => ({
      ...prev,
      [key]: event.target.checked,
    }));
  };

  const universalSettings = [
    { label: "Notify on login", key: "notify_on_login" },
    { label: "Receive email reminders", key: "email_reminders" },
  ];

  const tenantSettings = [
    { label: "Notify on due payments", key: "notify_due_payments" },
    { label: "Enable SMS alerts", key: "enable_sms_alerts" },
  ];

  const collectorSettings = [
    { label: "Notify on payment confirmation", key: "notify_payment_confirmation" },
  ];

  const adminSettings = [{ label: "Notify on new user signup", key: "notify_user_signup" }];

  const renderToggles = (settings) =>
    settings.map(({ label, key }) => (
      <Grid item xs={12} md={6} key={key}>
        <FormControlLabel
          control={
            <Switch checked={!!profile?.[key]} onChange={handleToggle(key)} color="primary" />
          }
          label={label}
        />
      </Grid>
    ));

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Platform Settings
        </MDTypography>

        <Grid container spacing={2}>
          {renderToggles(universalSettings)}
          {role === "tenant" && renderToggles(tenantSettings)}
          {role === "collector" && renderToggles(collectorSettings)}
          {["market_administrator", "admin_staff", "market_manager"].includes(role) &&
            renderToggles(adminSettings)}
        </Grid>
      </CardContent>
    </Card>
  );
}

PlatformSettings.propTypes = {
  profile: PropTypes.object.isRequired,
  setProfile: PropTypes.func.isRequired,
};

export default PlatformSettings;
