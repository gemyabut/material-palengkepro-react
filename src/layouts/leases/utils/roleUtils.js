import { debugLog } from "../../stalls/utils/debug";

const ADMIN_ROLES = [
  "market_administrator",
  "admin_staff",
  "market_manager",
  "leasing_officer",
  "finance_head",
  "executive",
];
const COLLECTOR_ROLES = ["collector"];
const TENANT_ROLES = ["tenant"];
const GUEST_ROLES = ["guest"];

function getRoleString(input) {
  const roleStr =
    typeof input === "object"
      ? input?.role?.toLowerCase?.() || ""
      : typeof input === "string"
      ? input.toLowerCase()
      : "";
  debugLog("[roleUtils] normalized role input:", roleStr || "(invalid)");
  return roleStr;
}

// Role check helpers
export const isAdmin = (input) => {
  const role = getRoleString(input);
  return ADMIN_ROLES.includes(role);
};

export const isTenant = (input) => {
  const role = getRoleString(input);
  return TENANT_ROLES.includes(role);
};

export const isCollector = (input) => {
  const role = getRoleString(input);
  return COLLECTOR_ROLES.includes(role);
};

export const isGuest = (input) => {
  const role = getRoleString(input);
  return GUEST_ROLES.includes(role);
};

// Permissions based on role
export const canEditLease = (input) => {
  const role = getRoleString(input);
  return isAdmin(role) || isCollector(role);
};

export const canViewAllLeases = (input) => {
  const role = getRoleString(input);
  return isAdmin(role) || isCollector(role);
};

export const canViewOwnLeases = (input) => {
  const role = getRoleString(input);
  return isTenant(role);
};

export const canExportLeases = (input) => {
  const role = getRoleString(input);
  return isAdmin(role);
};

// Permissions requiring full user (but still supports string)
export const canBulk = (input) => {
  const role = getRoleString(input);
  return ["market_administrator", "admin_staff", "leasing_officer", "market_manager"].includes(role);
};

export const canEdit = (input) => {
  const role = getRoleString(input);
  return ["market_administrator", "admin_staff", "leasing_officer", "market_manager"].includes(role);
};

export const isMarketMaster = (input) => {
  const role = getRoleString(input);
  return role === "market_master";
};

export const isLeasingOfficer = (input) => {
  const role = getRoleString(input);
  return role === "leasing_officer";
};

export const isCashier = (input) => {
  const role = getRoleString(input);
  return role === "cashier";
};

// Optional: export all role sets
export { ADMIN_ROLES, COLLECTOR_ROLES, TENANT_ROLES, GUEST_ROLES };
