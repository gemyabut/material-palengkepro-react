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

export default { getMySubscription, getInvoices, changePlan };
