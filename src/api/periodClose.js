import apiClient from "./axios";

const BASE = "/finance/period-close";

export const listPeriodCloses = (params = {}) =>
  apiClient.get(`${BASE}/`, { params }).then((r) => r.data);

export const getPeriodClose = (id) =>
  apiClient.get(`${BASE}/${id}/`).then((r) => r.data);

export const signMarketAdmin = (id) =>
  apiClient.post(`${BASE}/${id}/sign-market-admin/`).then((r) => r.data);

export const signAR = (id) =>
  apiClient.post(`${BASE}/${id}/sign-ar/`).then((r) => r.data);

export const signOwner = (id) =>
  apiClient.post(`${BASE}/${id}/sign-owner/`).then((r) => r.data);

export const reopenPeriod = (id, reason) =>
  apiClient.post(`${BASE}/${id}/reopen/`, { reason }).then((r) => r.data);

export const closePeriodManually = (id) =>
  apiClient.post(`${BASE}/${id}/close-manually/`).then((r) => r.data);

/** Returns the URL for direct PDF download via window.open or anchor href. */
export const periodClosePdfUrl = (id) => `${BASE}/${id}/pdf/`;
