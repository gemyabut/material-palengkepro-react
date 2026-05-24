// src/layouts/leases/utils/roleUtils.js

import { debugLog } from "../../stalls/utils/debug";

const ADMIN_ROLES = ["admin_staff", "market_manager", "leasing_officer", "finance_head"];
const COLLECTOR_ROLES = ["collector"];
const TENANT_ROLES = ["tenant"];
const GUEST_ROLES = ["guest"];

// Role check helpers (always log)
export const isAdmin = (role) => {
  debugLog("[roleUtils] isAdmin called", role);
  return ADMIN_ROLES.includes((role || "").toLowerCase());
};
export const isTenant = (role) => {
  debugLog("[roleUtils] isTenant called", role);
  return TENANT_ROLES.includes((role || "").toLowerCase());
};
export const isCollector = (role) => {
  debugLog("[roleUtils] isCollector called", role);
  return COLLECTOR_ROLES.includes((role || "").toLowerCase());
};
export const isGuest = (role) => {
  debugLog("[roleUtils] isGuest called", role);
  return GUEST_ROLES.includes((role || "").toLowerCase());
};

export const canEditLease = (role) => {
  debugLog("[roleUtils] canEditLease called", role);
  return isAdmin(role) || isCollector(role);
};
export const canViewAllLeases = (role) => {
  debugLog("[roleUtils] canViewAllLeases called", role);
  return isAdmin(role) || isCollector(role);
};
export const canViewOwnLeases = (role) => {
  debugLog("[roleUtils] canViewOwnLeases called", role);
  return isTenant(role);
};
export const canExportLeases = (role) => {
  debugLog("[roleUtils] canExportLeases called", role);
  return isAdmin(role);
};

export function canBulk(user) {
  debugLog("[roleUtils] canBulk called", role);
  return user?.role && ["admin", "leasing_officer", "market_master"].includes(user.role);
}
export function canEdit(user) {
  debugLog("[roleUtils] canEdit called", user);
  return user?.role && ["admin", "leasing_officer", "market_master"].includes(user.role);
}
export function isMarketMaster(user) {
  return user?.role === "market_master";
}

export function isLeasingOfficer(user) {
  return user?.role === "leasing_officer";
}

export function isCashier(user) {
  return user?.role === "cashier";
}

// Optionally export roles if needed for UI, etc.
export { ADMIN_ROLES, COLLECTOR_ROLES, TENANT_ROLES, GUEST_ROLES };
