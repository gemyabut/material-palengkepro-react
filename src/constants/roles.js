/**
 * Canonical 10-role RBAC constants for PalengkeProPH Tier 1 (DEC-055).
 * DB codes locked per A1 decision — display names resolved in UI from UserProfile.
 * Mirrors backend: users/models.py ROLE_CHOICES + core/permissions.py ALLOWED_ROLES.
 *
 * Role finalization patch: docs/build/TIER1_BUILD_PHASE4_UNIT26_ROLE_FINALIZATION_PATCH.md
 */

// ---------------------------------------------------------------------------
// Individual role codes (DB values — never change without migration)
// ---------------------------------------------------------------------------
export const ROLE = {
  EXEC: 'executive',           // Owner — full governance
  FIN:  'finance_head',        // Finance Manager — top-tier equivalence
  MKT:  'market_administrator',// Market Administrator — per-market operations
  ADM:  'admin_staff',         // Admin Staff — master data + batch imports
  LEA:  'leasing_officer',     // Leasing & Marketing Officer (promoted O1.5)
  AR:   'accounts_receivable', // A/R Staff — invoice reconciliation
  AP:   'accounts_payable',    // A/P Staff — Tier 1 sparse view
  CSH:  'cashier',             // Cashier — ingest + bank deposit
  COL:  'collector',           // Collector — mobile-only (no web Tier 1)
  TEN:  'tenant',              // Tenant — self-service portal only
};

// ---------------------------------------------------------------------------
// Preset role groups (used for allowedRoles arrays in routes.js)
// ---------------------------------------------------------------------------
export const TOP_TIER = [ROLE.EXEC, ROLE.FIN, ROLE.MKT];
export const ADMIN_OR_ABOVE = [...TOP_TIER, ROLE.ADM];
export const ADMIN_OR_ABOVE_PLUS_LEA = [...ADMIN_OR_ABOVE, ROLE.LEA];
export const OPERATIONAL = [
  ...ADMIN_OR_ABOVE, ROLE.LEA, ROLE.AR, ROLE.AP, ROLE.CSH,
];

// Roles with web dashboard access (excludes collector + tenant)
export const WEB_OPERATOR_ROLES = [
  ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.LEA,
  ROLE.AR, ROLE.AP, ROLE.CSH,
];

// Mobile-only / portal-only — redirect on web (Quirk #24 / A4)
export const MOBILE_ONLY_ROLES = [ROLE.COL, ROLE.TEN];

// ---------------------------------------------------------------------------
// Sidenav section order (patch spec: CRM → AR → Treasury → Master Data → Admin)
// null-group entries (Dashboard, Spreadsheet Upload) render above all sections.
// ---------------------------------------------------------------------------
export const SIDENAV_SECTIONS = [
  'CRM',
  'Accounts Receivable',
  'Treasury',
  'Master Data',
  'Reports',
  'Admin',
];

// ---------------------------------------------------------------------------
// Domain → allowed roles (mirrors csv_import/permissions.py DOMAIN_ALLOWED_ROLES O6.1)
// Keys match the workbook-sheet taxonomy established in Unit 13 (tenant/stall/lease/
// payment/cashier_intake/...). ERP-conceptual keys (daily_collections, tenants, etc.)
// were renamed in backend O6.1 to align with these frontend keys.
// 4 backend-only domains (charge_types, expense_categories, users, markets) are
// included here for reference — no frontend picker yet.
// ---------------------------------------------------------------------------
export const DOMAIN_ALLOWED_ROLES = {
  // ── Workbook-sheet keys (Unit 13 taxonomy) ──────────────────────────────
  tenant:             [...ADMIN_OR_ABOVE, ROLE.LEA, ROLE.AR],
  stall:              [...ADMIN_OR_ABOVE, ROLE.LEA, ROLE.AR],
  lease:              [...ADMIN_OR_ABOVE, ROLE.LEA, ROLE.AR],
  payment:            [...TOP_TIER, ROLE.AR, ROLE.CSH],
  collection_summary: [...TOP_TIER, ROLE.AR, ROLE.CSH],
  receipt_issue:      [...TOP_TIER, ROLE.AR, ROLE.CSH],
  receipt_book:       TOP_TIER,
  deposit_slip:       [...TOP_TIER, ROLE.CSH],
  cashier_intake:     [...TOP_TIER, ROLE.CSH],
  remittance_batch:   [...TOP_TIER, ROLE.CSH],
  // ── Backend-only domains (no frontend picker yet) ────────────────────────
  charge_types:       TOP_TIER,
  expense_categories: [...TOP_TIER, ROLE.AP],
  users:              TOP_TIER,
  markets:            [ROLE.EXEC, ROLE.FIN],
};
