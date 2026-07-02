import apiClient from "./axios";

/**
 * GET /api/finance/trace-payment/<id>/
 *
 * Returns audit chain dict:
 *   payment, daily_collection_item, daily_collection,
 *   cashier_intake, remittance_item, remittance_batch, in_transit_at
 * Any link that hasn't been created yet is null.
 */
export const tracePayment = (paymentId) =>
  apiClient.get(`/finance/trace-payment/${paymentId}/`).then((r) => r.data);
