// src/layouts/tenants/pages/CashierTenantList.js

import React, { useState, useEffect } from "react";
import { Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

import TenantTable from "../components/TenantTable";
import BulkActionBar from "../components/BulkActionBar";
import CommunicationDialog from "../components/CommunicationDialog";

import { getTenants, sendBulkSMS, sendBulkEmail, exportTenantsCSV } from "../api/tenants";
import { debugLog } from "../utils/debug";
import { useAuth } from "../../../context/AuthContext";
import { canBulk } from "../../leases/utils/roleUtils"; // cashier => false

export default function CashierTenantList() {
  const { userProfile: user } = useAuth();
  const navigate = useNavigate();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const [commOpen, setCommOpen] = useState(false);
  const [commLoading, setCommLoading] = useState(false);
  const [commError, setCommError] = useState(null);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('full_name');

  const allowBulk = canBulk(user);

  useEffect(() => {
    setLoading(true);
    const params = { payment_status: "any", ordering };
    if (search) params.search = search;
    getTenants(params)
      .then((data) => setTenants(data.results || data))
      .catch((err) => debugLog("Cashier fetch tenants error:", err))
      .finally(() => setLoading(false));
  }, [search, ordering]);

  const handleView = (id) => navigate(`/tenants/${id}`);

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
      debugLog("Cashier export error:", err);
      alert("Export failed.");
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
      alert("SMS sent successfully.");
    } catch (err) {
      debugLog("Cashier bulk SMS error:", err);
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
      alert("Email sent successfully.");
    } catch (err) {
      debugLog("Cashier bulk Email error:", err);
      setCommError("Failed to send Email.");
    } finally {
      setCommLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Tenants (Cashier)
      </Typography>

      <BulkActionBar
        selectedIds={selectedIds}
        user={user}
        onBulkDeactivate={() => {}}
        onBulkExport={handleBulkExport}
        onOpenComm={handleOpenComm}
        loading={loading}
      />

      <TenantTable
        tenants={tenants}
        user={user}
        selectedIds={selectedIds}
        onSelect={setSelectedIds}
        onSelectAll={() => {}}
        onEdit={null}
        onView={handleView}
        onDeactivate={null}
        showCheckbox={false}
        search={search}
        onSearchChange={(val) => setSearch(val)}
        ordering={ordering}
        onOrderingChange={(val) => setOrdering(val)}
      />

      <CommunicationDialog
        open={commOpen}
        onClose={() => setCommOpen(false)}
        onSendSMS={handleSendSMS}
        onSendEmail={handleSendEmail}
        loading={commLoading}
        error={commError}
      />
    </Box>
  );
}
