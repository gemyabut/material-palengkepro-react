import apiClient from "./axios";

const BASE = "/market-collections/remittance-batches";

export async function listBatches(params = {}) {
  const { data } = await apiClient.get(`${BASE}/`, { params });
  return data;
}

export async function getBatch(id) {
  const { data } = await apiClient.get(`${BASE}/${id}/`);
  return data;
}

export async function createBatch(payload) {
  const { data } = await apiClient.post(`${BASE}/`, payload);
  return data;
}

export async function markDeposited(id, formData) {
  const { data } = await apiClient.post(`${BASE}/${id}/mark-deposited/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function confirmBatch(id, refValue, refField = "bank_confirmation_ref") {
  const { data } = await apiClient.post(`${BASE}/${id}/confirm/`, { [refField]: refValue });
  return data;
}

export async function getUnbatchedDCs(params = {}) {
  const { data } = await apiClient.get(`${BASE}/unbatched-dcs/`, { params });
  return data;
}
