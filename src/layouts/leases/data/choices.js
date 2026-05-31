// /src/layouts/leases/data/choices.js

export const LEASE_STATUS_CHOICES = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "terminated", label: "Terminated" },
  { value: "expired", label: "Expired" },
  { value: "renewal", label: "For Renewal" },
  { value: "draft", label: "Draft" },
];

export const LEASE_TYPE_CHOICES = [
  { value: "stall_lease", label: "Stall Lease" },
  { value: "sunday_tiangge", label: "Sunday Tiangge" },
  { value: "night_food_market", label: "Night Food Market" },
];

export const PAYMENT_STATUS_CHOICES = [
  { value: "up_to_date", label: "Up to Date" },
  { value: "overdue", label: "Overdue" },
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partially Paid" },
  { value: "none", label: "Unpaid" },
];

export const PAYMENT_TERMS_CHOICES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
  { value: "one_time", label: "One-Time" },
];

export const SORT_CHOICES = [
  { value: "created_at_desc", label: "Newest First" },
  { value: "created_at_asc", label: "Oldest First" },
  { value: "lease_amount_desc", label: "Highest Amount" },
  { value: "lease_amount_asc", label: "Lowest Amount" },
  { value: "status", label: "Status" },
  { value: "lease_type", label: "Lease Type" },
];

export const LEASE_FREQUENCY_CHOICES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

// Add more as needed, e.g. TENANT_STATUS_CHOICES, USER_ROLE_CHOICES...
