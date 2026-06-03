// src/layouts/tenants/pages/MasterTenantList.js

import React, { useEffect, useState, useCallback } from "react";
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
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import TenantTable from "../components/TenantTable";
import BulkActionBar from "../components/BulkActionBar";
import CommunicationDialog from "../components/CommunicationDialog";
import TenantForm from "../components/TenantForm";
import TenantDetailDialog from "../components/TenantDetail";

import {
  getTenants,
  addTenant,
  updateTenant,
  deactivateTenant,
  sendBulkSMS,
  sendBulkEmail,
  exportTenantsCSV,
} from "../api/tenants";

import { useAuth } from "context/AuthContext";
import { canBulk } from "../../leases/utils/roleUtils";
import { debugLog } from "../../stalls/utils/debug";

export default function MasterTenantList() {
  const { userProfile: user } = useAuth();
  const navigate = useNavigate();

  const [tenants, setTenants] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [commOpen, setCommOpen] = useState(false);
  const [commLoading, setCommLoading] = useState(false);
  const [commError, setCommError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [showForm, setShowForm] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [detailTenant, setDetailTenant] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const allowBulk = canBulk(user);

  const fetchTenants = useCallback(() => {
    const offset = (page - 1) * rowsPerPage;
    setLoading(true);
    getTenants({ limit: rowsPerPage, offset })
      .then((data) => {
        const tenantsList = Array.isArray(data.results) ? data.results : data;
        const count = data.count || tenantsList.length;
        setTenants(tenantsList);
        setTotalCount(count);
        setSelectedIds([]);
      })
      .catch((err) => {
        debugLog("[MasterTenantList] Fetch error", err);
        setSnackbar({ open: true, message: "Failed to load tenants.", severity: "error" });
      })
      .finally(() => setLoading(false));
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleDeactivate = (id) => {
    if (!window.confirm("Are you sure you want to deactivate this tenant?")) return;
    setLoading(true);
    deactivateTenant(id)
      .then(() => {
        setSnackbar({ open: true, message: "Tenant deactivated.", severity: "success" });
        fetchTenants();
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
    setLoading(true);
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
      .finally(() => setLoading(false));
  };

  const handleBulkExport = async () => {
    if (!allowBulk || !selectedIds.length) return;
    try {
      const blob = await exportTenantsCSV({ ids: selectedIds.join(",") });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tenants.csv";
      a.click();
      window.URL.revokeObjectURL(url);
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
      <MDTypography variant="h4" gutterBottom>
        All Tenants
      </MDTypography>

      <BulkActionBar
        selectedIds={selectedIds}
        user={user}
        onBulkDeactivate={handleBulkDeactivate}
        onBulkExport={handleBulkExport}
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
              onView={(id) => {
                const tenant = tenants.find((t) => t.id === id);
                setDetailTenant(tenant);
              }}
              onEdit={(id) => {
                const tenant = tenants.find((t) => t.id === id);
                setEditTenant(tenant);
                setShowForm(true);
              }}
              onDeactivate={handleDeactivate}
              showCheckbox={allowBulk}
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

      {detailTenant && (
        <TenantDetailDialog
          open={!!detailTenant}
          tenant={detailTenant}
          onClose={() => setDetailTenant(null)}
        />
      )}

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
