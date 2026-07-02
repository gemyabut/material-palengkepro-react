import apiClient from "./axios";

const BASE = "/market-collections/daily-verification";

export async function getDailyVerification(market, date) {
  const { data } = await apiClient.get(`${BASE}/`, { params: { market, date } });
  return data;
}

export async function downloadDailyVerificationPdf(market, date) {
  return apiClient.get(`${BASE}/pdf/`, { params: { market, date }, responseType: "blob" });
}
