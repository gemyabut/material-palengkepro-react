// src/layouts/tenants/pages/MasterTenantList.js

import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Paper,
  CircularProgress,
  Snackbar,
  Pagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import TenantTable from "../components/TenantTable";
import BulkActionBar from "../components/BulkActionBar";
import CommunicationDialog from "../components/CommunicationDialog";
import TenantForm from "../components/TenantForm";

import {
  addTenant,
  updateTenant,
  deactivateTenant,
  sendBulkSMS,
  sendBulkEmail,
  exportTenantsXLSX,
} from "../api/tenants";

import { useAuth } from "context/AuthContext";
import { canBulk } from "../../leases/utils/roleUtils";
import { debugLog } from "../../stalls/utils/debug";
import useTenants from "../hooks/useTenants";

export default function MasterTenantList() {
  const { userProfile: user } = useAuth();
  const navigate = useNavigate();

  const {
    tenants,
    totalCount,
    loading: listLoading,
    error: listError,
    page,
    rowsPerPage,
    search,
    ordering,
    setPage,
    setRowsPerPage,
    setSearch,
    setOrdering,
    fetchTenants,
  } = useTenants();

  // CRUD actions (deactivate/save/bulk) toggle this independently of the
  // list fetch's own loading state — matches the pre-consolidation
  // behavior where a single loading flag covered both concerns.
  const [actionLoading, setActionLoading] = useState(false);
  const loading = listLoading || actionLoading;

  const [selectedIds, setSelectedIds] = useState([]);
  const [commOpen, setCommOpen] = useState(false);
  const [commLoading, setCommLoading] = useState(false);
  const [commError, setCommError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [showForm, setShowForm] = useState(false);
  const [editTenant, setEditTenant] = useState(null);

  const allowBulk = canBulk(user);

  // Reset selection whenever a new page of tenants loads — matches the
  // pre-consolidation fetchTenants().then(() => setSelectedIds([])).
  useEffect(() => {
    setSelectedIds([]);
  }, [tenants]);

  useEffect(() => {
    if (listError) {
      debugLog("[MasterTenantList] Fetch error", listError);
      setSnackbar({ open: true, message: "Failed to load tenants.", severity: "error" });
    }
  }, [listError]);

  const handleDeactivate = (id) => {
    if (!window.confirm("Are you sure you want to deactivate this tenant?")) return;
    setActionLoading(true);
    deactivateTenant(id)
      .then(() => {
        setSnackbar({ open: true, message: "Tenant deactivated.", severity: "success" });
        fetchTenants();
        // Matches pre-consolidation behavior exactly: the single shared
        // `loading` flag only got reset via the chained fetch's own
        // .finally() on success — a failed deactivate left it stuck true.
        // Not fixing that here; just preserving it faithfully.
        setActionLoading(false);
      })
      .catch((err) => {
        debugLog("[MasterTenantList] Deactivate error", err);
        setSnackbar({ open: true, message: "Failed to deactivate.", severity: "error" });
      });
  };

  const handleBulkDeactivate = () => {
    if (!allowBulk || !selectedIds.length) return;
    if (!window.confirm("Deactivate selected tenants?")) return;
    Promise.all(selectedIds.map(deactivateTenant))
      .then(() => {
        setSnackbar({ open: true, message: "Selected tenants deactivated.", severity: "success" });
        fetchTenants();
      })
      .catch((err) => {
        debugLog("[MasterTenantList] Bulk deactivate error", err);
        setSnackbar({ open: true, message: "Bulk deactivate failed.", severity: "error" });
      });
  };

  const handleFormSubmit = (form) => {
    setActionLoading(true);
    const apiCall = form.id ? updateTenant(form.id, form) : addTenant(form);
    apiCall
      .then(() => {
        setSnackbar({ open: true, message: "Tenant saved.", severity: "success" });
        setShowForm(false);
        setEditTenant(null);
        fetchTenants();
      })
      .catch((err) => {
        debugLog("[MasterTenantList] Save error", err);
        setSnackbar({ open: true, message: "Failed to save tenant.", severity: "error" });
      })
      .finally(() => setActionLoading(false));
  };

  // Top-toolbar export — full market-scoped list, not selection-based.
  // Lead's scope call: master export is a page-level action, not a
  // bulk-select action (that's what BulkActionBar's row-selection was for).
  const handleExportAll = async () => {
    try {
      const blob = await exportTenantsXLSX();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tenants.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: "Export started", severity: "info" });
    } catch (err) {
      debugLog("[MasterTenantList] Export error", err);
      setSnackbar({ open: true, message: "Export failed.", severity: "error" });
    }
  };

  const handleOpenComm = () => {
    if (!allowBulk || !selectedIds.length) return;
    setCommError(null);
    setCommOpen(true);
  };

  const handleSendSMS = async (message) => {
    setCommLoading(true);
    try {
      await sendBulkSMS(selectedIds, message);
      setCommOpen(false);
      setSnackbar({ open: true, message: "SMS sent successfully.", severity: "success" });
    } catch (err) {
      debugLog("[MasterTenantList] Bulk SMS error", err);
      setCommError("Failed to send SMS.");
    } finally {
      setCommLoading(false);
    }
  };

  const handleSendEmail = async (subject, body) => {
    setCommLoading(true);
    try {
      await sendBulkEmail(selectedIds, subject, body);
      setCommOpen(false);
      setSnackbar({ open: true, message: "Email sent successfully.", severity: "success" });
    } catch (err) {
      debugLog("[MasterTenantList] Bulk Email error", err);
      setCommError("Failed to send Email.");
    } finally {
      setCommLoading(false);
    }
  };

  return (
    <MDBox px={3} py={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <MDTypography variant="h4" gutterBottom>
          All Tenants
        </MDTypography>
        <Button variant="outlined" onClick={handleExportAll}>
          Export XLSX
        </Button>
      </Stack>

      <BulkActionBar
        selectedIds={selectedIds}
        user={user}
        onBulkDeactivate={handleBulkDeactivate}
        onOpenComm={handleOpenComm}
        loading={loading}
      />

      <Paper sx={{ mt: 2 }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ p: 6 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <>
            <TenantTable
              tenants={tenants}
              user={user}
              loading={loading}
              selectedIds={selectedIds}
              onSelect={setSelectedIds}
              onSelectAll={(checked) => setSelectedIds(checked ? tenants.map((t) => t.id) : [])}
              onView={(id) => navigate(`/tenants/${id}`)}
              onEdit={(id) => {
                const tenant = tenants.find((t) => t.id === id);
                setEditTenant(tenant);
                setShowForm(true);
              }}
              onDeactivate={handleDeactivate}
              showCheckbox={allowBulk}
              search={search}
              onSearchChange={setSearch}
              ordering={ordering}
              onOrderingChange={setOrdering}
            />
            <Stack direction="row" justifyContent="space-between" alignItems="center" p={2}>
              <FormControl sx={{ minWidth: 120 }} size="small">
                <InputLabel>Rows per page</InputLabel>
                <Select
                  value={rowsPerPage}
                  label="Rows per page"
                  onChange={(e) => {
                    setPage(1);
                    setRowsPerPage(parseInt(e.target.value, 10));
                  }}
                >
                  {[20, 50, 100].map((val) => (
                    <MenuItem key={val} value={val}>
                      {val}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Pagination
                count={Math.ceil(totalCount / rowsPerPage)}
                page={page}
                onChange={(e, val) => setPage(val)}
                color="primary"
              />
            </Stack>
          </>
        )}
      </Paper>

      <TenantForm
        open={showForm}
        initialValues={editTenant}
        onSubmit={handleFormSubmit}
        onClose={() => setShowForm(false)}
        user={user}
        loading={loading}
      />

      <CommunicationDialog
        open={commOpen}
        onClose={() => setCommOpen(false)}
        onSendSMS={handleSendSMS}
        onSendEmail={handleSendEmail}
        loading={commLoading}
        error={commError}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </MDBox>
  );
}
