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

/**
 * Trigger (or preview) the monthly billing run. Standalone APIView, not a
 * SubscriptionViewSet action — POST /api/billing/bill_month/, NOT
 * /api/billing/subscriptions/bill_month/.
 * companies: array of company codes, or null/undefined to bill everyone.
 */
export const billMonth = ({ month, dryRun = true, companies = null }) =>
  apiClient
    .post("/billing/bill_month/", { month, dry_run: dryRun, companies })
    .then((r) => r.data);

/** Statement of account for a BillingAccount: invoices + payments + running balance. */
export const getAccountSOA = (accountId, start, end) => {
  const params = {};
  if (start) params.start = start;
  if (end) params.end = end;
  return apiClient.get(`/billing/accounts/${accountId}/soa/`, { params }).then((r) => r.data);
};

/** All PriceBook rows (one per LicenseTier). */
export const listPricebook = () =>
  apiClient.get("/billing/pricebook/").then((r) => {
    const d = r.data;
    return Array.isArray(d) ? d : d.results || [];
  });

/**
 * Update a PriceBook row. PK is the numeric `id` (PriceBookSerializer has no
 * custom lookup field — the router uses the default pk, NOT tier).
 */
export const updatePricebook = (id, data) =>
  apiClient.patch(`/billing/pricebook/${id}/`, data).then((r) => r.data);

/** Single invoice, with nested lines (via InvoiceSerializer). */
export const getInvoice = (id) =>
  apiClient.get(`/billing/invoices/${id}/`).then((r) => r.data);

/**
 * All Subscriptions visible to the caller. No server-side filter by account
 * — same "fetch all, filter client-side" pattern as getInvoices/listPayments.
 * Used by invoice-detail to resolve invoice.account -> subscription id for
 * the "back to subscriber" link (SubscriptionSerializer has no reverse
 * account->subscriptions endpoint).
 */
export const listSubscriptions = () =>
  apiClient.get("/billing/subscriptions/").then((r) => {
    const d = r.data;
    return Array.isArray(d) ? d : d.results || [];
  });

/**
 * All ARPayments visible to the caller (platform admin: everyone; company
 * user: their own company only — same scoping as everything else in this
 * app). No server-side filter by invoice yet.
 * TODO(perf): fetch all payments then client-side filter — server-side
 * filterset_fields=['invoice'] on ARPaymentViewSet would be a cleaner
 * Tier 1.5 optimization once payment volume grows past ~1000 rows.
 */
export const listPayments = () =>
  apiClient.get("/billing/payments/").then((r) => {
    const d = r.data;
    return Array.isArray(d) ? d : d.results || [];
  });

export default {
  getMySubscription, getInvoices, changePlan, recordPayment, billMonth, getAccountSOA,
  listPricebook, updatePricebook, getInvoice, listPayments, listSubscriptions,
};
