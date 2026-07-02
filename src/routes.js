/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

/** 
  All of the routes for the Material Dashboard 2 React are added here,
  You can add a new route, customize the routes and delete the routes here.

  Once you add a new route on this file it will be visible automatically on
  the Sidenav.

  For adding a new route you can follow the existing routes in the routes array.
  1. The `type` key with the `collapse` value is used for a route.
  2. The `type` key with the `title` value is used for a title inside the Sidenav. 
  3. The `type` key with the `divider` value is used for a divider between Sidenav items.
  4. The `name` key is used for the name of the route on the Sidenav.
  5. The `key` key is used for the key of the route (It will help you with the key prop inside a loop).
  6. The `icon` key is used for the icon of the route on the Sidenav, you have to add a node.
  7. The `collapse` key is used for making a collapsible item on the Sidenav that has other routes
  inside (nested routes), you need to pass the nested routes inside an array as a value for the `collapse` key.
  8. The `route` key is used to store the route location which is used for the react router.
  9. The `href` key is used to store the external links location.
  10. The `title` key is only for the item with the type of `title` and its used for the title text on the Sidenav.
  10. The `component` key is used to store the component of its route.
*/

// Material Dashboard 2 React layouts
import Dashboard from "layouts/dashboard";
import Invoices from "layouts/invoices";
import InvoiceDetail from "layouts/invoices/detail";
import Leases from "layouts/leases";
import Stalls from "layouts/stalls";
import Tenants from "layouts/tenants";
import BatchImport from "layouts/batch-import";
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
import TenantPortal from "layouts/tenant-portal";
import TenantLogin from "layouts/tenant-portal/login";
import TenantChangePassword from "layouts/tenant-portal/change-password";
import TenantDashboard from "layouts/tenant-portal/dashboard";
import TenantSOA from "layouts/tenant-portal/soa";
import TenantPayments from "layouts/tenant-portal/payments";
import Profile from "layouts/profile";
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

const routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
  },
  {
    type: "collapse",
    name: "Stalls",
    key: "Stalls",
    icon: <Icon fontSize="small">storefront</Icon>,
    route: "/Stalls",
    component: <Stalls />,
  },
  {
    type: "collapse",
    name: "Leases",
    key: "Leases",
    icon: <Icon fontSize="small">storefront</Icon>,
    route: "/Leases",
    component: <Leases />,
  },
  {
    type: "collapse",
    name: "Invoices",
    key: "invoices",
    icon: <Icon fontSize="small">receipt_long</Icon>,
    route: "/invoices",
    component: <Invoices />,
  },
  {
    // Detail page — routable but NOT in the sidenav (type: route).
    type: "route",
    name: "Invoice Detail",
    key: "invoice-detail",
    route: "/invoices/:id",
    component: <InvoiceDetail />,
  },
  {
    type: "collapse",
    name: "Tenants",
    key: "Tenants",
    icon: <Icon fontSize="small">Person</Icon>,
    route: "/tenants",
    component: <Tenants />,
  },
  {
    type: "collapse",
    name: "Spreadsheet Upload",
    key: "spreadsheet-upload",
    icon: <Icon fontSize="small">table_view</Icon>,
    route: "/spreadsheet-upload",
    component: <SpreadsheetUpload />,
  },
  {
    type: "collapse",
    name: "Upload Center",
    key: "upload",
    icon: <Icon fontSize="small">upload_file</Icon>,
    route: "/upload",
    component: <BatchImport />,
  },
  {
    type: "collapse",
    name: "Reports",
    key: "reports",
    icon: <Icon fontSize="small">assessment</Icon>,
    route: "/reports",
    component: <Reports />,
  },
  {
    type: "collapse",
    name: "Statement of Account",
    key: "soa",
    icon: <Icon fontSize="small">request_quote</Icon>,
    route: "/soa",
    component: <SoaPage />,
  },
  {
    type: "collapse",
    name: "Aging Dashboard",
    key: "aging",
    icon: <Icon fontSize="small">stacked_bar_chart</Icon>,
    route: "/aging",
    component: <AgingDashboard />,
  },
  {
    type: "collapse",
    name: "Cash Position",
    key: "cash-position",
    icon: <Icon fontSize="small">account_balance_wallet</Icon>,
    route: "/cash-position",
    component: <CashPositionDashboard />,
  },
  {
    type: "collapse",
    name: "Deposit Batches",
    key: "deposit-batches",
    icon: <Icon fontSize="small">savings</Icon>,
    route: "/deposit-batches",
    component: <DepositBatchListPage />,
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
  },
  {
    type: "collapse",
    name: "Bank Reconciliation",
    key: "bank-reconciliation",
    icon: <Icon fontSize="small">account_balance</Icon>,
    route: "/bank-reconciliation",
    component: <BankReconciliationPage />,
  },
  // Unit 22 — Cash Accountability (DEC-051)
  {
    type: "collapse",
    name: "Cash Accountability",
    key: "cash-accountability",
    icon: <Icon fontSize="small">balance</Icon>,
    route: "/cash-accountability",
    component: <CashAccountabilityPage />,
  },
  {
    type: "route",
    name: "Monthly Close",
    key: "monthly-close",
    route: "/monthly-close/:id",
    component: <MonthlyClosePage />,
  },
  {
    type: "collapse",
    name: "Tenant Inquiry",
    key: "tenant-inquiry",
    icon: <Icon fontSize="small">manage_search</Icon>,
    route: "/tenant-inquiry",
    component: <TenantInquiry />,
  },
  {
    type: "collapse",
    name: "Subscription",
    key: "subscription",
    icon: <Icon fontSize="small">workspace_premium</Icon>,
    route: "/subscription",
    component: <Subscription />,
  },
  {
    type: "collapse",
    name: "Administration",
    key: "administration",
    icon: <Icon fontSize="small">admin_panel_settings</Icon>,
    route: "/administration",
    component: <Administration />,
  },
  // Settings — ChargeType + ExpenseCategory (Unit 16 / DEC-044; Top Tier only)
  {
    type: "route",
    name: "Charge Types",
    key: "charge-types",
    route: "/settings/charge-types",
    component: <ChargeTypeListPage />,
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
  {
    type: "route",
    name: "Expense Categories",
    key: "expense-categories",
    route: "/settings/expense-categories",
    component: <ExpenseCategoryListPage />,
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
  // D9 (Unit 15 DEC-042): old /tenant-portal (IAM-3 unauthenticated) → redirects to /tenant/login.
  {
    type: "route",
    name: "Tenant Portal Legacy",
    key: "tenant-portal-legacy",
    route: "/tenant-portal",
    component: <TenantPortal />,
  },
  // D7 (Unit 15 DEC-042): JWT-authenticated tenant portal — /tenant/* prefix, NOT in operator sidenav.
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
  {
    type: "collapse",
    name: "Profile",
    key: "profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "/profile",
    component: <Profile />,
  },
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    icon: <Icon fontSize="small">login</Icon>,
    route: "/authentication/sign-in",
    component: <SignIn />,
  },
  {
    type: "collapse",
    name: "Sign Up",
    key: "sign-up",
    icon: <Icon fontSize="small">assignment</Icon>,
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
];

export default routes;
