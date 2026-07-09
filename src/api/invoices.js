import apiClient from "./axios";

export async function getInvoices(params = {}) {
  const { data } = await apiClient.get("/finance/invoices/", { params });
  return data;
}

export async function getInvoiceById(id) {
  const { data } = await apiClient.get(`/finance/invoices/${id}/`);
  return data;
}

export async function generateInvoices({ market_code, start_date, end_date, dry_run = false }) {
  const { data } = await apiClient.post("/finance/generate-invoices/", {
    market_code,
    start_date,
    end_date,
    dry_run,
  });
  return data;
}
