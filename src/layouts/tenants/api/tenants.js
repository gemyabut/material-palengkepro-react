import apiClient from "../../../api/axios";
import { debugLog } from "../../stalls/utils/debug";

const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === "true";
const source = USE_MOCK_DATA ? require("./tenants.mock") : require("./tenants.real");

// Core
export const getTenants = source.getTenants;
export const getTenantById = source.getTenantById;
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
