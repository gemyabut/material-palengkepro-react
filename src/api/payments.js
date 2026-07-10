import apiClient from "./axios";

export async function retryUnappliedPayments({ market_code, start_date, end_date, dry_run = false }) {
  const { data } = await apiClient.post("/finance/retry-unapplied-payments/", {
    market_code,
    start_date,
    end_date,
    dry_run,
  });
  return data;
}
