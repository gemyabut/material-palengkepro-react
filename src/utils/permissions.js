/**
 * Canonical Tier-1 RBAC capability map (doc 21 §5/§11).
 * Single source of truth for what the React layer shows. The SERVER is the real
 * boundary (doc 21 §9) — these helpers only govern UI visibility/affordances.
 *
 * `admin_staff` is kept as a working alias for `market_administrator`.
 */

// Role classes
const MARKET_ADMIN = ["market_administrator", "admin_staff"];
const OPERATORS = [...MARKET_ADMIN, "market_manager", "leasing_officer"];
export const ALL_MARKET_ROLES = ["system_administrator", "market_administrator", "executive"];

export function normalizeRole(input) {
  if (!input) return "";
  const r = typeof input === "object" ? input?.role : input;
  return (r || "").toString().toLowerCase();
}

const has = (role, list) => list.includes(normalizeRole(role));

// ---- Domain VIEW (doc 21 §5) ----
export const canViewTenants = (r) => has(r, [...OPERATORS, "accounts_receivable"]);
export const canViewStalls = (r) => has(r, OPERATORS);
export const canViewLeases = (r) => has(r, [...OPERATORS, "accounts_receivable"]);
export const canViewPayments = (r) =>
  has(r, [...MARKET_ADMIN, "market_manager", "accounts_receivable", "accounting_staff", "cashier", "collector", "executive"]);

// Upload Center access (doc 21 §5 UPLOAD roles; matches backend UPLOAD_ROLES).
export const canUpload = (r) =>
  has(r, ["market_administrator", "admin_staff", "leasing_officer", "accounts_receivable", "accounting_staff"]);

// Per-domain upload stewardship (doc 21 §5): master data (tenant/stall/lease) is the
// leasing side; payments/collections are the finance side. Market admins do all.
const DOMAIN_UPLOAD_ROLES = {
  tenant: [...MARKET_ADMIN, "leasing_officer"],
  stall: [...MARKET_ADMIN, "leasing_officer"],
  lease: [...MARKET_ADMIN, "leasing_officer"],
  payment: [...MARKET_ADMIN, "accounts_receivable", "accounting_staff"],
  receipt_book: [...MARKET_ADMIN, "accounts_receivable", "accounting_staff"],
  deposit_slip: [...MARKET_ADMIN, "accounts_receivable", "accounting_staff"],
};
export const UPLOAD_DOMAINS = [
  "tenant",
  "stall",
  "lease",
  "payment",
  "receipt_book",
  "deposit_slip",
];
export const canUploadDomain = (r, domain) => has(r, DOMAIN_UPLOAD_ROLES[domain] || []);
export const uploadableDomains = (r) => UPLOAD_DOMAINS.filter((d) => canUploadDomain(r, d));

// ---- Domain WRITE / actions ----
export const canEditTenant = (r) => has(r, [...MARKET_ADMIN, "leasing_officer"]);
export const canAddStall = (r) => has(r, [...MARKET_ADMIN, "market_manager", "leasing_officer"]);
export const canEditStall = (r) => has(r, [...MARKET_ADMIN, "market_manager", "leasing_officer"]);
export const canDeleteStall = (r) => has(r, [...MARKET_ADMIN, "market_manager"]); // delete stays tighter
export const canEditLease = (r) => has(r, [...MARKET_ADMIN, "market_manager", "leasing_officer"]);

// ---- Reports & Tenant Inquiry (doc 21 §6) ----
// Finance reports (SOA / aging / collections / delinquent) — sees ₱ balances.
export const canViewReports = (r) =>
  has(r, [...MARKET_ADMIN, "market_manager", "finance_head", "accounts_receivable", "accounting_staff", "executive"]);
// Tenant Inquiry is broader: finance roles + leasing officer (latter sees tenant+lease only).
export const canUseInquiry = (r) => canViewReports(r) || has(r, ["leasing_officer"]);

// AR Invoices — same finance roles (doc 21 §11 + D3-A approved 2026-06-26).
export const canViewInvoices = (r) => canViewReports(r);

// SOA Report page — same finance roles (Phase 4 Unit 3, D3-A).
export const canViewSoa = (r) => canViewReports(r);

// Aging Dashboard — same finance roles (Phase 4 Unit 4, D1-A).
export const canViewAging = (r) => canViewReports(r);

/**
 * Cash Position Dashboard — finance roles + cashier + collector (D5-A, Phase 4 Unit 5).
 * Cashier needs operational visibility to verify their intake was credited.
 * Collector is forward-prep for mobile API; web dashboard access is blocked by role
 * gate checks (quirks #21/#24) — backend scopes COLLECTOR_POCKET to own account.
 */
export const canViewCash = (r) => canViewReports(r) || has(r, ["cashier", "collector"]);

/**
 * Deposit Batch workflow (D5-A, Phase 4 Unit 6).
 * canViewBatches / canEditBatches: finance roles + cashier.
 * canConfirmBatches: finance roles only — cashier excluded (separation of duties).
 */
export const canViewBatches  = (r) => canViewReports(r) || has(r, ["cashier"]);
export const canEditBatches  = (r) => canViewBatches(r);
export const canConfirmBatches = (r) => canViewReports(r);

// Subscription & Billing self-service — the company's Market Administrator (doc: SUB-3).
export const canManageSubscription = (r) => has(r, [...MARKET_ADMIN, "finance_head"]);

// Onboarding & staff provisioning (IAM-2).
export const canOnboard = (r) => has(r, ["system_administrator"]); // platform-admin onboards companies
export const canManageStaff = (r) => has(r, [...MARKET_ADMIN, "system_administrator"]); // market admin adds staff

// ---- Role-class helpers ----
export const isMarketAdmin = (r) => has(r, MARKET_ADMIN);
export const isAllMarket = (r) => has(r, ALL_MARKET_ROLES);
// "admin-like" = sees the master/admin views & dashboards (operators + finance + executive)
export const isAdminLike = (r) => has(r, [...OPERATORS, "finance_head", "executive"]);
export const isTenant = (r) => normalizeRole(r) === "tenant";
export const isCollector = (r) => normalizeRole(r) === "collector";

// Sensitive: raw ₱ amounts (doc 21 §6) — Executive & Market Manager get aggregates only.
export const canSeeRawAmounts = (r) =>
  has(r, [...MARKET_ADMIN, "accounts_receivable", "accounting_staff", "cashier"]);

/**
 * EOD Cash Count workflow (D5-A, Phase 4 Unit 7).
 * canViewEodCounts: finance roles + cashier + collector (same as canViewCash).
 * canApproveEodCounts: finance roles only — cashier/collector excluded (separation of duties).
 */
export const canViewEodCounts   = (r) => canViewReports(r) || has(r, ["cashier", "collector"]);
export const canApproveEodCounts = (r) => canViewReports(r);

/**
 * Bank Reconciliation Report (D1-A, Phase 4 Unit 8).
 * Finance roles only — mirrors IsFinanceViewer on the backend.
 * Cashier/collector excluded (this is an AR/Finance tool, not an ops screen).
 */
export const canViewBankRec = (r) => canViewReports(r);
