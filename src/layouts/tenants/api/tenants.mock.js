import { sampleTenants } from "../../leases/data/sampleTenants";
import { sampleUsers } from "../../leases/data/sampleUsers";

const clone = (obj) => JSON.parse(JSON.stringify(obj));
let tenants = clone(sampleTenants);

// Utility: returns only id or user string for read-only fields if needed
function withNesting(obj) {
  let user = Array.isArray(sampleUsers) ? sampleUsers.find((u) => u.id === obj.user_account) : null;

  return {
    ...obj,
    user_account: user ? `${user.first_name} ${user.last_name}` : obj.user_account,
    last_modified_by: "Admin User",
  };
}

export const getTenants = async () =>
  new Promise((resolve) => setTimeout(() => resolve(tenants.map(withNesting)), 200));

export const getTenantById = async (id) =>
  new Promise((resolve) => {
    const found = tenants.find((t) => t.id === Number(id));
    setTimeout(() => resolve(found ? withNesting(found) : null), 100);
  });

export const addTenant = async (data) => {
  const newId = tenants.length ? Math.max(...tenants.map((t) => t.id)) + 1 : 1;
  const now = new Date().toISOString();
  const tenant = {
    ...data,
    id: newId,
    date_added: now,
    last_updated: now,
    last_modified_by: "Admin User",
    user_account: data.user_account || null,
    lifetime_payment_total: 0,
    number_of_late_payments: 0,
    lease_duration_average: 0,
  };
  tenants.push(tenant);
  return new Promise((resolve) => setTimeout(() => resolve(withNesting(tenant)), 120));
};

export const updateTenant = async (id, updates) => {
  const idx = tenants.findIndex((t) => t.id === Number(id));
  if (idx === -1) return null;
  tenants[idx] = {
    ...tenants[idx],
    ...updates,
    last_updated: new Date().toISOString(),
    last_modified_by: "Admin User",
  };
  return new Promise((resolve) => setTimeout(() => resolve(withNesting(tenants[idx])), 120));
};

export const deleteTenant = async (id) => {
  const idx = tenants.findIndex((t) => t.id === Number(id));
  if (idx === -1) return null;
  const [removed] = tenants.splice(idx, 1);
  return new Promise((resolve) => setTimeout(() => resolve(withNesting(removed)), 100));
};

// ---- BULK DELETE ----
export const bulkDeleteTenants = async (ids) => {
  const before = tenants.length;
  tenants = tenants.filter((t) => !ids.includes(t.id));
  const deletedCount = before - tenants.length;
  return new Promise((resolve) => setTimeout(() => resolve({ deleted: deletedCount, ids }), 200));
};

// ---- BULK DEACTIVATE ----
export const bulkDeactivateTenants = async (ids) => {
  let updatedCount = 0;
  tenants = tenants.map((t) => {
    if (ids.includes(t.id)) {
      updatedCount += 1;
      return { ...t, status: "inactive", last_updated: new Date().toISOString() };
    }
    return t;
  });
  return new Promise((resolve) =>
    setTimeout(() => resolve({ deactivated: updatedCount, ids }), 200)
  );
};

// ---- IMPORT CSV (stub) ----
export const importTenantsCsv = async (file) => {
  // In real life, parse CSV. Here, just resolve after a delay.
  return new Promise((resolve) =>
    setTimeout(() => resolve({ success: true, message: "CSV import simulated (mock)." }), 800)
  );
};

// ---- EXPORT CSV (stub) ----
export const exportTenantsCsv = async () => {
  // In real life, backend would generate and stream a file.
  // Here, just return a fake CSV string or blob
  const csv =
    "id,full_name,business_name\n" +
    tenants.map((t) => `${t.id},"${t.full_name}","${t.business_name}"`).join("\n");
  return new Promise((resolve) => setTimeout(() => resolve(csv), 400));
};
