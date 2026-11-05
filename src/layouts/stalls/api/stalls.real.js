import axios from "../../../api/axios";

/**
 * Core CRUD
 */
export const fetchStalls = async (params = {}) => (await axios.get("/stalls/", { params })).data;
export const fetchStall = async (id) => (await axios.get(`/stalls/${id}/`)).data;
export const createStall = async (data) => (await axios.post("/stalls/", data)).data;
export const updateStall = async (id, data) => (await axios.patch(`/stalls/${id}/`, data)).data;
export const deactivateStall = async (id) =>
  (await axios.patch(`/stalls/${id}/`, { status: "INACTIVE" })).data;
export const reactivateStall = async (id) =>
  (await axios.post(`/stalls/${id}/reactivate/`)).data;
export const deleteStall = async (id) => (await axios.delete(`/stalls/${id}/`)).data;

/**
 * Special Lists & Filters
 */
export const fetchVacantStalls = async () => (await axios.get("/stalls/vacant/")).data;
export const fetchAssignedStalls = async () => (await axios.get("/stalls/assigned/")).data;

/**
 * Summary & Analytics
 */
export const fetchStallsSummary = async () => (await axios.get("/stalls/summary/")).data;

/**
 * Export
 */
// MDU-018 — export follows the screen: same query params the list sends
// (search, status, include_inactive, ...), no page/page_size. The server's
// file name (stalls_{MARKET}_{YYYYMMDD}.xlsx) is returned with the blob.
export const exportExcel = async (params = {}) => {
  const res = await axios.get("/stalls/export/excel/", { params, responseType: "blob" });
  const match = (res.headers?.["content-disposition"] || "").match(/filename="([^"]+)"/);
  return { blob: res.data, filename: match ? match[1] : "stalls.xlsx" };
};

/**
 * Advanced/Optional
 */
export const fetchStallsByFilter = async (params = {}) =>
  (await axios.get("/stalls/", { params })).data;
export const bulkUpdateStalls = async (ids, data) =>
  (await axios.patch("/stalls/bulk/", { ids, ...data })).data;

/**
 * Assignment & Details
 */
export const fetchStallsByCurrentTenant = async (tenantId) =>
  (await axios.get(`/stalls/by-current-tenant/${tenantId}/`)).data;

export const fetchStallsByLease = async (leaseId) =>
  (await axios.get(`/stalls/by-lease/${leaseId}/`)).data;

export const fetchStallWithLeaseAndTenant = async (id) => (await axios.get(`/stalls/${id}/`)).data;

/**
 * Nested detail actions (F9)
 */
export const getStallLeases = async (id) => (await axios.get(`/stalls/${id}/leases/`)).data;
export const getStallLeaseholderRights = async (id) =>
  (await axios.get(`/stalls/${id}/leaseholder-rights/`)).data;
