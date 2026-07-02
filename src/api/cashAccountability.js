import apiClient from "./axios";

/**
 * GET /api/finance/cash-accountability/?market=<id>&period=YYYY-MM
 *
 * Returns:
 *   invariant          — {collected, deposited, approved_deductions, cash_in_transit, variance, invariant_pass}
 *   alerts             — [{severity, kind, message, target_url}]
 *   period_close       — PeriodClose serializer object (or null)
 *   is_locked          — boolean
 *   live_batches_summary     — {posted_count, confirmed_count, ...}
 *   live_deductions_summary  — {pending_count, approved_count, approved_total, overdue_count}
 *   fresh              — boolean (false when CLOSED, values are snapshot)
 */
export const getCashAccountabilityDashboard = ({ market, period }) =>
  apiClient
    .get("/finance/cash-accountability/", { params: { market, period } })
    .then((r) => r.data);
