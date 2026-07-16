import apiClient from "./axios";

const BATCH_BASE = "/market-collections/remittance-batches";
const DED_BASE = "/market-collections/deductions";

// ---- Nested on batch ----

export const listBatchDeductions = (batchId) =>
  apiClient.get(`${BATCH_BASE}/${batchId}/deductions/`).then((r) => r.data);

export const createDeduction = (batchId, formData) =>
  apiClient
    .post(`${BATCH_BASE}/${batchId}/deductions/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

// ---- Flat deduction endpoints ----

export const getDeduction = (id) => apiClient.get(`${DED_BASE}/${id}/`).then((r) => r.data);

export const updateDeduction = (id, data) =>
  apiClient.patch(`${DED_BASE}/${id}/`, data).then((r) => r.data);

export const deleteDeduction = (id) => apiClient.delete(`${DED_BASE}/${id}/`);

export const approveDeduction = (id) =>
  apiClient.post(`${DED_BASE}/${id}/approve/`).then((r) => r.data);

export const rejectDeduction = (id, rejection_reason) =>
  apiClient.post(`${DED_BASE}/${id}/reject/`, { rejection_reason }).then((r) => r.data);

export const voidDeduction = (id, reason = "") =>
  apiClient.post(`${DED_BASE}/${id}/void/`, { reason }).then((r) => r.data);

// ---- Approval queue ----

export const listPendingDeductions = (marketCode) => {
  const params = marketCode ? { market: marketCode } : {};
  return apiClient.get(`${DED_BASE}/pending/`, { params }).then((r) => r.data);
};

// ---- Unit 52 Stage C — flat list w/ status + date range (batch-independent aware) ----

export const listDeductions = ({ status, market, date_from, date_to } = {}) => {
  const params = {};
  if (status) params.status = status;
  if (market) params.market = market;
  if (date_from) params.date_from = date_from;
  if (date_to) params.date_to = date_to;
  return apiClient.get(`${DED_BASE}/`, { params }).then((r) => r.data);
};
