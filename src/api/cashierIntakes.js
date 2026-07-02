import apiClient from "./axios";

const BASE = "/market-collections/eod-counts";

export async function listEodCounts(params = {}) {
  const { data } = await apiClient.get(`${BASE}/`, { params });
  return data;
}

export async function getEodCount(id) {
  const { data } = await apiClient.get(`${BASE}/${id}/`);
  return data;
}

export async function submitEodCount(id, payload) {
  const { data } = await apiClient.post(`${BASE}/${id}/submit/`, payload);
  return data;
}

export async function approveEodCount(id, payload) {
  const { data } = await apiClient.post(`${BASE}/${id}/approve/`, payload);
  return data;
}

export async function approveDenominationOverride(id, payload) {
  const { data } = await apiClient.post(`${BASE}/${id}/approve-denomination-override/`, payload);
  return data;
}

export async function downloadTallyPdf(id) {
  return apiClient.get(`${BASE}/${id}/tally-pdf/`, { responseType: "blob" });
}
