import apiClient from "api/axios";

/** Current owner's plan, status, entitlements, and usage (one call). */
export const getMySubscription = () => apiClient.get("/billing/me/").then((r) => r.data);

/** Company-scoped invoices (DRF paginated -> normalize to an array). */
export const getInvoices = () =>
  apiClient.get("/billing/invoices/").then((r) => {
    const d = r.data;
    return Array.isArray(d) ? d : d.results || [];
  });

/** Upgrade/downgrade the subscription's plan (immediate, prorated — SUB-4). */
export const changePlan = (subId, tier) =>
  apiClient.post(`/billing/subscriptions/${subId}/change_plan/`, { tier }).then((r) => r.data);

/**
 * Record an AR payment against an invoice.
 * ARPaymentSerializer has no `invoice` PK field — it's `invoice_number`, a
 * SlugRelatedField that looks up Invoice.objects.get(number=...). Sending
 * `invoice` (numeric id) instead silently no-ops (DRF drops unrecognized
 * fields) and orphans the payment. `ref_no` is the model's field name, not
 * "reference". `account` is server-set (perform_create) — never send it.
 */
export const recordPayment = ({ invoiceNumber, amount, method, refNo, notes }) =>
  apiClient
    .post("/billing/payments/", {
      invoice_number: invoiceNumber,
      amount,
      method,
      ref_no: refNo,
      notes,
    })
    .then((r) => r.data);

export default { getMySubscription, getInvoices, changePlan, recordPayment };
