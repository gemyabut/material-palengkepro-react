import { sampleStalls } from "../../leases/data/sampleStalls";
import { debugLog } from "layouts/stalls/utils/debug";
debugLog("[stalls.mock.js] sampleStalls loaded:", sampleStalls?.length, sampleStalls);

import { sampleTenants } from "../../leases/data/sampleTenants";
import { sampleLeases } from "../../leases/data/sampleLeases";

let stalls = [...sampleStalls];
debugLog("[stalls.mock.js] stalls array copied:", stalls.length);

/**
 * Core CRUD
 */

export const fetchStalls = (params = {}) =>
  new Promise((resolve) => {
    debugLog("[stalls.mock.js] fetchStalls called with params:", params);

    setTimeout(() => {
      let filtered = stalls;
      if (params.status) {
        filtered = filtered.filter((s) => s.status === params.status);
        debugLog("[stalls.mock.js] filtering by status", params.status, filtered.length, "results");
      }
      if (params.stall_type) {
        filtered = filtered.filter((s) => s.stall_type === params.stall_type);
        debugLog(
          "[stalls.mock.js] filtering by type",
          params.stall_type,
          filtered.length,
          "results"
        );
      }
      if (params.section) {
        filtered = filtered.filter((s) => s.section === params.section);
        debugLog(
          "[stalls.mock.js] filtering by section",
          params.section,
          filtered.length,
          "results"
        );
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            (s.stall_number && s.stall_number.toLowerCase().includes(query)) ||
            (s.location && s.location.toLowerCase().includes(query))
        );
        debugLog("[stalls.mock.js] filtering by search", params.search, filtered.length, "results");
      }
      // Pagination logic
      const page = Number(params.page) || 1;
      const pageSize = Number(params.page_size) || 20;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paged = filtered.slice(start, end);

      const response = {
        results: [...paged],
        count: filtered.length,
        page,
        page_size: pageSize,
      };

      debugLog("[stalls.mock.js] fetchStalls returning:", response);
      resolve(response);
    }, 200);
  });

export const fetchStall = (id) =>
  new Promise((resolve) =>
    setTimeout(() => {
      const found = stalls.find((s) => s.id === Number(id));
      resolve(found ? { ...found } : null);
    }, 100)
  );

export const createStall = (data) =>
  new Promise((resolve) => {
    debugLog("[stalls.mock.js] createStall called:", data);
    const maxId = stalls.length ? Math.max(...stalls.map((s) => s.id)) : 0;
    const newStall = { ...data, id: maxId + 1, created_at: new Date().toISOString() };
    stalls = [...stalls, newStall]; // <-- IMMUTABLE update!
    debugLog("[stalls.mock.js] stalls.length after push:", stalls.length);
    setTimeout(() => resolve(newStall), 300);
  });

export const updateStall = (id, data) =>
  new Promise((resolve) =>
    setTimeout(() => {
      const idx = stalls.findIndex((s) => s.id === Number(id));
      if (idx === -1) return resolve(null);
      stalls[idx] = { ...stalls[idx], ...data, updated_at: new Date().toISOString() };
      debugLog("[stalls.mock.js] updateStall: updated", id, stalls[idx]);
      resolve({ ...stalls[idx] });
    }, 120)
  );

export const deactivateStall = (id) => updateStall(id, { status: "INACTIVE" });

export const deleteStall = (id) =>
  new Promise((resolve) =>
    setTimeout(() => {
      const idx = stalls.findIndex((s) => s.id === Number(id));
      if (idx === -1) return resolve(null);
      const [removed] = stalls.splice(idx, 1);
      resolve({ ...removed });
    }, 100)
  );

/**
 * Special Lists & Filters
 */
export const fetchVacantStalls = () =>
  new Promise((resolve) =>
    setTimeout(
      () => resolve(stalls.filter((s) => s.status === "AVAILABLE").map((s) => ({ ...s }))),
      200
    )
  );

export const fetchAssignedStalls = () =>
  new Promise((resolve) =>
    setTimeout(() => {
      const assigned = stalls.filter((s) =>
        ["OCCUPIED", "RESERVED", "UNDER_MAINTENANCE"].includes(s.status)
      );
      resolve(assigned.map((s) => ({ ...s })));
    }, 200)
  );

/**
 * Summary & Analytics
 */
export const fetchStallsSummary = () =>
  new Promise((resolve) =>
    setTimeout(() => {
      const statusList = ["AVAILABLE", "OCCUPIED", "RESERVED", "UNDER_MAINTENANCE", "INACTIVE"];
      const summary = statusList.map((status) => ({
        status,
        count: stalls.filter((s) => s.status === status).length,
      }));
      resolve({ summary, total: stalls.length });
    }, 200)
  );

/**
 * Export
 */
export const exportCsv = () =>
  new Promise((resolve) =>
    setTimeout(() => {
      const csv =
        "id,stall_number,location,status\n" +
        stalls.map((s) => `${s.id},"${s.stall_number}","${s.location}","${s.status}"`).join("\n");
      resolve(csv);
    }, 400)
  );

export const exportExcel = () =>
  new Promise((resolve) => setTimeout(() => resolve("Fake Excel Data"), 600));

/**
 * Advanced/Optional
 */
export const fetchStallsByFilter = fetchStalls;

export const bulkUpdateStalls = (ids, data) =>
  new Promise((resolve) =>
    setTimeout(() => {
      let updated = 0;
      stalls = stalls.map((s) => {
        if (ids.includes(s.id)) {
          updated++;
          return { ...s, ...data, updated_at: new Date().toISOString() };
        }
        return s;
      });
      resolve({ updated, ids });
    }, 200)
  );

/**
 * Assignment & Details
 */
export const fetchStallsByCurrentTenant = (tenantId) =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(stalls.filter((s) => s.current_tenant === Number(tenantId)).map((s) => ({ ...s }))),
      200
    )
  );

export const fetchStallsByLease = (leaseId) =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(stalls.filter((s) => s.current_lease === Number(leaseId)).map((s) => ({ ...s }))),
      200
    )
  );

export const fetchStallWithLeaseAndTenant = (id) =>
  new Promise((resolve) =>
    setTimeout(() => {
      const found = stalls.find((s) => s.id === Number(id));
      if (!found) return resolve(null);
      // You can add mock nested details here if needed.
      resolve({ ...found });
    }, 150)
  );
