// src/layouts/octal-console/detail.js — Unit 26 / F1.3
// Placeholder for subscription detail view. Full detail deferred to Phase 5.
import { useParams, useNavigate } from "react-router-dom";
import { Alert, Button } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

export default function OctalConsoleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDTypography variant="h4" mb={2}>
          Subscription #{id}
        </MDTypography>
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={() => navigate("/octal-console")}>
              Back
            </Button>
          }
        >
          Subscription detail — Change Plan and Suspend actions coming in Phase 5.
        </Alert>
      </MDBox>
    </DashboardLayout>
  );
}
