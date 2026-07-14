import apiClient from "./axios";

// Unit 21.5 F1a endpoints. NOTE: CashierIntakeViewSet is registered at
// eod-counts (market_collections/api/urls.py), not cashier-intake — mirrors
// the existing base in api/cashierIntakes.js.
const INTAKE_BASE = "/market-collections/eod-counts";
const PAYMENT_BASE = "/payments";

export async function verifyCashCount(intakeId) {
  const { data } = await apiClient.post(`${INTAKE_BASE}/${intakeId}/verify-cash/`);
  return data;
}

// F1a Commit A dropped the standalone approve-and-advance endpoint — the
// existing approve/ action already sets ar_reviewed + advances the intake.
export async function approveAndAdvance(intakeId, payload = {}) {
  const { data } = await apiClient.post(`${INTAKE_BASE}/${intakeId}/approve/`, payload);
  return data;
}

export async function flagPayment(paymentId, { reason, note = "" }) {
  const { data } = await apiClient.post(`${PAYMENT_BASE}/${paymentId}/flag/`, { reason, note });
  return data;
}

export async function unflagPayment(paymentId) {
  const { data } = await apiClient.post(`${PAYMENT_BASE}/${paymentId}/unflag/`);
  return data;
}

export async function correctPayment(paymentId, payload) {
  const { data } = await apiClient.patch(`${PAYMENT_BASE}/${paymentId}/correct/`, payload);
  return data;
}
