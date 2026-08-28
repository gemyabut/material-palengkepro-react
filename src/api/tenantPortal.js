/**
 * Tenant portal API client (Unit 15, DEC-042).
 *
 * Uses raw fetch (not the operator axios instance) so tenant tokens
 * never bleed into operator request headers.
 *
 * All authenticated calls attach the tenant_access_token from localStorage.
 */
const BASE =
  process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000/api`;

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

// No Content-Type here — the browser sets multipart/form-data with the
// correct boundary itself when body is a FormData instance. apiFetch's
// hardcoded "application/json" header would corrupt a multipart request.
async function apiFetchMultipart(path, { method = "POST", body } = {}) {
  const res = await fetch(`${BASE}/tenant${path}`, { method, body, headers: authHeaders() });
  if (!res.ok) {
    const respBody = await res.json().catch(() => ({}));
    const err = new Error(respBody.detail || respBody.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
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

  /** Task #115 item 4: first active market_administrator's contact info */
  marketAdminContact: () => apiFetch("/market-admin-contact/"),

  /** D5: default last 12 months if no params */
  soa: (periodStart, periodEnd) => apiFetch(`/soa/${soaQs(periodStart, periodEnd)}`),

  /** D6: SOA PDF download */
  soaPdf: (periodStart, periodEnd) => apiFetchBlob(`/soa/pdf/${soaQs(periodStart, periodEnd)}`),

  /** Task #115 item 7: single invoice detail — lines + payment applications */
  invoiceDetail: (invoiceId) => apiFetch(`/invoices/${invoiceId}/`),

  /** Task #115 item 5: current document-on-file status (pre-capture display) */
  documentStatus: () => apiFetch("/document-upload/"),

  /** Task #115 item 5: tenant uploads/replaces their own document (kiosk camera capture) */
  uploadDocument: (file) => {
    const form = new FormData();
    form.append("uploaded_documents", file);
    return apiFetchMultipart("/document-upload/", { method: "PATCH", body: form });
  },

  /** Task #115 item 5 extension: current photograph-on-file status (pre-capture display) */
  photographStatus: () => apiFetch("/photograph-upload/"),

  /** Task #115 item 5 extension: tenant uploads/replaces their own photograph (kiosk camera capture) */
  uploadPhotograph: (file) => {
    const form = new FormData();
    form.append("photograph", file);
    return apiFetchMultipart("/photograph-upload/", { method: "PATCH", body: form });
  },

  /** PR 4 (ID Card feature, PR #100): current contact-person photo status (pre-capture display) */
  contactPhotographStatus: () => apiFetch("/contact-photograph-upload/"),

  /** PR 4: tenant uploads/replaces their contact person's photograph (kiosk camera capture).
   *  Does NOT reset verification_status -- that reset is specific to the tenant's own
   *  identity photo (uploadPhotograph above), per PR #100 discipline. */
  uploadContactPhotograph: (file) => {
    const form = new FormData();
    form.append("contact_person_photograph", file);
    return apiFetchMultipart("/contact-photograph-upload/", { method: "PATCH", body: form });
  },

  /** Task #115 item 2: emails the SOA PDF to the tenant's email_address on file */
  emailSoaPdf: (periodStart, periodEnd) =>
    apiFetch(`/soa/pdf/email/${soaQs(periodStart, periodEnd)}`, { method: "POST" }),

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
