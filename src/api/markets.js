import apiClient from "./axios";

export async function getMarket(id) {
  const { data } = await apiClient.get(`/markets/${id}/`);
  return data;
}

// Unit 52 — resolves a typed market code to its PK for EXEC's editable
// market field on Request Cash Expense (the create serializer needs an id,
// not a code). Backend MarketViewSet.search_fields includes "code".
export async function searchMarkets(query) {
  const { data } = await apiClient.get("/markets/", { params: { search: query } });
  return Array.isArray(data) ? data : data.results || [];
}
