// src/api/octalConsole.js — Unit 26 / F1.3
// Platform-admin subscription list for Octal Philippines console.
// Requires is_staff=True; SubscriptionViewSet.get_queryset returns all companies.
//
// NOTE: SubscriptionSerializer.fields does not expose `status` (billing/serializers.py).
//       The status field will be undefined until a backend serializer update adds it.
//       All other fields (tier, start_date, seats_cap, items) are available.
import apiClient from "./axios";

const normalize = (res) => (Array.isArray(res.data) ? res.data : res.data.results ?? []);

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
