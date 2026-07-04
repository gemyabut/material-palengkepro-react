// src/layouts/tenants/pages/OfficerTenantList.js

import React, { useState, useEffect } from "react";
import { Stack, Box, Button, Paper, CircularProgress, Typography } from "@mui/material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import TenantTable from "../components/TenantTable";
import BulkActionBar from "../components/BulkActionBar";
import TenantForm from "../components/TenantForm";
import CommunicationDialog from "../components/CommunicationDialog";

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
import { debugLog } from "../utils/debug";
import { canBulk } from "../../leases/utils/roleUtils";

export default function OfficerTenantList() {
  const { userProfile: user } = useAuth();
  const navigate = useNavigate();
  const allowBulk = canBulk(user);

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editTenant, setEditTenant] = useState(null);
  const [commOpen, setCommOpen] = useState(false);
  const [commLoading, setCommLoading] = useState(false);
  const [commError, setCommError] = useState(null);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('full_name');

  useEffect(() => {
    setLoading(true);
    const params = { assigned_to: user?.id, ordering };
    if (search) params.search = search;
    getTenants(params)
      .then((data) => setTenants(data.results || data))
      .catch((err) => debugLog("Officer fetch tenants error:", err))
      .finally(() => setLoading(false));
  }, [user?.id, search, ordering]);

  const handleAdd = () => {
    setEditTenant(null);
    setShowForm(true);
  };

  const handleEdit = (id) => {
    const tenant = tenants.find((t) => t.id === id);
    setEditTenant(tenant || null);
    setShowForm(true);
  };

  const handleView = (id) => navigate(`/tenants/${id}`);

  const handleDeactivate = (id) => {
    if (!window.confirm("Are you sure you want to deactivate this tenant?")) return;
    setLoading(true);
    deactivateTenant(id)
      .then(() => {
        setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, status: "inactive" } : t)));
        setSelectedIds((prev) => prev.filter((tid) => tid !== id));
        toast.success("Tenant deactivated.");
      })
      .catch((err) => {
        debugLog("Deactivate error:", err);
        toast.error("Failed to deactivate tenant.");
      })
      .finally(() => setLoading(false));
  };

  const handleBulkDeactivate = () => {
    if (!allowBulk || !selectedIds.length) return;
    if (!window.confirm("Deactivate selected tenants?")) return;

    setLoading(true);
    Promise.all(selectedIds.map((id) => deactivateTenant(id)))
      .then(() => {
        setTenants((prev) =>
          prev.map((t) => (selectedIds.includes(t.id) ? { ...t, status: "inactive" } : t))
        );
        setSelectedIds([]);
        toast.success("Selected tenants deactivated.");
      })
      .catch((err) => {
        debugLog("Bulk deactivate error:", err);
        toast.error("Failed to deactivate some tenants.");
      })
      .finally(() => setLoading(false));
  };

  const handleFormSubmit = (form) => {
    setLoading(true);
    const apiCall = form.id ? updateTenant(form.id, form) : addTenant(form);
    apiCall
      .then((saved) => {
        setTenants((prev) => {
          if (form.id) return prev.map((t) => (t.id === saved.id ? saved : t));
          return [saved, ...prev];
        });
        setShowForm(false);
        setEditTenant(null);
        toast.success("Tenant saved.");
      })
      .catch((err) => {
        debugLog("Form submit error:", err);
        toast.error("Failed to save tenant.");
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
      toast.success("Export started.");
    } catch (err) {
      debugLog("Export error:", err);
      toast.error("Export failed.");
    }
  };

  const handleOpenComm = () => {
    if (!allowBulk || !selectedIds.length) return;
    setCommError(null);
    setCommOpen(true);
  };

  const handleSendSMS = async (message) => {
    setCommLoading(true);
    setCommError(null);
    try {
      await sendBulkSMS(selectedIds, message);
      setCommOpen(false);
      toast.success("SMS sent successfully.");
    } catch (err) {
      debugLog("Officer bulk SMS error:", err);
      setCommError("Failed to send SMS.");
    } finally {
      setCommLoading(false);
    }
  };

  const handleSendEmail = async (subject, body) => {
    setCommLoading(true);
    setCommError(null);
    try {
      await sendBulkEmail(selectedIds, subject, body);
      setCommOpen(false);
      toast.success("Email sent successfully.");
    } catch (err) {
      debugLog("Officer bulk Email error:", err);
      setCommError("Failed to send Email.");
    } finally {
      setCommLoading(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Assigned Tenants (Leasing Officer)</Typography>
        <Button variant="contained" onClick={handleAdd}>
          + Add Tenant
        </Button>
      </Stack>

      <BulkActionBar
        selectedIds={selectedIds}
        user={user}
        onBulkDeactivate={handleBulkDeactivate}
        onBulkExport={handleBulkExport}
        onOpenComm={handleOpenComm}
        loading={loading}
      />

      <Paper sx={{ p: 0 }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ p: 6 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <TenantTable
            tenants={tenants}
            user={user}
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
            onSelectAll={(checked) => setSelectedIds(checked ? tenants.map((t) => t.id) : [])}
            onEdit={handleEdit}
            onView={handleView}
            onDeactivate={handleDeactivate}
            showCheckbox={allowBulk}
            search={search}
            onSearchChange={(val) => setSearch(val)}
            ordering={ordering}
            onOrderingChange={(val) => setOrdering(val)}
          />
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
    </Stack>
  );
}
