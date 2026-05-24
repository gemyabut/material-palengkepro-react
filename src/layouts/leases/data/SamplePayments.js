// /src/layouts/leases/data/samplePayments.js

export const samplePayments = [
  // Example records. Expand or auto-generate for 50+
  {
    id: 1,
    lease_id: 401,
    tenant_id: 201,
    stall_id: 301,
    amount: 5000,
    date_paid: "2025-01-10",
    due_date: "2025-01-10",
    status: "paid",
    payment_method: "cash",
    reference_number: "PMT-001",
  },
  {
    id: 2,
    lease_id: 401,
    tenant_id: 201,
    stall_id: 301,
    amount: 5000,
    date_paid: "",
    due_date: "2025-02-10",
    status: "overdue",
    payment_method: "",
    reference_number: "",
  },
  // ...repeat for other leases and dates (generate with a script for real use)
];
