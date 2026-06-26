import apiClient from "./axios";

export async function getInvoices(params = {}) {
  const { data } = await apiClient.get("/finance/invoices/", { params });
  return data;
}

export async function getInvoiceById(id) {
  const { data } = await apiClient.get(`/finance/invoices/${id}/`);
  return data;
}
