// /src/layouts/leases/api/leases.real.js
import axios from "../../../api/axios";
import { debugLog } from "../../stalls/utils/debug";

export const getLeases = async () => {
  debugLog("[leases.real.js] getLeases called");
  const res = await axios.get("/api/leases/");
  return res.data;
};

export const getLeaseById = async (id) => {
  debugLog("[leases.real.js] getLeaseById called", id);
  const res = await axios.get(`/api/leases/${id}/`);
  return res.data;
};

export const addLease = async (data) => {
  debugLog("[leases.real.js] addLease called", data);
  const res = await axios.post("/api/leases/", data);
  return res.data;
};

export const updateLease = async (id, updates) => {
  debugLog("[leases.real.js] updateLease called", id, updates);
  const res = await axios.put(`/api/leases/${id}/`, updates);
  return res.data;
};

export const deleteLease = async (id) => {
  debugLog("[leases.real.js] deleteLease called", id);
  const res = await axios.delete(`/api/leases/${id}/`);
  return res.data;
};

// Extra filters, assuming your DRF supports ?status=, ?tenant=, ?stall= filters:

export const fetchActiveLeases = async () => {
  debugLog("[leases.real.js] fetchActiveLeases called");
  const res = await axios.get("/api/leases/", { params: { status: "ACTIVE" } });
  return res.data;
};

export const fetchInactiveLeases = async () => {
  debugLog("[leases.real.js] fetchInactiveLeases called");
  const res = await axios.get("/api/leases/", { params: { status: "INACTIVE" } });
  return res.data;
};

export const fetchExpiredLeases = async () => {
  debugLog("[leases.real.js] fetchExpiredLeases called");
  const res = await axios.get("/api/leases/", { params: { status: "EXPIRED" } });
  return res.data;
};

export const fetchLeasesByTenant = async (tenantId) => {
  debugLog("[leases.real.js] fetchLeasesByTenant called", tenantId);
  const res = await axios.get("/api/leases/", { params: { tenant: tenantId } });
  return res.data;
};

export const fetchLeasesByStall = async (stallId) => {
  debugLog("[leases.real.js] fetchLeasesByStall called", stallId);
  const res = await axios.get("/api/leases/", { params: { stall: stallId } });
  return res.data;
};
