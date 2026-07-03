// src/api/notifications.js — Unit 26 / F1.2
// Thin wrapper around GET /api/finance/notifications/ (backend O7).
import apiClient from "./axios";

export async function fetchNotifications() {
  const { data } = await apiClient.get("/finance/notifications/");
  return data; // { count, critical_count, notifications[] }
}
