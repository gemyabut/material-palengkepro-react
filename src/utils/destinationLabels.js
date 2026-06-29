export const DESTINATION_LABELS = {
  BANK: {
    pending:         "Bank — Pending",
    settled:         "Bank — Deposited",
    refField:        "bank_confirmation_ref",
    refLabel:        "Bank Reference #",
    proofLabel:      "Deposit Slip",
    pageTitle:       "Bank Reconciliation",
    destinationName: "Bank",
  },
  LGU_TREASURY: {
    pending:         "LGU Treasury — Pending",
    settled:         "LGU Treasury — Remitted",
    refField:        "lgu_or_number",
    refLabel:        "LGU Official Receipt #",
    proofLabel:      "LGU Receipt",
    pageTitle:       "LGU Remittance",
    destinationName: "LGU Treasury Office",
  },
};

export function destinationLabel(destination_type, key) {
  return DESTINATION_LABELS[destination_type]?.[key] ?? key;
}
