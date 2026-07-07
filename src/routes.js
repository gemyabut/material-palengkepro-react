/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================
* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
=========================================================

Route metadata (Unit 26 / DEC-055):
  sidenavGroup  — sidebar section key (null = shown above all sections, no header)
  allowedRoles  — role codes that can see this sidebar entry
  signerRole    — true: Monthly Close required signers get "SIGNS" badge
  type:"collapse" — sidebar-visible + routable
  type:"route"    — routable, NOT shown in sidebar (detail pages / auth / portal)
*/

// Material Dashboard 2 React layouts
import Dashboard from "layouts/dashboard";
import Invoices from "layouts/invoices";
import InvoiceDetail from "layouts/invoices/detail";
import Leases from "layouts/leases";
import Stalls from "layouts/stalls";
import StallDetailPage from "layouts/stalls/StallDetailPage";
import Tenants from "layouts/tenants";
import TenantDetailPage from "layouts/tenants/TenantDetailPage";
import SpreadsheetUpload from "layouts/spreadsheet-upload";
import Reports from "layouts/reports";
import SoaPage from "layouts/soa";
import AgingDashboard from "layouts/aging";
import CashPositionDashboard from "layouts/cash-position";
import DepositBatchListPage from "layouts/deposit-batches";
import DepositBatchDetailPage from "layouts/deposit-batches/detail";
import CreateDepositBatchPage from "layouts/deposit-batches/create";
import DeductionApprovalQueue from "layouts/deposit-batches/components/DeductionApprovalQueue";
import EodCashCountPage from "layouts/eod-cash-count";
import SubmitEodCountPage from "layouts/eod-cash-count/submit";
import DailyVerificationPage from "layouts/daily-verification";
import BankReconciliationPage from "layouts/bank-reconciliation";
import CashAccountabilityPage from "layouts/cash-accountability";
import MonthlyClosePage from "layouts/monthly-close";
import TenantInquiry from "layouts/tenant-inquiry";
import Subscription from "layouts/subscription";
import Administration from "layouts/administration";
import OctalConsole from "layouts/octal-console";
import OctalConsoleDetail from "layouts/octal-console/detail";
import TenantPortal from "layouts/tenant-portal";
import TenantLogin from "layouts/tenant-portal/login";
import TenantChangePassword from "layouts/tenant-portal/change-password";
import TenantDashboard from "layouts/tenant-portal/dashboard";
import TenantSOA from "layouts/tenant-portal/soa";
import TenantPayments from "layouts/tenant-portal/payments";
import Profile from "layouts/profile";
import ChangePassword from "layouts/profile/change-password";
import Preferences from "layouts/preferences";
import Help from "layouts/help";
import Support from "layouts/support";
import About from "layouts/about";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import ForgotPassword from "layouts/authentication/forgot-password";
import PasswordResetConfirm from "layouts/authentication/password-reset-confirm";
import ChargeTypeListPage from "layouts/settings/charge-types";
import ChargeTypeCreatePage from "layouts/settings/charge-types/create";
import ChargeTypeDetailPage from "layouts/settings/charge-types/detail";
import ExpenseCategoryListPage from "layouts/settings/expense-categories";
import ExpenseCategoryCreatePage from "layouts/settings/expense-categories/create";
import ExpenseCategoryDetailPage from "layouts/settings/expense-categories/detail";

// @mui icons
import Icon from "@mui/material/Icon";

// DEC-055 role constants (Unit 26)
import {
  ROLE,
  TOP_TIER,
  ADMIN_OR_ABOVE,
  OPERATIONAL,
  SIDENAV_SECTIONS,
} from "constants/roles";

export { SIDENAV_SECTIONS };

// ---------------------------------------------------------------------------
// Routes — flat array preserved for App.js / React Router (getRoutes unchanged)
// Sidenav reads sidenavGroup + allowedRoles for filtered, grouped rendering.
// ---------------------------------------------------------------------------
const routes = [
  // =========================================================================
  // CROSS-CUTTING (sidenavGroup: null → renders above named sections)
  // =========================================================================
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
    sidenavGroup: null,
    allowedRoles: OPERATIONAL,  // Octal lands on /octal-console instead (per role-based redirect)
  },
  {
    type: "collapse",
    name: "Cash Position",
    key: "cash-position",
    icon: <Icon fontSize="small">account_balance_wallet</Icon>,
    route: "/cash-position",
    component: <CashPositionDashboard />,
    sidenavGroup: null,
    // BUG #15: leasing_officer removed; BUG #18: accounts_receivable removed (D15)
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.AP, ROLE.CSH],
  },
  {
    type: "collapse",
    name: "Data Import",
    key: "spreadsheet-upload",
    icon: <Icon fontSize="small">table_view</Icon>,
    route: "/spreadsheet-upload",
    component: <SpreadsheetUpload />,
    sidenavGroup: null,
    // Per patch matrix: ✓ for EXEC, FIN, MKT, ADM, LEA, AR, CSH — AP excluded
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.LEA, ROLE.AR, ROLE.CSH],
  },
  // Unit 27 F3: Upload Center retired — consolidated onto Spreadsheet Upload.

  // =========================================================================
  // CRM — Tenants > Stalls > Leases (F10 reorder: DEC-055 / F9)
  // =========================================================================
  {
    type: "collapse",
    name: "Tenants",
    key: "Tenants",
    icon: <Icon fontSize="small">people</Icon>,
    route: "/tenants",
    component: <Tenants />,
    sidenavGroup: "CRM",
    // Per patch matrix: TOP_TIER + ADM + LEA (edit); AR + CSH (view-only but shown)
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.LEA, ROLE.AR, ROLE.CSH],
  },
  {
    type: "route",
    key: "tenant-detail",
    route: "/tenants/:id",
    component: <TenantDetailPage />,
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.LEA, ROLE.AR, ROLE.CSH],
  },
  {
    type: "collapse",
    name: "Stalls",
    key: "Stalls",
    icon: <Icon fontSize="small">storefront</Icon>,
    route: "/stalls",
    component: <Stalls />,
    sidenavGroup: "CRM",
    // Per patch matrix: TOP_TIER (✏) + ADM (✏) + LEA (👁) — AR + CSH excluded
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.LEA],
  },
  {
    type: "route",
    key: "stall-detail",
    route: "/stalls/:id",
    component: <StallDetailPage />,
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.LEA],
  },
  {
    type: "collapse",
    name: "Leases",
    key: "Leases",
    icon: <Icon fontSize="small">assignment</Icon>,
    route: "/Leases",
    component: <Leases />,
    sidenavGroup: "CRM",
    // Per patch matrix: TOP_TIER + ADM + LEA (edit); AR (view-only) — CSH + AP excluded
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.LEA, ROLE.AR],
  },

  // =========================================================================
  // Accounts Receivable
  // =========================================================================
  {
    type: "collapse",
    name: "Invoices",
    key: "invoices",
    icon: <Icon fontSize="small">receipt_long</Icon>,
    route: "/invoices",
    component: <Invoices />,
    sidenavGroup: "Accounts Receivable",
    // BUG #16: leasing_officer removed — backend IsFinanceViewer already blocked them;
    // sidenav now aligns (leasing never had meaningful access here)
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.AR],
  },
  {
    type: "route",
    name: "Invoice Detail",
    key: "invoice-detail",
    route: "/invoices/:id",
    component: <InvoiceDetail />,
  },
  {
    type: "collapse",
    name: "Statement of Account",
    key: "soa",
    icon: <Icon fontSize="small">request_quote</Icon>,
    route: "/soa",
    component: <SoaPage />,
    sidenavGroup: "Accounts Receivable",
    // D12: leasing_officer KEEPS SOA access (IsARSOAReader on backend)
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.LEA, ROLE.AR],
  },
  {
    type: "collapse",
    name: "Aging Dashboard",
    key: "aging",
    icon: <Icon fontSize="small">stacked_bar_chart</Icon>,
    route: "/aging",
    component: <AgingDashboard />,
    sidenavGroup: "Accounts Receivable",
    // BUG #16: leasing_officer removed — backend IsFinanceViewer already blocked them;
    // sidenav now aligns
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.AR],
  },
  {
    type: "collapse",
    name: "Tenant Inquiry",
    key: "tenant-inquiry",
    icon: <Icon fontSize="small">manage_search</Icon>,
    route: "/tenant-inquiry",
    component: <TenantInquiry />,
    sidenavGroup: "Accounts Receivable",
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.LEA, ROLE.AR],
  },
  // Unit 22 — Cash Accountability (DEC-051)
  {
    type: "collapse",
    name: "Cash Accountability",
    key: "cash-accountability",
    icon: <Icon fontSize="small">balance</Icon>,
    route: "/cash-accountability",
    component: <CashAccountabilityPage />,
    sidenavGroup: "Accounts Receivable",
    // Per patch matrix: TOP_TIER + AR. ADM + LEA do NOT sign or manage close.
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.AR],
  },
  {
    // Monthly Close — reached from Cash Accountability; signerRole for badge metadata
    type: "route",
    name: "Monthly Close",
    key: "monthly-close",
    route: "/monthly-close/:id",
    component: <MonthlyClosePage />,
    signerRole: true,
  },
  {
    type: "collapse",
    name: "Bank Reconciliation",
    key: "bank-reconciliation",
    icon: <Icon fontSize="small">account_balance</Icon>,
    route: "/bank-reconciliation",
    component: <BankReconciliationPage />,
    sidenavGroup: "Accounts Receivable",
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.LEA, ROLE.AR],
  },

  // =========================================================================
  // Treasury
  // =========================================================================
  {
    type: "collapse",
    name: "Deposit Batches",
    key: "deposit-batches",
    icon: <Icon fontSize="small">savings</Icon>,
    route: "/deposit-batches",
    component: <DepositBatchListPage />,
    sidenavGroup: "Treasury",
    // Per patch matrix "Treasury · Bank Deposits": TOP_TIER + AR (👁) + CSH (✏)
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.AR, ROLE.CSH],
  },
  {
    type: "route",
    name: "Deposit Batch Detail",
    key: "deposit-batch-detail",
    route: "/deposit-batches/:id",
    component: <DepositBatchDetailPage />,
  },
  {
    type: "route",
    name: "Create Deposit Batch",
    key: "deposit-batch-create",
    route: "/deposit-batches/new",
    component: <CreateDepositBatchPage />,
  },
  {
    type: "route",
    name: "Deduction Approval Queue",
    key: "deduction-approval-queue",
    route: "/deposit-batches/deductions/pending",
    component: <DeductionApprovalQueue />,
  },
  {
    type: "collapse",
    name: "EOD Cash Count",
    key: "eod-cash-count",
    icon: <Icon fontSize="small">schedule</Icon>,
    route: "/eod-cash-count",
    component: <EodCashCountPage />,
    sidenavGroup: "Treasury",
    // Per patch matrix "Treasury · Cashier Intake": TOP_TIER + AR (👁) + CSH (✏)
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.AR, ROLE.CSH],
  },
  {
    type: "route",
    name: "Submit EOD Count",
    key: "eod-cash-count-submit",
    route: "/eod-cash-count/:id/submit",
    component: <SubmitEodCountPage />,
  },
  {
    type: "collapse",
    name: "Daily Verification",
    key: "daily-verification",
    icon: <Icon fontSize="small">fact_check</Icon>,
    route: "/daily-verification",
    component: <DailyVerificationPage />,
    sidenavGroup: "Treasury",
    // Per patch matrix: TOP_TIER + AR (👁) — ADM + LEA + CSH excluded
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.AR],
  },

  // =========================================================================
  // Master Data
  // =========================================================================
  // Stalls moved to CRM section (F10 sidebar reorder — DEC-055 / F9).
  // Charge Types — Unit 16 / DEC-044. TOP_TIER edits; AR view-only (👁).
  // BUG #17: leasing_officer removed — Settings is top-tier + AR only (DEC-055).
  {
    type: "collapse",
    name: "Charge Types",
    key: "charge-types",
    icon: <Icon fontSize="small">price_change</Icon>,
    route: "/settings/charge-types",
    component: <ChargeTypeListPage />,
    sidenavGroup: "Master Data",
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.AR],
  },
  {
    type: "route",
    name: "New Charge Type",
    key: "charge-types-new",
    route: "/settings/charge-types/new",
    component: <ChargeTypeCreatePage />,
  },
  {
    type: "route",
    name: "Charge Type Detail",
    key: "charge-types-detail",
    route: "/settings/charge-types/:id",
    component: <ChargeTypeDetailPage />,
  },
  // Expense Categories — TOP_TIER edits; AP view-only (👁 per matrix).
  {
    type: "collapse",
    name: "Expense Categories",
    key: "expense-categories",
    icon: <Icon fontSize="small">category</Icon>,
    route: "/settings/expense-categories",
    component: <ExpenseCategoryListPage />,
    sidenavGroup: "Master Data",
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.AP],
  },
  {
    type: "route",
    name: "New Expense Category",
    key: "expense-categories-new",
    route: "/settings/expense-categories/new",
    component: <ExpenseCategoryCreatePage />,
  },
  {
    type: "route",
    name: "Expense Category Detail",
    key: "expense-categories-detail",
    route: "/settings/expense-categories/:id",
    component: <ExpenseCategoryDetailPage />,
  },

  // =========================================================================
  // Reports
  // =========================================================================
  {
    type: "collapse",
    name: "Reports",
    key: "reports",
    icon: <Icon fontSize="small">assessment</Icon>,
    route: "/reports",
    component: <Reports />,
    sidenavGroup: "Reports",
    allowedRoles: [ROLE.EXEC, ROLE.FIN, ROLE.MKT, ROLE.ADM, ROLE.LEA, ROLE.AR],
  },

  // =========================================================================
  // Admin (Top Tier only per patch matrix)
  // =========================================================================
  {
    type: "collapse",
    name: "Administration",
    key: "administration",
    icon: <Icon fontSize="small">admin_panel_settings</Icon>,
    route: "/administration",
    component: <Administration />,
    sidenavGroup: "Admin",
    allowedRoles: [...TOP_TIER, "system_administrator"],  // UAT patch: Octal onboards clients here
  },
  {
    type: "collapse",
    name: "Subscription",
    key: "subscription",
    icon: <Icon fontSize="small">workspace_premium</Icon>,
    route: "/subscription",
    component: <Subscription />,
    sidenavGroup: "Admin",
    allowedRoles: TOP_TIER,
  },
  // F1.3 — Octal platform admin: cross-company subscription list (system_administrator only)
  {
    type: "collapse",
    name: "Octal Console",
    key: "octal-console",
    icon: <Icon fontSize="small">admin_panel_settings</Icon>,
    route: "/octal-console",
    component: <OctalConsole />,
    sidenavGroup: "Admin",
    allowedRoles: ["system_administrator"],
  },
  {
    type: "route",
    name: "Octal Console — Subscription Detail",
    key: "octal-console-detail",
    route: "/octal-console/subscription/:id",
    component: <OctalConsoleDetail />,
  },

  // =========================================================================
  // NOT IN SIDENAV — auth, profile, tenant portal (all type:"route")
  // =========================================================================
  // Profile → avatar/header dropdown per A3; route preserved for /profile URL
  {
    type: "route",
    name: "Profile",
    key: "profile",
    route: "/profile",
    component: <Profile />,
    allowedRoles: OPERATIONAL,
  },
  // F1.2 — Settings dropdown routes (not in sidebar)
  {
    type: "route",
    name: "Change Password",
    key: "change-password",
    route: "/profile/password",
    component: <ChangePassword />,
    allowedRoles: OPERATIONAL,
  },
  {
    type: "route",
    name: "Preferences",
    key: "preferences",
    route: "/preferences",
    component: <Preferences />,
    allowedRoles: OPERATIONAL,
  },
  {
    type: "route",
    name: "Help",
    key: "help",
    route: "/help",
    component: <Help />,
    allowedRoles: OPERATIONAL,
  },
  {
    type: "route",
    name: "Support",
    key: "support",
    route: "/support",
    component: <Support />,
    allowedRoles: OPERATIONAL,
  },
  {
    type: "route",
    name: "About",
    key: "about",
    route: "/about",
    component: <About />,
    allowedRoles: OPERATIONAL,
  },
  {
    type: "route",
    name: "Sign In",
    key: "sign-in",
    route: "/authentication/sign-in",
    component: <SignIn />,
  },
  {
    type: "route",
    name: "Sign Up",
    key: "sign-up",
    route: "/authentication/sign-up",
    component: <SignUp />,
  },
  {
    type: "route",
    name: "Forgot Password",
    key: "forgot-password",
    route: "/authentication/forgot-password",
    component: <ForgotPassword />,
  },
  {
    type: "route",
    name: "Password Reset Confirm",
    key: "password-reset-confirm",
    route: "/authentication/password-reset-confirm/:uidb64/:token",
    component: <PasswordResetConfirm />,
  },
  // D9 (Unit 15 DEC-042): legacy /tenant-portal → redirects to /tenant/login
  {
    type: "route",
    name: "Tenant Portal Legacy",
    key: "tenant-portal-legacy",
    route: "/tenant-portal",
    component: <TenantPortal />,
  },
  // D7 (Unit 15 DEC-042): JWT-authenticated tenant portal — /tenant/* prefix
  {
    type: "route",
    name: "Tenant Login",
    key: "tenant-login",
    route: "/tenant/login",
    component: <TenantLogin />,
  },
  {
    type: "route",
    name: "Tenant Change Password",
    key: "tenant-change-password",
    route: "/tenant/change-password",
    component: <TenantChangePassword />,
  },
  {
    type: "route",
    name: "Tenant Dashboard",
    key: "tenant-dashboard",
    route: "/tenant/dashboard",
    component: <TenantDashboard />,
  },
  {
    type: "route",
    name: "Tenant SOA",
    key: "tenant-soa",
    route: "/tenant/soa",
    component: <TenantSOA />,
  },
  {
    type: "route",
    name: "Tenant Payments",
    key: "tenant-payments",
    route: "/tenant/payments",
    component: <TenantPayments />,
  },
];

export default routes;
