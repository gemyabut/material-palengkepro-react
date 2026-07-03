// src/layouts/preferences/index.js — Unit 26 / F1.2
import { useState } from "react";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

export default function Preferences() {
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Asia/Manila");
  const [saved, setSaved]       = useState(false);

  const handleSave = () => {
    // Tier 1: settings are UI-only; persist in localStorage for continuity.
    localStorage.setItem("pref_language", language);
    localStorage.setItem("pref_timezone", timezone);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container justifyContent="center">
          <Grid item xs={12} md={6}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" fontWeight="bold" mb={1}>
                  Preferences
                </MDTypography>
                <MDTypography variant="body2" color="text" mb={3}>
                  Display settings. These are stored locally on this device and do not affect other users.
                </MDTypography>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Language</InputLabel>
                  <Select value={language} label="Language" onChange={(e) => setLanguage(e.target.value)}>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="fil">Filipino</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Timezone</InputLabel>
                  <Select value={timezone} label="Timezone" onChange={(e) => setTimezone(e.target.value)}>
                    <MenuItem value="Asia/Manila">Asia/Manila (PHT, UTC+8)</MenuItem>
                    <MenuItem value="UTC">UTC</MenuItem>
                  </Select>
                </FormControl>

                <MDButton
                  variant="gradient"
                  color="info"
                  onClick={handleSave}
                  disabled={saved}
                >
                  {saved ? "Saved!" : "Save Preferences"}
                </MDButton>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}
