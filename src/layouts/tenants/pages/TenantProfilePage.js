import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, CircularProgress, Stack, Tabs, Tab, Typography, Divider } from "@mui/material";
import { useAuth } from "context/AuthContext";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { getTenantById } from "../api/tenants";
import TenantDetail from "../components/TenantDetail";
import LeasesTab from "../components/tabs/LeasesTab";
import PaymentsTab from "../components/tabs/PaymentsTab";
import StallsTab from "../components/tabs/StallsTab";
import SOATab from "../components/tabs/SOATab";
import { debugLog } from "../../stalls/utils/debug";

export default function TenantProfilePage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    setLoading(true);
    getTenantById(tenantId)
      .then((data) => {
        setTenant(data);
        debugLog("TenantProfilePage loaded:", data);
      })
      .catch((err) => {
        debugLog("Error loading tenant:", err);
        navigate("/tenants"); // fallback if not found
      })
      .finally(() => setLoading(false));
  }, [tenantId, navigate]);

  const handleTabChange = (_, newValue) => setTab(newValue);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={2} px={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h5">
            Tenant Profile: {tenant?.full_name || "Loading..."}
          </MDTypography>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <Box textAlign="center" py={6}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TenantDetail tenant={tenant} user={{ role: "admin" }} showEdit={false} />

            <Tabs
              value={tab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="Leases" />
              <Tab label="Payments" />
              <Tab label="Stalls" />
              <Tab label="Statement of Account" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {tab === 0 && <LeasesTab tenantId={tenant.id} />}
              {tab === 1 && <PaymentsTab tenantId={tenant.id} />}
              {tab === 2 && <StallsTab tenantId={tenant.id} />}
              {tab === 3 && <SOATab tenantId={tenant.id} />}
            </Box>
          </>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
