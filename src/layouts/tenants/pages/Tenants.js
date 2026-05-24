// src/layouts/tenants/pages/Tenants.js
// (If you use MasterTenantList.js, keep the filename but the code is identical.)

import React, { useState, useEffect, useContext } from "react";
import TenantTable from "../components/TenantTable";
import BulkActionBar from "../components/BulkActionBar";
import TenantForm from "../components/TenantForm";
import TenantDetail from "../components/TenantDetail";
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

import { UserContext } from "../../../components/AppLayout";
import { debugLog } from "../utils/debug";
import { canBulk } from "../../leases/utils/roleUtils"; // adjust if moved

export default function TenantsPage() {
  const { user } = useContext(UserContext);

  // Data
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Add/Edit
  const [showForm, setShowForm] = useState(false);
  const [editTenant, setEditTenant] = useState(null);

  // Detail
  const [showDetail, setShowDetail] = useState(false);
  const [viewTenant, setViewTenant] = useState(null);

  // Communication dialog
  const [commOpen, setCommOpen] = useState(false);
  const [commLoading, setCommLoading] = useState(false);
  const [commError, setCommError] = useState(null);

  const allowBulk = canBulk(user);

  // Fetch
  useEffect(() => {
    setLoading(true);
    getTenants()
      .then((data) => setTenants(data.results || data))
      .catch((err) => debugLog("Fetch tenants error:", err))
      .finally(() => setLoading(false));
  }, []);

  // Handlers
  const handleAdd = () => {
    setEditTenant(null);
    setShowForm(true);
  };

  const handleEdit = (id) => {
    const tenant = tenants.find((t) => t.id === id);
    setEditTenant(tenant || null);
    setShowForm(true);
  };

  const handleView = (id) => {
    const tenant = tenants.find((t) => t.id === id);
    setViewTenant(tenant || null);
    setShowDetail(true);
  };

  const handleDeactivate = (id) => {
    if (!window.confirm("Are you sure you want to deactivate this tenant?")) return;
    setLoading(true);
    deactivateTenant(id)
      .then(() => {
        setTenants((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: "inactive" } : t))
        );
        setSelectedIds((prev) => prev.filter((tid) => tid !== id));
        alert("Tenant deactivated.");
      })
      .catch((err) => {
        debugLog("Deactivate error:", err);
        alert("Failed to deactivate tenant.");
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
          prev.map((t) =>
            selectedIds.includes(t.id) ? { ...t, status: "inactive" } : t
          )
        );
        setSelectedIds([]);
        alert("Selected tenants deactivated.");
      })
      .catch((err) => {
        debugLog("Bulk deactivate error:", err);
        alert("Failed to deactivate some tenants.");
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
        alert("Tenant saved.");
      })
      .catch((err) => {
        debugLog("Form submit error:", err);
        alert("Failed to save tenant.");
      })
      .finally(() => setLoading(false));
  };

  // Export CSV
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
      debugLog("Export error:", err);
      alert("Export failed.");
    }
  };

  // Communication dialog
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
      debugLog("Bulk SMS error:", err);
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
      debugLog("Bulk Email error:", err);
      setCommError("Failed to send Email.");
    } finally {
      setCommLoading(false);
    }
  };

  return (
    <div>
      <h2>Tenants</h2>

      <div style={{ marginBottom: 16 }}>
        <button onClick={handleAdd} className="btn btn-primary">
          + Add Tenant
        </button>
      </div>

      <BulkActionBar
        selectedIds={selectedIds}
        user={user}
        onBulkDeactivate={handleBulkDeactivate}
        onBulkExport={handleBulkExport}
        onOpenComm={handleOpenComm}   // <-- opens CommunicationDialog
        loading={loading}
      />

      <TenantTable
        tenants={tenants}
        user={user}
        selectedIds={selectedIds}
        onSelect={setSelectedIds}
        onSelectAll={(checked) =>
          setSelectedIds(checked ? tenants.map((t) => t.id) : [])
        }
        onEdit={handleEdit}
        onView={handleView}
        onDeactivate={handleDeactivate}
        showCheckbox={allowBulk}
      />

      {/* Add/Edit Dialog */}
      <TenantForm
        open={showForm}
        initialValues={editTenant}
        onSubmit={handleFormSubmit}
        onClose={() => setShowForm(false)}
        user={user}
        loading={loading}
      />

      {/* Detail Card */}
      {showDetail && (
        <TenantDetail
          tenant={viewTenant}
          user={user}
          onEdit={handleEdit}
          showEdit={true}
        />
      )}

      {/* Communication (SMS/Email) */}
      <CommunicationDialog
        open={commOpen}
        onClose={() => setCommOpen(false)}
        onSendSMS={handleSendSMS}
        onSendEmail={handleSendEmail}
        loading={commLoading}
        error={commError}
      />
    </div>
  );
}
