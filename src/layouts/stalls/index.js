import React, { useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import {
  Button,
  Snackbar,
  Alert,
  Pagination,
  TextField,
  MenuItem,
  Stack,
  Dialog,
} from "@mui/material";
import { canAddStall, canEditStall, canDeleteStall } from "utils/permissions";
import StallsTable from "./components/StallsTable";
import StallsSummaryWidget from "./components/StallsSummaryWidget";
import AddStallForm from "./components/AddStallForm";
import EditStallForm from "./components/EditStallForm";
import StallDetailCard from "./components/StallDetailCard";
import useStalls from "./hooks/useStalls";
import { debugLog } from "layouts/stalls/utils/debug";
import { STATUS_CHOICES, STALL_TYPE_CHOICES } from "layouts/stalls/data/choices";
import { useAuthProfile } from "context/AuthContext";

// --- Any needed filter option arrays (status/type/section) ---
const getLabel = (choices, value) => choices.find((opt) => opt.value === value)?.label || value;

export default function StallsPage() {
  // --- UI State ---
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [stallType, setStallType] = useState("");
  const [section, setSection] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedStall, setSelectedStall] = useState(null);
  const [viewedStall, setViewedStall] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // --- Pagination State ---

  const pageSizeOptions = [20, 50, 100];

  // --- Hooks / API ---
  const { userProfile } = useAuthProfile(); // ✅ Pull userProfile from context
  const role = userProfile?.role || ""; // ✅ Fallback to empty if not available
  debugLog("[StallsPage] Current role:", role); // ✅ See actual role in console

  const {
    stalls,
    summary,
    total,
    loading,
    error,
    goToPage,
    changePageSize,
    updateFilters,
    page,
    pageSize,
    filters,
    refresh,
    createStall,
    updateStall,
    deactivateStall,
    exportCSV,
    exportXLSX,
  } = useStalls();

  // --- Role Logic ---
  debugLog("[StallsPage] Current role:", role);

  const canAdd = canAddStall(role);
  const canEdit = canEditStall(role); // Leasing Officer is the Stall steward (doc 22 WF-02)
  const canDelete = canDeleteStall(role);

  debugLog("[StallsPage] Current role:", role);
  debugLog(
    "[StallsPage] Permissions - canAdd:",
    canAdd,
    "canEdit:",
    canEdit,
    "canDelete:",
    canDelete
  );

  // --- Handlers ---
  const handleAdd = () => {
    debugLog("[StallsPage] handleAdd called");
    setAddModalOpen(true);
  };

  const handleEdit = (stall) => {
    setSelectedStall(stall);
    setEditModalOpen(true);
  };

  const handleView = (stall) => {
    setViewedStall(stall);
    setViewModalOpen(true);
  };

  const handleDelete = async (stall) => {
    try {
      await deactivateStall(stall.id);
      setSnackbar({ open: true, message: "Stall deactivated!", severity: "info" });
      refresh();
    } catch (e) {
      setSnackbar({ open: true, message: "Failed to deactivate.", severity: "error" });
    }
  };

  const handleAddSave = async (data) => {
    debugLog("[StallsPage] handleAddSave called", data);
    try {
      await createStall(data);
      setSnackbar({ open: true, message: "Stall added!", severity: "success" });
      setAddModalOpen(false);
      goToPage(1);
      debugLog("[StallsPage] After add, should refresh table");
      refresh();
    } catch {
      setSnackbar({ open: true, message: "Error adding stall.", severity: "error" });
    }
  };
  const handleEditSave = async (data) => {
    debugLog("[StallsPage] handleEditSave called", data);
    try {
      await updateStall(selectedStall.id, data);
      setSnackbar({ open: true, message: "Stall updated!", severity: "success" });
      setEditModalOpen(false);
      setSelectedStall(null);
      goToPage(1);
      debugLog("[StallsPage] After edit, should refresh table");
      refresh();
    } catch {
      setSnackbar({ open: true, message: "Error updating stall.", severity: "error" });
    }
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setSelectedStall(null);
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedStall(null);
    refresh(); // <-- make sure you have this from useStalls
    debugLog("[StallsPage] handleEditSuccess called");
  };

  // --- Filter/Field Handlers ---
  // --- Filter/Field Handlers ---
  const handleSearchChange = (e) => {
    updateFilters({ search: e.target.value });
  };
  const handleStatusChange = (e) => {
    updateFilters({ status: e.target.value });
  };
  const handleTypeChange = (e) => {
    updateFilters({ stall_type: e.target.value });
  };
  const handleSectionChange = (e) => {
    updateFilters({ section: e.target.value });
  };

  // --- Pagination Handlers ---
  const handlePageChange = (event, value) => {
    goToPage(value);
  };
  const handlePageSizeChange = (e) => {
    changePageSize(Number(e.target.value));
  };

  // --- Export Handlers ---
  const handleExportCSV = async () => {
    try {
      await exportCSV();
      setSnackbar({ open: true, message: "CSV export started.", severity: "info" });
    } catch {
      setSnackbar({ open: true, message: "CSV export failed.", severity: "error" });
    }
  };
  const handleExportXLSX = async () => {
    try {
      await exportXLSX();
      setSnackbar({ open: true, message: "Excel export started.", severity: "info" });
    } catch {
      setSnackbar({ open: true, message: "Excel export failed.", severity: "error" });
    }
  };

  // --- Section Options (Dynamic) ---
  const sectionOptions = Array.from(new Set(stalls.map((s) => s.section).filter(Boolean)));

  // --- Debug Log ---
  debugLog("StallsPage stalls:", stalls, "Total:", total, "Page:", page);

  // --- Render ---
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox p={3}>
        <StallsSummaryWidget summary={summary} total={total} loading={loading} />
        {/* FILTER BAR & ACTION BUTTONS */}
        <Stack direction="row" spacing={2} mb={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="Search"
            value={filters.search || ""}
            onChange={(e) => updateFilters({ search: e.target.value })}
            size="small"
            sx={{ width: 200 }}
          />
          <TextField
            label="Status"
            select
            value={filters.status || ""}
            onChange={(e) => updateFilters({ status: e.target.value })}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            {STATUS_CHOICES.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Type"
            select
            value={filters.stall_type || ""}
            onChange={(e) => updateFilters({ stall_type: e.target.value })}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            {STALL_TYPE_CHOICES.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Section"
            select
            value={filters.section || ""}
            onChange={(e) => updateFilters({ section: e.target.value })}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            {sectionOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
          {canAdd && (
            <Button onClick={handleAdd} color="primary" variant="contained">
              Add Stall
            </Button>
          )}
          <Button onClick={handleExportCSV} color="primary" variant="contained">
            Export CSV
          </Button>
          <Button onClick={handleExportXLSX} color="primary" variant="contained">
            Export Excel
          </Button>
        </Stack>
        {/* PAGE SIZE SELECTOR */}
        <Stack direction="row" spacing={2} alignItems="center" mb={1} justifyContent="flex-end">
          <MDTypography variant="button">Rows per page:</MDTypography>
          <TextField
            select
            size="small"
            value={pageSize}
            onChange={(e) => changePageSize(Number(e.target.value))}
            sx={{ width: 80 }}
          >
            {pageSizeOptions.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        {/* MAIN TABLE */}
        <StallsTable
          stalls={stalls}
          loading={loading}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          page={page}
          pageSize={pageSize}
        />
        {/* PAGINATION */}
        <MDBox display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={Math.ceil(total / pageSize)}
            page={page}
            onChange={(_, value) => goToPage(value)}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </MDBox>
        {/* MODALS */}
        <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="sm" fullWidth>
          <AddStallForm
            open={addModalOpen} // <-- pass if AddStallForm requires!
            onSave={handleAddSave}
            onClose={() => setAddModalOpen(false)} // <-- pass if AddStallForm requires!
            onSuccess={() => setAddModalOpen(false)} // <-- pass if AddStallForm requires!
          />
        </Dialog>
        <Dialog open={editModalOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          {selectedStall && (
            <EditStallForm
              open={editModalOpen}
              stall={selectedStall}
              onClose={handleEditClose}
              onSuccess={handleEditSuccess}
            />
          )}
        </Dialog>
        <Dialog
          open={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          {viewedStall && <StallDetailCard stall={viewedStall} />}
        </Dialog>
        {/* SNACKBAR */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        {error && <MDTypography color="error">{error}</MDTypography>}
      </MDBox>
    </DashboardLayout>
  );
}
