// src/layouts/about/index.js — Unit 26 / F1.2
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const APP_VERSION   = "1.0.0-tier1";
const BUILD_DATE    = "2026-07-04";
const BACKEND_STACK = "Django 4.2 + DRF + SQLite";
const FRONTEND_STACK = "React 18 + Material Dashboard 2";

export default function About() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container justifyContent="center">
          <Grid item xs={12} md={5}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" fontWeight="bold" mb={0.5}>
                  PalengkeProPH
                </MDTypography>
                <MDTypography variant="body2" color="text" mb={2}>
                  Market management SaaS for Philippine wet/dry markets.
                </MDTypography>
                <Divider />
                <MDBox mt={2}>
                  {[
                    ["Version",    APP_VERSION],
                    ["Build Date", BUILD_DATE],
                    ["Backend",    BACKEND_STACK],
                    ["Frontend",   FRONTEND_STACK],
                    ["Pilot",      "El Camino Market — Tier 1"],
                  ].map(([label, value]) => (
                    <MDBox key={label} display="flex" justifyContent="space-between" mb={1}>
                      <MDTypography variant="caption" color="text" fontWeight="medium">
                        {label}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        {value}
                      </MDTypography>
                    </MDBox>
                  ))}
                </MDBox>
                <Divider />
                <MDTypography variant="caption" color="text" mt={2} display="block">
                  © 2026 PalengkeProPH. All rights reserved.
                </MDTypography>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}
