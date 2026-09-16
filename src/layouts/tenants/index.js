// src/layouts/tenants/index.js
// src/layouts/tenants/index.js

import React, { useEffect, useState } from "react";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAuth } from "context/AuthContext";
import { Card, Snackbar, Alert } from "@mui/material";

// Role-based views
import MasterTenantList from "./pages/MasterTenantList";
import OfficerTenantList from "./pages/OfficerTenantList";
import CollectorTenantList from "./pages/CollectorTenantList";
import CashierTenantList from "./pages/CashierTenantList";
import TenantSelfPortal from "./pages/TenantSelfPortal";
import TenantSummaryBand from "./components/TenantSummaryBand";

export default function Tenants() {
  const { userProfile: user } = useAuth();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

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
        return <MasterTenantList showSnackbar={showSnackbar} />;
      case "leasing_officer":
        return <OfficerTenantList showSnackbar={showSnackbar} />;
      case "collector":
        return <CollectorTenantList showSnackbar={showSnackbar} />;
      case "cashier":
        return <CashierTenantList showSnackbar={showSnackbar} />;
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
        {user?.role && user.role.toLowerCase() !== "tenant" && <TenantSummaryBand />}
        <Card>
          {/* Pagination lives inside each child component now (e.g.
              MasterTenantList) — this wrapper used to render its own
              second, non-functional placeholder Pagination on top of it
              (count hardcoded to 10, page/setPage unread by every child).
              Removed as a duplicate-widget fix, not part of the pagination
              consolidation itself. */}
          <MDBox p={2}>{renderTenantComponent()}</MDBox>
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
