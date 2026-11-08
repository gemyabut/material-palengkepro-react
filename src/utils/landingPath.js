import { WEB_OPERATOR_ROLES } from "constants/roles";

// Where a staff member lands after signing in (UAT patch 2026-07-04 role
// routing — shared by the sign-in screen and the temporary-password screen).
export const TEMP_PASSWORD_PATH = "/authentication/change-temporary-password";

// MDU-022: the backend's exact refusal while a staff account is still on the
// temporary password the creator set (users/authentication.py).
export const TEMP_PASSWORD_MESSAGE = "Change your temporary password first.";

export function landingPathForRole(role) {
  if (role === "system_administrator") return "/octal-console"; // Octal platform admin — SaaS ops view
  if (role === "tenant") return "/tenant/login"; // Tenant portal
  // The dashboard API refuses these two, so they land on a screen they can use.
  if (role === "collector") return "/cash-position"; // their own cash only
  if (role === "accounting_staff") return "/deposit-batches";
  return "/dashboard"; // Default: market operator dashboard
}

export const NO_WEB_ACCESS_MESSAGE =
  "Your account doesn't have access to the web app yet. Please ask your administrator.";

// A signed-in staff role with no web screens gets this message on the sign-in
// page instead of a silent bounce. Tenants have their own portal; platform
// admins (is_staff) are never blocked.
export function hasWebAccess(role, isStaff) {
  if (isStaff) return true;
  if (role === "tenant") return true; // sent to /tenant/login
  return WEB_OPERATOR_ROLES.includes(role);
}
