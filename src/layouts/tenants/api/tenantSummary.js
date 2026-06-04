// src/layouts/tenants/api/tenantSummary.js
// Tenant Dashboard — Tier 1 (roster) data source.
// Counts only (no ₱ — doc 21 §6). Market scope is applied server-side by the caller's role.
import apiClient from "api/axios";

/**
 * Fetch the tenant roster summary (counts only).
 * @param {{period?: "mtd"|"all"|string, market?: string}} opts
 *   period: "mtd" (default) | "all" | ISO date (YYYY-MM-DD) — drives "new this period".
 *   market: optional market code (all-market roles only; otherwise server-scoped).
 * @returns {Promise<object>} { total, by_status[], by_verification[], new_this_period,
 *                              onboarded_but_unleased, data_quality{}, as_of, period, market_scope[] }
 */
export async function getTenantSummary({ period = "mtd", market } = {}) {
  const params = {};
  if (period) params.period = period;
  if (market) params.market = market;
  const res = await apiClient.get("/tenants/summary/", { params });
  return res.data;
}

export default { getTenantSummary };
