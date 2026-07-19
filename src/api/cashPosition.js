import apiClient from "./axios";

export async function getCashPosition(marketCode, date) {
  const params = {};
  if (marketCode) params.market = marketCode;
  if (date) params.date = date;
  const { data } = await apiClient.get("/finance/cash-position/", { params });
  return data;
}
