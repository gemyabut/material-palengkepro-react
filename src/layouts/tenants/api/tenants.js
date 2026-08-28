import apiClient from "../../../api/axios";
import { debugLog } from "../../stalls/utils/debug";

const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === "true";
const source = USE_MOCK_DATA ? require("./tenants.mock") : require("./tenants.real");

// Core
export const getTenants = source.getTenants;
export const getTenantById = source.getTenantById;
export const getTenantLeases = source.getTenantLeases;
export const getTenantLeaseholderRights = source.getTenantLeaseholderRights;
export const getTenantInvoices = source.getTenantInvoices;
export const getTenantPayments = source.getTenantPayments;
export const addTenant = source.addTenant;
export const updateTenant = source.updateTenant;
export const deactivateTenant = source.deactivateTenant;

// Bulk / CSV / Comms
export const bulkDeactivateTenants = source.bulkDeactivateTenants;
export const exportTenantsCSV = source.exportTenantsCSV;
export const importTenantsCSV = source.importTenantsCSV;
export const sendBulkSMS = source.sendBulkSMS;
export const sendBulkEmail = source.sendBulkEmail;

// Logs (fallback to real axios here if mock doesn’t implement)
export async function getContactLog(tenantId) {
  debugLog("API:getContactLog", tenantId);
  const { data } = await apiClient.get(`/tenants/${tenantId}/contact_log/`);
  return data;
}

export async function addContactLog(tenantId, payload) {
  debugLog("API:addContactLog", tenantId, payload);
  const { data } = await apiClient.post(`/tenants/${tenantId}/contact_log/`, payload);
  return data;
}

export async function getAuditLog(tenantId, params = {}) {
  debugLog("API:getAuditLog", tenantId, params);
  const { data } = await apiClient.get(`/tenants/${tenantId}/audit_log/`, { params });
  return data;
}

// Tenant request update (tenant self-service)
export async function requestTenantUpdate(tenantId, payload) {
  debugLog("API:requestTenantUpdate", { tenantId, payload });
  const { data } = await apiClient.post(`/tenants/${tenantId}/request-update/`, payload);
  return data;
}

// Task #115 — Documents & Verification (staff-side upload/verify; real axios,
// not mock-backed — matches Logs functions above)
export async function uploadTenantDocument(tenantId, file) {
  debugLog("API:uploadTenantDocument", tenantId);
  const form = new FormData();
  form.append("uploaded_documents", file);
  const { data } = await apiClient.patch(`/tenants/${tenantId}/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function uploadTenantPhotograph(tenantId, file) {
  debugLog("API:uploadTenantPhotograph", tenantId);
  const form = new FormData();
  form.append("photograph", file);
  const { data } = await apiClient.patch(`/tenants/${tenantId}/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateVerificationNotes(tenantId, verification_notes) {
  debugLog("API:updateVerificationNotes", tenantId);
  const { data } = await apiClient.patch(`/tenants/${tenantId}/`, { verification_notes });
  return data;
}

export async function setVerificationStatus(tenantId, verification_status) {
  debugLog("API:setVerificationStatus", { tenantId, verification_status });
  const { data } = await apiClient.patch(`/tenants/${tenantId}/`, { verification_status });
  return data;
}

// PR 4 — ID Card PDF download (PR #100's TenantIdCardSingleView). Same
// authenticated-blob-download pattern as Staff Roster Export
// (api/csvImport.js::downloadStaffRosterExport) — local filename-extraction
// helper rather than a cross-module import, matching that file's own
// precedent that a 5-line helper doesn't warrant sharing across modules.
function extractFilenameFromResponse(response, fallback) {
  const disposition = response.headers?.["content-disposition"] || "";
  const match = disposition.match(/filename="([^"]+)"/);
  return match ? match[1] : fallback;
}

export async function downloadTenantIdCard(tenantId) {
  debugLog("API:downloadTenantIdCard", tenantId);
  const res = await apiClient.get(`/tenants/${tenantId}/id-card.pdf`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = extractFilenameFromResponse(res, `tenant_${tenantId}_id_card.pdf`);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
