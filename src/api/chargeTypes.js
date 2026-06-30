import apiClient from "./axios";

export const listChargeTypes  = (params = {}) =>
  apiClient.get("/finance/charge-types/", { params }).then((r) => r.data);

export const getChargeType    = (id) =>
  apiClient.get(`/finance/charge-types/${id}/`).then((r) => r.data);

export const createChargeType = (data) =>
  apiClient.post("/finance/charge-types/", data).then((r) => r.data);

export const updateChargeType = (id, data) =>
  apiClient.patch(`/finance/charge-types/${id}/`, data).then((r) => r.data);

export const deleteChargeType = (id) =>
  apiClient.delete(`/finance/charge-types/${id}/`).then((r) => r.data);

export const deactivateChargeType = (id) =>
  apiClient.post(`/finance/charge-types/${id}/deactivate/`).then((r) => r.data);
