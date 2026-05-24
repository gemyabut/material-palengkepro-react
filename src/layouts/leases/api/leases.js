// /src/layouts/leases/api/leases.js

const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === "true";

let api;
if (USE_MOCK_DATA) {
  api = require("./leases.mock");
} else {
  api = require("./leases.real");
}

// CRUD
export const getLeases = api.getLeases;
export const getLeaseById = api.getLeaseById;
export const addLease = api.addLease;
export const updateLease = api.updateLease;
export const deleteLease = api.deleteLease;

// Filters/Extras
export const fetchActiveLeases = api.fetchActiveLeases;
export const fetchInactiveLeases = api.fetchInactiveLeases;
export const fetchExpiredLeases = api.fetchExpiredLeases;
export const fetchLeasesByTenant = api.fetchLeasesByTenant;
export const fetchLeasesByStall = api.fetchLeasesByStall;

// (If you add more, just export them here)
