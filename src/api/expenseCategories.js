import apiClient from "./axios";

export const listExpenseCategories  = (params = {}) =>
  apiClient.get("/finance/expense-categories/", { params }).then((r) => r.data);

export const getExpenseCategory    = (id) =>
  apiClient.get(`/finance/expense-categories/${id}/`).then((r) => r.data);

export const createExpenseCategory = (data) =>
  apiClient.post("/finance/expense-categories/", data).then((r) => r.data);

export const updateExpenseCategory = (id, data) =>
  apiClient.patch(`/finance/expense-categories/${id}/`, data).then((r) => r.data);

export const deleteExpenseCategory = (id) =>
  apiClient.delete(`/finance/expense-categories/${id}/`).then((r) => r.data);

export const deactivateExpenseCategory = (id) =>
  apiClient.post(`/finance/expense-categories/${id}/deactivate/`).then((r) => r.data);
