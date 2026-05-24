// src/layouts/stalls/api/stalls.js

import { debugLog } from "../utils/debug";

const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === "true";

let api;
if (USE_MOCK_DATA) {
  debugLog("[STALLS API] Using MOCK data", "color: orange; font-weight: bold");
  api = require("./stalls.mock");
} else {
  debugLog("[STALLS API] Using REAL backend", "color: green; font-weight: bold");
  api = require("./stalls.real");
}

export const fetchStalls = api.fetchStalls;
export const fetchStall = api.fetchStall;

export const createStall = api.createStall;
export const updateStall = api.updateStall;
export const deactivateStall = api.deactivateStall;
export const deleteStall = api.deleteStall;

export const fetchVacantStalls = api.fetchVacantStalls;
export const fetchAssignedStalls = api.fetchAssignedStalls;

export const fetchStallsSummary = api.fetchStallsSummary;
export const exportCsv = api.exportCsv;
export const exportExcel = api.exportExcel;

export const fetchStallsByFilter = api.fetchStallsByFilter;
export const bulkUpdateStalls = api.bulkUpdateStalls;

export const fetchStallsByCurrentTenant = api.fetchStallsByCurrentTenant;
export const fetchStallsByLease = api.fetchStallsByLease;
export const fetchStallWithLeaseAndTenant = api.fetchStallWithLeaseAndTenant;
