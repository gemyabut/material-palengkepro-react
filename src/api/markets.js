import apiClient from "./axios";

export async function getMarket(id) {
  const { data } = await apiClient.get(`/markets/${id}/`);
  return data;
}
