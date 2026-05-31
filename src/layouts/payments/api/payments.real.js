import apiClient from "../../../api/axios";

// GET /api/payments/ with optional filter params
export async function getPayments(params = {}) {
  const { data } = await apiClient.get("/payments/", { params });
  return data; // { count, results }
}

// GET /api/payments/{id}/
export async function getPaymentById(id) {
  const { data } = await apiClient.get(`/payments/${id}/`);
  return data;
}

// POST /api/payments/
export async function addPayment(payload) {
  const { data } = await apiClient.post("/payments/", payload);
  return data;
}

// PATCH /api/payments/{id}/
export async function updatePayment(id, updates) {
  const { data } = await apiClient.patch(`/payments/${id}/`, updates);
  return data;
}

// DELETE /api/payments/{id}/
export async function deletePayment(id) {
  await apiClient.delete(`/payments/${id}/`);
  return { id };
}

// GET /api/payments/summary/
export async function getPaymentsSummary() {
  const { data } = await apiClient.get("/payments/summary/");
  return data; // { total_collected, total_pending, total_payments }
}

// GET /api/payments/export/ — returns CSV blob
export async function exportPaymentsCSV(params = {}) {
  const res = await apiClient.get("/payments/export/", { params, responseType: "blob" });
  return res.data;
}

// GET /api/payments/by-lease/{leaseId}/
export async function getPaymentsByLease(leaseId) {
  const { data } = await apiClient.get(`/payments/by-lease/${leaseId}/`);
  return data;
}
