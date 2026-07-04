// src/api/octalConsole.js — Unit 26 / F1.4
// Platform-admin data for Octal Philippines console.
// fetchMarkets: all markets in the platform (IsAuthenticated).
// getSubscriptionList: all subscriptions + billing accounts joined (is_staff=True).
// getOctalConsoleData: parallel fetch + client-side join — one call for the page.
import apiClient from "./axios";

const normalize = (res) => (Array.isArray(res.data) ? res.data : res.data.results ?? []);

export async function fetchMarkets() {
  const res = await apiClient.get("/markets/");
  return normalize(res);
}

export async function getSubscriptionList() {
  const [subsRes, acctRes] = await Promise.all([
    apiClient.get("/billing/subscriptions/"),
    apiClient.get("/billing/accounts/"),
  ]);
  const accountMap = Object.fromEntries(normalize(acctRes).map((a) => [a.id, a]));
  return normalize(subsRes).map((sub) => ({
    ...sub,
    _account: accountMap[sub.account] ?? null,
  }));
}

// Returns { markets, subscriptionByMarketCode }
// subscriptionByMarketCode[code] = { sub, account } | undefined
export async function getOctalConsoleData() {
  const [markets, subs] = await Promise.all([fetchMarkets(), getSubscriptionList()]);
  const subscriptionByMarketCode = {};
  subs.forEach((sub) => {
    (sub.items || []).forEach((item) => {
      // item.market is StringRelatedField: "Market Name (CODE)"
      const m = String(item.market || "").match(/\(([^)]+)\)$/);
      const code = m ? m[1] : null;
      if (code && !subscriptionByMarketCode[code]) {
        subscriptionByMarketCode[code] = { sub, account: sub._account };
      }
    });
  });
  return { markets, subscriptionByMarketCode };
}

// F1.5 — full subscription detail (company + markets + operators + tenant count).
// Wraps GET /api/billing/subscriptions/:id/detail-full/ — one call, platform-admin scoped.
export async function getSubscriptionDetail(id) {
  const res = await apiClient.get(`/billing/subscriptions/${id}/detail-full/`);
  return res.data;
}
