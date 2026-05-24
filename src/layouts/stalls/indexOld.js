// src/layouts/stalls/index.js

import React, { useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import {
  Button,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  Stack,
  Pagination,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { Download, FilterList } from "@mui/icons-material";

import StallsSummaryWidget from "./components/StallsSummaryWidget";
import StallsTable from "./components/StallsTable";
import AddStallForm from "./components/AddStallForm";
import EditStallForm from "./components/EditStallForm";

import useProfile from "layouts/profile/hooks/useProfile";
import useStalls from "./hooks/useStalls";

const statusOptions = ["AVAILABLE", "OCCUPIED", "RESERVED", "UNDER_MAINTENANCE", "INACTIVE"];

const typeOptions = [
  "WET",
  "DRY",
  "FOOD",
  "TIANGGE",
  "AMBULANT",
  "SUNDAY",
  "NIGHT",
  "RESTROOM",
  "PARKING",
  "TERMINAL",
  "OTHERS",
];

export default function StallsPage() {
  // Hooks
  const { profile, loading: profileLoading, error: profileError } = useProfile();
  const {
    stalls,
    loading: stallsLoading,
    error: stallsError,
    summary,
    total,
    page,
    pageSize,
    hasNextPage,
    hasPrevPage,
    filters,
    refresh,
    goToPage,
    changePageSize,
    updateFilters,
    createStall,
    updateStall,
    deactivateStall,
    exportCSV,
    exportXLSX,
  } = useStalls();

  // Role logic
  const user = profile;
  const canEdit = user && ["admin", "leasing_officer"].includes(user.role);

  // UI State
  const [openAdd, setOpenAdd] = useState(false);
  const [editStall, setEditStall] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Filter/search UI state
  const [search, setSearch] = useState(filters?.search || "");
  const [filterStatus, setFilterStatus] = useState(filters?.status || "");
  const [filterType, setFilterType] = useState(filters?.stall_type || "");
  const [filterSection, setFilterSection] = useState(filters?.section || "");

  // Section options from current data
  const sectionOptions = Array.from(new Set(stalls.map((s) => s.section).filter(Boolean)));

  // Filter/Search handlers
  const handleFilterChange = (field, value) => {
    // Update local UI state
    switch (field) {
      case "search":
        setSearch(value);
        break;
      case "status":
        setFilterStatus(value);
        break;
      case "type":
        setFilterType(value);
        break;
      case "section":
        setFilterSection(value);
        break;
      default:
        break;
    }
    // Update hook/server-side filter
    updateFilters({
      ...filters,
      search: field === "search" ? value : search,
      status: field === "status" ? value : filterStatus,
      stall_type: field === "type" ? value : filterType,
      section: field === "section" ? value : filterSection,
    });
    goToPage(1); // Reset to first page on filter/search change
  };

  // Pagination handler
  const handlePageChange = (event, value) => {
    goToPage(value);
    window.scrollTo(0, 0); // Scroll up on new page
  };
  const handlePageSizeChange = (e) => {
    changePageSize(Number(e.target.value));
    goToPage(1);
  };

  // Export handlers
  const handleExportCSV = async () => {
    try {
      const res = await exportCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "stalls.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setSnackbar({ open: true, message: "CSV exported!", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "CSV export failed.", severity: "error" });
    }
  };
  const handleExportXLSX = async () => {
    try {
      const res = await exportXLSX();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "stalls.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setSnackbar({ open: true, message: "Excel exported!", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Excel export failed.", severity: "error" });
    }
  };

  // Handlers for dialogs and success/error
  const handleAddClick = () => setOpenAdd(true);
  const handleEditClick = (stall) => setEditStall(stall);
  const handleDeactivate = async (stall) => {
    try {
      await deactivateStall(stall.id);
      setSnackbar({ open: true, message: "Stall deactivated.", severity: "success" });
      refresh();
    } catch (e) {
      setSnackbar({ open: true, message: "Failed to deactivate.", severity: "error" });
    }
  };
  const handleCloseDialog = () => {
    setOpenAdd(false);
    setEditStall(null);
  };
  const handleSuccess = (msg) => {
    setSnackbar({ open: true, message: msg, severity: "success" });
    refresh();
  };
  const handleError = (msg) => setSnackbar({ open: true, message: msg, severity: "error" });

  // Unified loading/error early return
  if (profileLoading || stallsLoading)
    return (
      <MDBox p={3} display="flex" alignItems="center" justifyContent="center">
        <CircularProgress />
        <MDTypography ml={2}>Loading...</MDTypography>
      </MDBox>
    );
  if (profileError)
    return (
      <MDBox p={3}>
        <MDTypography color="error">{profileError}</MDTypography>
      </MDBox>
    );
  if (stallsError)
    return (
      <MDBox p={3}>
        <MDTypography color="error">{stallsError}</MDTypography>
      </MDBox>
    );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={3} mb={2}>
        <MDTypography variant="h4" fontWeight="bold">
          Stalls Management
        </MDTypography>
      </MDBox>

      {/* Summary widget */}
      <MDBox mb={2}>
        <StallsSummaryWidget summary={summary} loading={stallsLoading} />
      </MDBox>

      {/* Toolbar (filters, actions) */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" mb={2}>
        {/* Export buttons */}
        <IconButton color="primary" onClick={handleExportCSV} title="Export as CSV">
          <Download />
        </IconButton>
        <IconButton color="primary" onClick={handleExportXLSX} title="Export as Excel">
          <Download />
        </IconButton>
      </Stack>

      {/* Main table */}
      <StallsTable
        stalls={stalls}
        loading={stallsLoading}
        onEdit={canEdit ? handleEditClick : undefined}
        onDeactivate={canEdit ? handleDeactivate : undefined}
        userRole={user?.role}
      />

      {/* Pagination controls */}
      <MDBox mt={2} display="flex" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={2} alignItems="center">
          <MDTypography variant="button">Rows per page:</MDTypography>
          <TextField
            select
            size="small"
            value={pageSize}
            onChange={handlePageSizeChange}
            sx={{ width: 80 }}
          >
            {[10, 20, 50, 100].map((sz) => (
              <MenuItem key={sz} value={sz}>
                {sz}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Pagination
          count={Math.ceil(total / pageSize)}
          page={page}
          onChange={handlePageChange}
          color="primary"
          shape="rounded"
          siblingCount={1}
          boundaryCount={1}
        />
      </MDBox>

      {/* Add dialog */}
      <AddStallForm
        open={openAdd}
        onClose={handleCloseDialog}
        onSuccess={() => {
          handleSuccess("Stall added!");
          setOpenAdd(false);
        }}
        onError={handleError}
      />

      {/* Edit dialog */}
      <EditStallForm
        open={!!editStall}
        stall={editStall}
        onClose={handleCloseDialog}
        onSuccess={() => {
          handleSuccess("Stall updated!");
          setEditStall(null);
        }}
        onError={handleError}
      />

      {/* Snackbar with Alert for colored feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
