/**
 * Canonical RBAC role constants for PalengkeProPH Tier 1 (DEC-055).
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
  ADM:  'admin_staff',         // Admin Staff — Senior Admin / Supervisor level (distinct role, not an alias for market_administrator)
  LEA:  'leasing_officer',     // Leasing & Marketing Officer (promoted O1.5)
  AR:   'accounts_receivable', // A/R Staff — invoice reconciliation
  AP:   'accounts_payable',    // A/P Staff — Tier 1 sparse view
  ACC:  'accounting_staff',    // Accounting Staff (Bank Reconciliation) — deposit batches + remittances
  CSH:  'cashier',             // Cashier — ingest + bank deposit
  COL:  'collector',           // Collector — uses the web app in Tier 1 (no mobile app); sees only their own work
  TEN:  'tenant',              // Tenant — self-service portal only
};

// ---------------------------------------------------------------------------
// Preset role groups (used for allowedRoles arrays in routes.js)
// ---------------------------------------------------------------------------
export const TOP_TIER = [ROLE.EXEC, ROLE.FIN, ROLE.MKT];
export const ADMIN_OR_ABOVE = [...TOP_TIER, ROLE.ADM];
export const ADMIN_OR_ABOVE_PLUS_LEA = [...ADMIN_OR_ABOVE, ROLE.LEA];
export const OPERATIONAL = [
  ...ADMIN_OR_ABOVE, ROLE.LEA, ROLE.AR, ROLE.AP, ROLE.ACC, ROLE.CSH, ROLE.COL,
];

// Roles with web dashboard access (everyone except tenant)
export const WEB_OPERATOR_ROLES = [
  ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.LEA,
  ROLE.AR, ROLE.AP, ROLE.ACC, ROLE.CSH, ROLE.COL,
  "system_administrator",   // UAT patch 2026-07-04: Octal Philippines platform admin
];

// Portal-only — redirect on web. Collectors use the web app in Tier 1 (there is
// no mobile app), so tenant is the only one left (Lead 2026-11-07).
export const MOBILE_ONLY_ROLES = [ROLE.TEN];

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
