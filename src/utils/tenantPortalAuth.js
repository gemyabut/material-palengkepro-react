/**
 * Tenant portal session utilities (Unit 15, DEC-042).
 *
 * Uses separate localStorage keys from operator auth to avoid token collisions.
 * Keys: tenant_access_token, tenant_refresh_token, tenant_must_change_password,
 *       tenant_name, tenant_id_code.
 *
 * useIdleAutoLogout: D4 — 5-minute idle auto-logout; resets on any user interaction.
 */
import { useEffect, useRef } from "react";

const KEY_ACCESS        = "tenant_access_token";
const KEY_REFRESH       = "tenant_refresh_token";
const KEY_MUST_CHANGE   = "tenant_must_change_password";
const KEY_TENANT_NAME   = "tenant_name";
const KEY_TENANT_ID     = "tenant_id_code";

export function getTenantToken() {
  return localStorage.getItem(KEY_ACCESS);
}

export function getTenantSession() {
  return {
    access:             localStorage.getItem(KEY_ACCESS),
    refresh:            localStorage.getItem(KEY_REFRESH),
    mustChangePassword: localStorage.getItem(KEY_MUST_CHANGE) === "true",
    tenantName:         localStorage.getItem(KEY_TENANT_NAME) || "",
    tenantIdCode:       localStorage.getItem(KEY_TENANT_ID)   || "",
  };
}

export function setTenantSession({ access, refresh, must_change_password, tenant_name, tenant_id_code }) {
  if (access)          localStorage.setItem(KEY_ACCESS,      access);
  if (refresh)         localStorage.setItem(KEY_REFRESH,     refresh);
  localStorage.setItem(KEY_MUST_CHANGE, must_change_password ? "true" : "false");
  if (tenant_name)     localStorage.setItem(KEY_TENANT_NAME, tenant_name);
  if (tenant_id_code)  localStorage.setItem(KEY_TENANT_ID,   tenant_id_code);
}

export function clearTenantSession() {
  [KEY_ACCESS, KEY_REFRESH, KEY_MUST_CHANGE, KEY_TENANT_NAME, KEY_TENANT_ID].forEach((k) =>
    localStorage.removeItem(k)
  );
}

/**
 * D4: 5-minute idle auto-logout.
 * Resets on mousemove / keydown / touchstart / click.
 * Calls onLogout() (clears session + navigates) when timer fires.
 */
export function useIdleAutoLogout(onLogout, minutes = 5) {
  const timerRef  = useRef(null);
  const logoutRef = useRef(onLogout);
  logoutRef.current = onLogout;

  useEffect(() => {
    const reset = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        clearTenantSession();
        logoutRef.current();
      }, minutes * 60 * 1000);
    };

    const EVENTS = ["mousemove", "keydown", "touchstart", "click"];
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(timerRef.current);
      EVENTS.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [minutes]);
}
