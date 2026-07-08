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
  has(r, [
    ...MARKET_ADMIN,
    "market_manager",
    "accounts_receivable",
    "accounting_staff",
    "cashier",
    "collector",
    "executive",
  ]);

// Unit 27 F3: Upload Center retired — canUpload/uploadableDomains removed.
// The Spreadsheet Upload UI uses canUseSpreadsheetUpload/spreadsheetUploadDomains below.

// ---- Domain WRITE / actions ----
export const canEditTenant = (r) => has(r, [...MARKET_ADMIN, "leasing_officer"]);
export const canAddStall = (r) => has(r, [...MARKET_ADMIN, "market_manager", "leasing_officer"]);
export const canEditStall = (r) => has(r, [...MARKET_ADMIN, "market_manager", "leasing_officer"]);
export const canDeleteStall = (r) => has(r, [...MARKET_ADMIN, "market_manager"]); // delete stays tighter
export const canEditLease = (r) => has(r, [...MARKET_ADMIN, "market_manager", "leasing_officer"]);

// ---- Reports & Tenant Inquiry (doc 21 §6) ----
// Finance reports (SOA / aging / collections / delinquent) — sees ₱ balances.
export const canViewReports = (r) =>
  has(r, [
    ...MARKET_ADMIN,
    "market_manager",
    "finance_head",
    "accounts_receivable",
    "accounting_staff",
    "executive",
  ]);
// Tenant Inquiry is broader: finance roles + leasing officer (latter sees tenant+lease only).
export const canUseInquiry = (r) => canViewReports(r) || has(r, ["leasing_officer"]);

// AR Invoices — same finance roles (doc 21 §11 + D3-A approved 2026-06-26).
export const canViewInvoices = (r) => canViewReports(r);

// SOA Report page — finance roles + leasing_officer (D12 / BUG #16: Leasing reads SOA for tenant queries).
export const canViewSoa = (r) => canViewReports(r) || has(r, ["leasing_officer"]);

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
export const canViewBatches = (r) => canViewReports(r) || has(r, ["cashier"]);
export const canEditBatches = (r) => canViewBatches(r);
export const canConfirmBatches = (r) => canViewReports(r);

// Subscription & Billing self-service — top-tier (BUG #14: executive was missing).
export const canManageSubscription = (r) => has(r, [...MARKET_ADMIN, "finance_head", "executive"]);

// Market Users read-only list (BUG #13): top-tier + platform admin.
export const canViewMarketUsers = (r) =>
  has(r, ["executive", "finance_head", "market_administrator", "system_administrator"]);

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
export const canViewEodCounts = (r) => canViewReports(r) || has(r, ["cashier", "collector"]);
export const canApproveEodCounts = (r) => canViewReports(r);

/**
 * Remittance Reconciliation Report (D1-A, Phase 4 Unit 8; renamed Unit 11).
 * Finance roles only — mirrors IsFinanceViewer on the backend.
 * Cashier/collector excluded (this is an AR/Finance tool, not an ops screen).
 */
export const canViewRemittanceRec = (r) => canViewReports(r);
export const canViewBankRec = canViewRemittanceRec; // backwards-compat alias

/**
 * Destination override on Create Batch (DEC-040 D1, Phase 4 Unit 11).
 * AR + admin/finance roles only; cashier sees read-only chip (separation of duties).
 */
export const canOverrideDestination = (r) => canViewReports(r);

/**
 * Spreadsheet Upload page RBAC (Unit 13, DEC-055).
 * Per-domain stewardship mirrors doc 21 §5 but extended to all 10 csv_import domains.
 * receipt_book is restricted to market_administrator + finance_head only (no admin_staff).
 */
// Unit 27 F2: `executive` is top-tier oversight and can perform any upload.
// Added everywhere so canUseSpreadsheetUpload(executive) → true.
const SPREADSHEET_DOMAIN_ROLES = {
  tenant: ["executive", ...MARKET_ADMIN, "finance_head", "leasing_officer", "accounts_receivable"],
  stall: ["executive", ...MARKET_ADMIN, "finance_head", "leasing_officer", "accounts_receivable"],
  lease: ["executive", ...MARKET_ADMIN, "finance_head", "leasing_officer", "accounts_receivable"],
  payment: ["executive", ...MARKET_ADMIN, "finance_head", "accounts_receivable", "accounting_staff", "cashier"],
  collection_summary: ["executive", ...MARKET_ADMIN, "finance_head", "accounts_receivable", "accounting_staff"],
  receipt_issue: ["executive", ...MARKET_ADMIN, "finance_head", "accounts_receivable", "accounting_staff"],
  receipt_book: ["executive", "market_administrator", "finance_head"],
  deposit_slip: ["executive", ...MARKET_ADMIN, "finance_head", "accounting_staff"],
  cashier_intake: ["executive", ...MARKET_ADMIN, "finance_head", "accounting_staff"],
  remittance_batch: ["executive", ...MARKET_ADMIN, "finance_head", "accounting_staff"],
  opening_balance: ["executive", "finance_head", "market_administrator"],
};

export const SPREADSHEET_UPLOAD_DOMAINS = Object.keys(SPREADSHEET_DOMAIN_ROLES);

export const canUploadSpreadsheetDomain = (r, domain) =>
  has(r, SPREADSHEET_DOMAIN_ROLES[domain] || []);

export const spreadsheetUploadDomains = (r) =>
  SPREADSHEET_UPLOAD_DOMAINS.filter((d) => canUploadSpreadsheetDomain(r, d));

export const canUseSpreadsheetUpload = (r) => spreadsheetUploadDomains(r).length > 0;

// D4: top-tier sees all import jobs; others see own (requires actor field on ImportJob).
export const canSeeAllImportJobs = (r) =>
  has(r, ["market_administrator", "finance_head", "executive"]);

// GRACE mode: Finance Mgr / Market Admin only for historical import (DEC-043).
export const canUseGraceMode = (r) => has(r, ["market_administrator", "finance_head"]);

/**
 * Settings — ChargeType + ExpenseCategory master data (DEC-044 / Unit 16).
 * Top Tier only: executive (Owner), finance_head (Finance Mgr), market_administrator.
 * Vocabulary debt: DEC-055 uses "Owner/Finance Manager" — actual DB codes are
 * "executive/finance_head". Mapping documented in DECISIONS.md after Unit 16 ships.
 */
const TOP_TIER = ["executive", "finance_head", "market_administrator"];
export const canViewSettings = (r) => has(r, TOP_TIER);
export const canManageChargeTypes = (r) => has(r, TOP_TIER);

/**
 * Cash Deduction workflow (DEC-046 / Unit 18).
 * canCreateDeduction: cashier + top-tier + admin_staff.
 *   Collector excluded (mobile-only Tier 1, Quirk #24).
 * canApproveDeduction: top-tier only (market_administrator, finance_head, executive).
 *   Cashier cannot self-approve — separation of duties.
 */
const DEDUCTION_CREATOR_ROLES = [
  "cashier",
  "market_administrator",
  "admin_staff",
  "finance_head",
  "executive",
];
const DEDUCTION_APPROVER_ROLES = [...TOP_TIER];
export const canCreateDeduction = (r) => has(r, DEDUCTION_CREATOR_ROLES);
export const canApproveDeduction = (r) => has(r, DEDUCTION_APPROVER_ROLES);

/**
 * Daily Collection Verification (D7, Unit 21 / DEC-050).
 * Same roles as IsCashierIntakeApprover on the backend: finance + admin roles.
 * Cashier/collector excluded — this is a reconciliation management tool.
 */
export const canViewDailyVerification = (r) => canViewReports(r);

/**
 * Denomination override approval (D2, Unit 21 / DEC-049).
 * Mirrors _CI_OVERRIDE_APPROVER_ROLES on the backend.
 */
const DENOM_OVERRIDE_APPROVER_ROLES = [
  "market_administrator",
  "admin_staff",
  "finance_head",
  "market_manager",
  "executive",
];
export const canApproveDenomOverride = (r) => has(r, DENOM_OVERRIDE_APPROVER_ROLES);

/**
 * Cash Accountability Dashboard + Monthly Close (DEC-051 / Unit 22).
 * canViewCashAccountability: mirrors CASH_ACCOUNTABILITY_ROLES on the backend.
 * canSignMarketAdmin: only the market_administrator signs the MA line.
 * canSignAR: only accounts_receivable signs the AR line.
 * canSignOwner: Owner (executive) optional sign-off.
 * canReopenPeriodClose: top-tier only (executive + finance_head).
 */
const CASH_ACCOUNTABILITY_VIEWER_ROLES = [
  "executive",
  "finance_head",
  "market_administrator",
  "accounts_receivable",
  "admin_staff",
];
export const canViewCashAccountability = (r) => has(r, CASH_ACCOUNTABILITY_VIEWER_ROLES);
export const canSignMarketAdmin = (r) => has(r, ["market_administrator"]);
export const canSignAR = (r) => has(r, ["accounts_receivable"]);
export const canSignOwner = (r) => has(r, ["executive"]);
export const canReopenPeriodClose = (r) => has(r, ["executive", "finance_head"]);

/**
 * DEC-055 role-tier helpers (Unit 26 / role finalization patch 2026-07-03).
 * Mirror backend core/permissions.py ALLOWED_ROLES (A1 locked: existing DB codes).
 * Use ROLE constants from constants/roles.js for new code; legacy role strings kept
 * here for backwards-compat with existing callers that pass raw strings.
 */
export const isTopTier = (r) =>
  has(r, ["executive", "finance_head", "market_administrator"]);

export const isAdminStaffOrAbove = (r) =>
  has(r, ["executive", "finance_head", "market_administrator", "admin_staff"]);

export const isOperationalUser = (r) =>
  has(r, [
    "executive", "finance_head", "market_administrator", "admin_staff",
    "leasing_officer",
    "accounts_receivable", "accounts_payable", "cashier",
  ]);

// Mobile-only / portal-only — not web operator roles
export const isMobileOnly = (r) => has(r, ["collector", "tenant"]);

// Module access helpers (mirrors Sidenav allowedRoles per patch spec)
export const canAccessAdminModule = (r, isStaff) => isStaff || isTopTier(r);
export const canManageMasterData = (r, isStaff) => isStaff || isTopTier(r);
export const canManageExpenseCategories = (r) => isTopTier(r);
export const canSignMonthlyClose = (r) =>
  has(r, ["executive", "finance_head", "market_administrator", "accounts_receivable"]);
