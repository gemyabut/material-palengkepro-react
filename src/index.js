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

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";
// UAT PATCH 2026-07-04: Self-host Material Icons — CDNs unreachable from Lead's network.
// FIX 2026-08-26: the 2026-07-04 patch only imported the base (filled) variant.
// The theme's <Icon> baseClassName is "material-icons-round" (assets/theme/components/icon.js
// + theme-dark equivalent) -- that class and its @font-face were never loaded, so every
// icon app-wide rendered as raw ligature source text ("dashboard", "account_balance", ...).
import "material-icons/iconfont/material-icons.css";
import "material-icons/iconfont/round.css";

// Material Dashboard 2 React Context Provider
import { MaterialUIControllerProvider } from "context";

const container = document.getElementById("app");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <MaterialUIControllerProvider>
      <App />
    </MaterialUIControllerProvider>
  </BrowserRouter>
);
