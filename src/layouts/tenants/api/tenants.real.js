import apiClient from "../../../api/axios";
import { debugLog } from "../../stalls/utils/debug";

// GET /tenants/?search=&status=&ordering=&page=&page_size=
export async function getTenants(params = {}) {
  const { data } = await apiClient.get("/tenants/", { params });
  return data; // {count, results}
}
export async function getTenantById(id) {
  const { data } = await apiClient.get(`/tenants/${id}/`);
  return data;
}
export async function getTenantLeases(id) {
  const { data } = await apiClient.get(`/tenants/${id}/leases/`);
  return data;
}
export async function getTenantLeaseholderRights(id) {
  const { data } = await apiClient.get(`/tenants/${id}/leaseholder-rights/`);
  return data;
}
export async function getTenantInvoices(id) {
  const { data } = await apiClient.get(`/tenants/${id}/invoices/`);
  return data;
}
export async function getTenantPayments(id) {
  const { data } = await apiClient.get(`/tenants/${id}/payments/`);
  return data;
}
export async function addTenant(payload) {
  const { data } = await apiClient.post("/tenants/", payload);
  return data;
}
export async function updateTenant(id, payload) {
  const { data } = await apiClient.put(`/tenants/${id}/`, payload);
  return data;
}
export async function deactivateTenant(id) {
  const { data } = await apiClient.post(`/tenants/${id}/deactivate/`);
  return data;
}

// Bulk
export async function bulkDeactivateTenants(ids = []) {
  const { data } = await apiClient.post("/tenants/bulk-deactivate/", { ids });
  return data;
}

// CSV
export async function exportTenantsCSV(params = {}) {
  const res = await apiClient.get("/tenants/export/", { params, responseType: "blob" });
  return res.data; // Blob
}
export async function importTenantsCSV(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post("/tenants/import/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // {created, skipped, failed: [...]}
}

// Comms
export async function sendBulkSMS(ids, message) {
  const { data } = await apiClient.post("/tenants/bulk-sms/", { ids, message });
  return data;
}
export async function sendBulkEmail(ids, subject, body) {
  const { data } = await apiClient.post("/tenants/bulk-email/", { ids, subject, body });
  return data;
}
