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
export const exportCsv = async () =>
  (await axios.get("/stalls/export/csv/", { responseType: "blob" })).data;
export const exportExcel = async () =>
  (await axios.get("/stalls/export/excel/", { responseType: "blob" })).data;

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
