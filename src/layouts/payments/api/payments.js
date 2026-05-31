const USE_MOCK = process.env.REACT_APP_USE_MOCK_DATA === "true";

let api;
if (USE_MOCK) {
  api = require("./payments.mock");
} else {
  api = require("./payments.real");
}

export const getPayments        = api.getPayments;
export const getPaymentById     = api.getPaymentById;
export const addPayment         = api.addPayment;
export const updatePayment      = api.updatePayment;
export const deletePayment      = api.deletePayment;
export const getPaymentsSummary = api.getPaymentsSummary;
export const exportPaymentsCSV  = api.exportPaymentsCSV;
export const getPaymentsByLease = api.getPaymentsByLease;
