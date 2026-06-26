import apiClient from "./axios";

export async function getAgingReport(asOf) {
  const params = {};
  if (asOf) params.as_of = asOf;
  const { data } = await apiClient.get("/finance/aging/", { params });
  return data;
}
