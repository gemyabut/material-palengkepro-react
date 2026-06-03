import apiClient from "api/axios";

const params = (market, extra = {}) => ({ params: { ...(market ? { market } : {}), ...extra } });

export const getAging = (market) =>
  apiClient.get("/finance/aging/", params(market)).then((r) => r.data);
export const getCollections = (market, period) =>
  apiClient.get("/finance/collection-report/", params(market, { period })).then((r) => r.data);
export const getDelinquent = (market) =>
  apiClient.get("/finance/delinquent-tenants/", params(market)).then((r) => r.data);
export const getOccupancy = (market) =>
  apiClient.get("/stalls/occupancy-report/", params(market)).then((r) => r.data);
export const getExpiration = (market, days = 365) =>
  apiClient.get("/leases/expiration-report/", params(market, { days })).then((r) => r.data);

export const searchTenants = (q, market) =>
  apiClient.get("/finance/tenant-inquiry/", params(market, { q })).then((r) => r.data);
export const getTenantInquiry = (tenant, market) =>
  apiClient.get("/finance/tenant-inquiry/", params(market, { tenant })).then((r) => r.data);

export const generateSOA = (tenant, periodStart, periodEnd) =>
  apiClient
    .post("/finance/statements/generate/", {
      tenant,
      period_start: periodStart,
      period_end: periodEnd,
    })
    .then((r) => r.data);

export const downloadSOA = async (id) => {
  const res = await apiClient.get(`/finance/statements/${id}/download/`, { responseType: "blob" });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SOA_${id}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export default {
  getAging,
  getCollections,
  getDelinquent,
  getOccupancy,
  getExpiration,
  searchTenants,
  getTenantInquiry,
  generateSOA,
  downloadSOA,
};
