// /src/layouts/leases/index.js
//src/layouts/leases/index.js
// src/layouts/leases/index.js

import React, { useState, useMemo, useEffect } from "react";
import { useLeases } from "./hooks/useLeases";
import useProfile from "../profile/hooks/useProfile";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { Button, Snackbar, Stack, TextField, Select, MenuItem, Pagination } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import LeasesTable from "./components/common/LeasesTable";
import AdminAddLease from "./components/admin/AdminAddLease";
import AdminEditLease from "./components/admin/AdminEditLease";
import AdminLeaseDetail from "./components/admin/AdminLeaseDetail";
import LeaseSummaryWidget from "./components/common/LeaseSummaryWidget";
import { debugLog } from "../stalls/utils/debug";
import { isAdmin, isCollector, isTenant } from "./utils/roleUtils";
import { LEASE_TYPE_CHOICES, LEASE_STATUS_CHOICES } from "./data/choices";

const DEFAULT_LIMIT = 20;

// leases/models.py Lease.Status only has ACTIVE/PENDING/EXPIRED/TERMINATED —
// LEASE_STATUS_CHOICES also carries "renewal"/"draft" for other UI purposes
// (Add/Edit lease forms) that don't map to any backend enum value.
// Filtering to a real status here means the filter dropdown 400s.
const FILTERABLE_LEASE_STATUSES = ["active", "pending", "terminated", "expired"];

// Helper
function getLabel(choices, value) {
  if (!value) return "";
  const found = choices.find(
    (opt) => String(opt.value).toLowerCase() === String(value).toLowerCase()
  );
  return found ? found.label : value;
}

function LeasesPage() {
  // useProfile now comes from AuthContext; never fetches here!
  const { userProfile, loading: profileLoading } = useProfile();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // All hooks and memo above any return!
  const userRole = userProfile?.role;

  const {
    leases,
    summary,
    total,
    loading,
    error,
    currentPage,
    setCurrentPage,
    // BUG-68 — search/status/role-based scoping are now driven through this
    // (see useLeases.js) instead of a recomputed `filter` object passed back
    // in as a prop, which usePaginatedResource silently ignored after mount.
    updateFilters,
    filter,
    nextPage,
    prevPage,
    refresh,
    createLease,
    editLease,
    deactivateLease,
    exportXLS,
  } = useLeases({
    page: 1,
    limit: DEFAULT_LIMIT,
  });

  // Role-based scoping (tenant/collector) — same reactivity fix as
  // search/status. Runs once userProfile is available; harmless no-op for
  // roles where neither branch applies.
  useEffect(() => {
    if (isTenant(userRole) && userProfile?.tenant?.id) {
      updateFilters({ tenant: userProfile.tenant.id });
    } else if (isCollector(userRole) && userProfile?.id) {
      updateFilters({ collector: userProfile.id });
    }
    // Depend on the primitive ids, not the userProfile object reference —
    // avoids re-firing (and resetting the user's page back to 1) on every
    // render where the profile context hands back a new object identity
    // for the same underlying values.
  }, [userRole, userProfile?.tenant?.id, userProfile?.id, updateFilters]);

  // Lease summary widget logic (must run before any early return to satisfy rules-of-hooks)
  const leaseSummaryData = useMemo(() => {
    return LEASE_STATUS_CHOICES.map(({ value, label }) => ({
      label,
      value: summary[value?.toLowerCase()] || 0,
    }));
  }, [summary]);

  // Show spinner until profile is ready (from context)
  if (profileLoading || !userProfile || !userProfile.role) {
    debugLog("[LeasesPage] Waiting for userProfile...");
    return (
      <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </MDBox>
    );
  }

  // Handlers
  const handleSearchChange = (e) => {
    updateFilters({ full_name: e.target.value });
    debugLog("[LeasesPage] Search changed:", e.target.value);
  };
  const handleStatusChange = (e) => {
    // LEASE_STATUS_CHOICES values are lowercase (shared with the Add/Edit/
    // Detail lease forms elsewhere), but the backend's Lease.Status enum
    // (leases/models.py) is uppercase — django_filters 400s on a case
    // mismatch. Map here rather than uppercasing the shared choices list,
    // which would ripple into those other forms.
    const value = e.target.value;
    updateFilters({ status: value ? value.toUpperCase() : value });
    debugLog("[LeasesPage] Status filter changed:", value);
  };
  const handleAdd = () => setAddOpen(true);
  const handleEdit = (lease) => {
    setSelectedLease(lease);
    setEditOpen(true);
    debugLog("[LeasesPage] Edit lease", lease);
  };
  const handleView = (lease) => {
    setSelectedLease(lease);
    setDetailOpen(true);
    debugLog("[LeasesPage] View lease", lease);
  };
  const handleDeactivate = async (lease) => {
    await deactivateLease(lease.id);
    setSnackbar({ open: true, message: "Lease deactivated!", severity: "success" });
    debugLog("[LeasesPage] Lease deactivated", lease);
  };
  const handleCloseDialogs = () => {
    setAddOpen(false);
    setEditOpen(false);
    setDetailOpen(false);
    setSelectedLease(null);
  };
  const handleSuccess = (msg = "Success!") => {
    setSnackbar({ open: true, message: msg, severity: "success" });
    handleCloseDialogs();
    refresh();
  };
  const handlePageChange = (_, value) => {
    setCurrentPage(value);
    debugLog("[LeasesPage] Page changed:", value);
  };

  const tableActions = {
    onEdit: handleEdit,
    onView: handleView,
    onDeactivate: handleDeactivate,
  };

  // Map leases to include label fields
  const leasesWithLabels = leases.map((lease) => ({
    ...lease,
    statusLabel: getLabel(LEASE_STATUS_CHOICES, lease.status),
    leaseTypeLabel: getLabel(LEASE_TYPE_CHOICES, lease.lease_type),
  }));

  // Role-based list rendering
  function renderLeaseList() {
    const canEdit = isAdmin(userRole);
    const canDeactivate = isAdmin(userRole);

    if (canEdit) {
      return (
        <LeasesTable
          leases={leasesWithLabels}
          loading={loading}
          error={error}
          total={total}
          page={currentPage}
          limit={DEFAULT_LIMIT}
          onEdit={tableActions.onEdit}
          onView={tableActions.onView}
          onDeactivate={tableActions.onDeactivate}
          userProfile={userProfile}
          canEdit={canEdit}
          canDeactivate={canDeactivate}
        />
      );
    }
    if (isTenant(userRole)) {
      return (
        <LeasesTable
          leases={leasesWithLabels}
          loading={loading}
          onView={tableActions.onView}
          userProfile={userProfile}
        />
      );
    }
    if (isCollector(userRole)) {
      return (
        <LeasesTable
          leases={leasesWithLabels}
          loading={loading}
          onView={tableActions.onView}
          userProfile={userProfile}
        />
      );
    }
    return <MDBox>Access denied or not supported for this role.</MDBox>;
  }

  return (
    <DashboardLayout>
      <DashboardNavbar userProfile={userProfile} />
      <MDBox sx={{ p: 2 }}>
        <MDTypography variant="h4" mb={2}>
          Leases
        </MDTypography>

        {/* Lease Summary Widget */}
        <MDBox mb={2}>
          <LeaseSummaryWidget summaryData={leaseSummaryData} />
        </MDBox>

        {/* Filters/Search/Add/Export */}
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <TextField
            label="Search Tenant/Lease"
            value={filter.full_name || ""}
            onChange={handleSearchChange}
            size="small"
          />
          <Select
            value={(filter.status || "").toLowerCase()}
            onChange={handleStatusChange}
            displayEmpty
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All Status</MenuItem>
            {LEASE_STATUS_CHOICES.filter((opt) =>
              FILTERABLE_LEASE_STATUSES.includes(opt.value)
            ).map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
          {isAdmin(userRole) && (
            <Button variant="contained" color="primary" onClick={handleAdd}>
              Add Lease
            </Button>
          )}
          <Button onClick={exportXLS}>Export XLS</Button>
          <Button onClick={refresh}>Refresh</Button>
        </Stack>

        {renderLeaseList()}

        {/* Pagination */}
        <MDBox mt={2} display="flex" justifyContent="center">
          <Pagination
            count={Math.ceil(total / DEFAULT_LIMIT)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </MDBox>
      </MDBox>

      {/* Dialogs */}
      <AdminAddLease
        open={addOpen}
        onClose={handleCloseDialogs}
        onSuccess={() => handleSuccess("Lease added!")}
      />
      {selectedLease && (
        <>
          <AdminEditLease
            open={editOpen}
            lease={selectedLease}
            onClose={handleCloseDialogs}
            onSuccess={() => handleSuccess("Lease updated!")}
          />
          <AdminLeaseDetail open={detailOpen} lease={selectedLease} onClose={handleCloseDialogs} />
        </>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </DashboardLayout>
  );
}

export default LeasesPage;
