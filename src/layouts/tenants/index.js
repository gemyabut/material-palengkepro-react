// src/layouts/tenants/index.js
// src/layouts/tenants/index.js

import React, { useEffect, useState } from "react";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAuth } from "context/AuthContext";
import { Card, Snackbar, Alert, Pagination, Stack } from "@mui/material";

// Role-based views
import MasterTenantList from "./pages/MasterTenantList";
import OfficerTenantList from "./pages/OfficerTenantList";
import CollectorTenantList from "./pages/CollectorTenantList";
import CashierTenantList from "./pages/CashierTenantList";
import TenantSelfPortal from "./pages/TenantSelfPortal";

export default function Tenants() {
  const { userProfile: user } = useAuth();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [page, setPage] = useState(1);

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const renderTenantComponent = () => {
    if (!user || !user.role) return null;
    const role = user.role.toLowerCase();

    switch (role) {
      case "market_administrator":
      case "admin":
      case "admin_staff":
      case "market_manager":
      case "finance_head":
      case "executive":
      case "accounts_receivable":
        return <MasterTenantList showSnackbar={showSnackbar} page={page} setPage={setPage} />;
      case "leasing_officer":
        return <OfficerTenantList showSnackbar={showSnackbar} page={page} setPage={setPage} />;
      case "collector":
        return <CollectorTenantList showSnackbar={showSnackbar} page={page} setPage={setPage} />;
      case "cashier":
        return <CashierTenantList showSnackbar={showSnackbar} page={page} setPage={setPage} />;
      case "tenant":
        return <TenantSelfPortal showSnackbar={showSnackbar} />;
      default:
        return <MDBox>No access to tenant module</MDBox>;
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Card>
          <MDBox p={2}>{renderTenantComponent()}</MDBox>
          {user?.role !== "tenant" && (
            <MDBox display="flex" justifyContent="center" py={2}>
              <Pagination
                count={10} // Placeholder value, override in child component
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </MDBox>
          )}
        </Card>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </MDBox>
    </DashboardLayout>
  );
}
