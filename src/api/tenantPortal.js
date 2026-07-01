/**
 * Tenant portal API client (Unit 15, DEC-042).
 *
 * Uses raw fetch (not the operator axios instance) so tenant tokens
 * never bleed into operator request headers.
 *
 * All authenticated calls attach the tenant_access_token from localStorage.
 */
const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

function authHeaders() {
  const token = localStorage.getItem("tenant_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}/tenant${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.detail || body.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function apiFetchBlob(path) {
  const res = await fetch(`${BASE}/tenant${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { blob: await res.blob(), headers: res.headers };
}

function soaQs(periodStart, periodEnd) {
  if (!periodStart) return "";
  return `?period_start=${encodeURIComponent(periodStart)}&period_end=${encodeURIComponent(periodEnd)}`;
}

export const tenantPortalApi = {
  /** D3 login: POST {identifier, password} → {access, refresh, must_change_password, tenant_name, tenant_id_code} */
  login: (identifier, password) =>
    apiFetch("/auth/login/", { method: "POST", body: JSON.stringify({ identifier, password }) }),

  /** D3 change-password: clears must_change_password on success */
  changePassword: (old_password, new_password, confirm_password) =>
    apiFetch("/auth/change-password/", {
      method: "POST",
      body: JSON.stringify({ old_password, new_password, confirm_password }),
    }),

  dashboard: () => apiFetch("/dashboard/"),

  /** D5: default last 12 months if no params */
  soa: (periodStart, periodEnd) => apiFetch(`/soa/${soaQs(periodStart, periodEnd)}`),

  /** D6: SOA PDF download */
  soaPdf: (periodStart, periodEnd) => apiFetchBlob(`/soa/pdf/${soaQs(periodStart, periodEnd)}`),

  payments: (page = 1, pageSize = 20) =>
    apiFetch(`/payments/?page=${page}&page_size=${pageSize}`),

  /** D6: per-payment receipt PDF */
  paymentReceiptPdf: (paymentId) => apiFetchBlob(`/payments/${paymentId}/receipt/`),
};

/** Trigger browser download from a blob response */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
