import { sampleLeases } from "../data/sampleLeases";
import { sampleTenants } from "../data/sampleTenants";
import { sampleStalls } from "../data/sampleStalls";
import { debugLog } from "../../stalls/utils/debug"; // Adjust relative path as needed

const clone = (obj) => JSON.parse(JSON.stringify(obj));
let leases = clone(sampleLeases);

function withNested(obj) {
  const tenant = sampleTenants.find((t) => t.id === obj.tenant_id);
  const stall = sampleStalls.find((s) => s.id === obj.stall_id);
  return {
    ...obj,
    tenant: tenant ? clone(tenant) : null,
    stall: stall ? clone(stall) : null,
  };
}

export const getLeases = async () => {
  debugLog("[leases.mock.js] getLeases called");
  return new Promise((resolve) => setTimeout(() => resolve(leases.map(withNested)), 200));
};

export const getLeaseById = async (id) => {
  debugLog("[leases.mock.js] getLeaseById called", id);
  const found = leases.find((l) => l.id === Number(id));
  return new Promise((resolve) => setTimeout(() => resolve(found ? withNested(found) : null), 100));
};

export const addLease = async (data) => {
  debugLog("[leases.mock.js] addLease called", data);
  const newId = leases.length ? Math.max(...leases.map((l) => l.id)) + 1 : 1;
  const lease = {
    ...data,
    id: newId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  leases.push(lease);
  return new Promise((resolve) => setTimeout(() => resolve(withNested(lease)), 120));
};

export const updateLease = async (id, updates) => {
  debugLog("[leases.mock.js] updateLease called", id, updates);
  const idx = leases.findIndex((l) => l.id === Number(id));
  if (idx === -1) return null;
  leases[idx] = { ...leases[idx], ...updates, updated_at: new Date().toISOString() };
  return new Promise((resolve) => setTimeout(() => resolve(withNested(leases[idx])), 120));
};

export const deleteLease = async (id) => {
  debugLog("[leases.mock.js] deleteLease called", id);
  const idx = leases.findIndex((l) => l.id === Number(id));
  if (idx === -1) return null;
  const [removed] = leases.splice(idx, 1);
  return new Promise((resolve) => setTimeout(() => resolve(withNested(removed)), 100));
};
export const fetchActiveLeases = async () => {
  debugLog("[leases.mock.js] fetchActiveLeases called");
  return new Promise((resolve) =>
    setTimeout(() => resolve(leases.filter((l) => l.status === "ACTIVE").map(withNested)), 200)
  );
};
export const fetchInactiveLeases = async () => {
  debugLog("[leases.mock.js] fetchInactiveLeases called");
  return new Promise((resolve) =>
    setTimeout(() => resolve(leases.filter((l) => l.status === "INACTIVE").map(withNested)), 200)
  );
};
export const fetchExpiredLeases = async () => {
  debugLog("[leases.mock.js] fetchExpiredLeases called");
  return new Promise((resolve) =>
    setTimeout(() => resolve(leases.filter((l) => l.status === "EXPIRED").map(withNested)), 200)
  );
};
export const fetchLeasesByTenant = async (tenantId) => {
  debugLog("[leases.mock.js] fetchLeasesByTenant called", tenantId);
  return new Promise((resolve) =>
    setTimeout(() => resolve(leases.filter((l) => l.tenant_id === tenantId).map(withNested)), 200)
  );
};
export const fetchLeasesByStall = async (stallId) => {
  debugLog("[leases.mock.js] fetchLeasesByStall called", stallId);
  return new Promise((resolve) =>
    setTimeout(() => resolve(leases.filter((l) => l.stall_id === stallId).map(withNested)), 200)
  );
};
