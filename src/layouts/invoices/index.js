import React, { useState, useMemo, useEffect } from "react";
import { useInvoices } from "./hooks/useInvoices";
import useProfile from "../profile/hooks/useProfile";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { Snackbar, Pagination } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import InvoiceTable from "./components/InvoiceTable";
import InvoiceFilters from "./components/InvoiceFilters";
import { canViewInvoices } from "utils/permissions";

const DEFAULT_LIMIT = 20;

function InvoicesPage() {
  const { userProfile, loading: profileLoading } = useProfile();
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  // All hooks above any early return
  const queryFilters = useMemo(() => {
    const f = {};
    if (filters.tenant_name) f.tenant_name = filters.tenant_name;
    if (filters.status) f.status = filters.status;
    if (filters.period_start) f.period_start = filters.period_start;
    if (filters.period_end) f.period_end = filters.period_end;
    if (userProfile?.market?.id) f.market = userProfile.market.id;
    return f;
  }, [filters, userProfile]);

  const { invoices, total, loading, error, refresh } = useInvoices({
    filters: queryFilters,
    page,
    limit: DEFAULT_LIMIT,
  });

  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: "Failed to load invoices. Please try again." });
    }
  }, [error]);

  if (profileLoading || !userProfile || !userProfile.role) {
    return (
      <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </MDBox>
    );
  }

  if (!canViewInvoices(userProfile.role)) {
    return (
      <MDBox p={4}>
        <MDTypography variant="h6" color="error">
          You do not have permission to view invoices.
        </MDTypography>
      </MDBox>
    );
  }

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = (_, value) => setPage(value);

  const marketName = userProfile?.market?.name || "";

  return (
    <DashboardLayout>
      <DashboardNavbar userProfile={userProfile} />
      <MDBox sx={{ p: 2 }}>
        <MDTypography variant="h4" mb={2}>
          Invoices{marketName ? ` — ${marketName}` : ""}
        </MDTypography>

        <MDBox mb={2}>
          <InvoiceFilters filters={filters} onChange={handleFiltersChange} />
        </MDBox>

        <InvoiceTable invoices={invoices} loading={loading} />

        <MDBox mt={2} display="flex" justifyContent="center">
          <Pagination
            count={Math.ceil(total / DEFAULT_LIMIT) || 1}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </MDBox>
      </MDBox>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </DashboardLayout>
  );
}

export default InvoicesPage;
