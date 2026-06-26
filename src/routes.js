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
import Reports from "layouts/reports";
import SoaPage from "layouts/soa";
import TenantInquiry from "layouts/tenant-inquiry";
import Subscription from "layouts/subscription";
import Administration from "layouts/administration";
import TenantPortal from "layouts/tenant-portal";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import ForgotPassword from "layouts/authentication/forgot-password";
import PasswordResetConfirm from "layouts/authentication/password-reset-confirm";

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
  {
    // Tenant-facing read-only portal — routable but NOT in the operator sidenav (type: route).
    type: "route",
    name: "Tenant Portal",
    key: "tenant-portal",
    route: "/tenant-portal",
    component: <TenantPortal />,
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
