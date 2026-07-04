// src/layouts/support/index.js — Unit 26 / F1.2
import { useState } from "react";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

const SUPPORT_EMAIL = "support@palengkepro.ph";

export default function Support() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailto, "_blank");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container justifyContent="center">
          <Grid item xs={12} md={6}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" fontWeight="bold" mb={0.5}>
                  Contact Support
                </MDTypography>
                <MDTypography variant="body2" color="text" mb={0.5}>
                  Send a message to the PalengkeProPH support team.
                </MDTypography>
                <MDTypography variant="caption" color="text" mb={3} display="block">
                  {SUPPORT_EMAIL}
                </MDTypography>

                <TextField
                  fullWidth
                  label="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  sx={{ mb: 2 }}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  multiline
                  rows={5}
                  sx={{ mb: 3 }}
                />
                <MDButton
                  variant="gradient"
                  color="info"
                  onClick={handleSend}
                  disabled={!subject.trim() || !message.trim()}
                >
                  Open Email Client
                </MDButton>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}
