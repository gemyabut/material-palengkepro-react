// Where a staff member lands after signing in (UAT patch 2026-07-04 role
// routing — shared by the sign-in screen and the temporary-password screen).
export const TEMP_PASSWORD_PATH = "/authentication/change-temporary-password";

// MDU-022: the backend's exact refusal while a staff account is still on the
// temporary password the creator set (users/authentication.py).
export const TEMP_PASSWORD_MESSAGE = "Change your temporary password first.";

export function landingPathForRole(role) {
  if (role === "system_administrator") return "/octal-console"; // Octal platform admin — SaaS ops view
  if (role === "tenant") return "/tenant/login"; // Tenant portal
  return "/dashboard"; // Default: market operator dashboard
}
