import apiClient from "./axios";

export const listMarketUsers = (params = {}) =>
  apiClient.get("/users/list-by-market/", { params }).then((r) => r.data);

// MDU-023 row actions (Owner / Market Administrator / platform admin). Every
// call returns the refreshed details payload; errors carry { detail }.
export const getMarketUser = (id) =>
  apiClient.get(`/users/market-users/${id}/`).then((r) => r.data);

/** Name, email and mobile only — role and market can't be changed here. */
export const updateMarketUser = (id, data) =>
  apiClient.patch(`/users/market-users/${id}/`, data).then((r) => r.data);

export const resetMarketUserPassword = (id, temporary_password) =>
  apiClient
    .post(`/users/market-users/${id}/reset-password/`, { temporary_password })
    .then((r) => r.data);

export const deactivateMarketUser = (id) =>
  apiClient.post(`/users/market-users/${id}/deactivate/`).then((r) => r.data);

export const reactivateMarketUser = (id) =>
  apiClient.post(`/users/market-users/${id}/reactivate/`).then((r) => r.data);

/** What the Deactivate dialog shows first: { blockers: [...], review: { payments, deductions, *_more } }. */
export const checkMarketUserDeactivation = (id) =>
  apiClient.get(`/users/market-users/${id}/deactivation-check/`).then((r) => r.data);
