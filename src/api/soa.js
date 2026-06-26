import apiClient from "./axios";

export async function generateSOA(tenantId, periodStart, periodEnd) {
  const { data } = await apiClient.post("/finance/statements/generate/", {
    tenant: tenantId,
    period_start: periodStart,
    period_end: periodEnd,
  });
  return data;
}

export async function downloadSOAcsv(statementId) {
  const res = await apiClient.get(`/finance/statements/${statementId}/download/`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SOA_${statementId}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function searchTenants(q) {
  const { data } = await apiClient.get("/finance/tenant-inquiry/", { params: { q } });
  return data.results || [];
}
