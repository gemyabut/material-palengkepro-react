import apiClient from "./axios";

export async function getCashPosition(marketCode) {
  const params = {};
  if (marketCode) params.market = marketCode;
  const { data } = await apiClient.get("/finance/cash-position/", { params });
  return data;
}
