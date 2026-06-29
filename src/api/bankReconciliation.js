import apiClient from "./axios";

export async function getBankReconciliation({ market_id, period_start, period_end }) {
  const { data } = await apiClient.get("/finance/bank-reconciliation/", {
    params: { market_id, period_start, period_end },
  });
  return data;
}

export const getRemittanceReconciliation = getBankReconciliation;
