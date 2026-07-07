/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================
* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
=========================================================
*
* Unit 26 / F1.2 — Functional top-right icons:
*   Bell     → role-filtered notifications from /api/finance/notifications/
*   Settings → dropdown (Subscription, Preferences, Help, Support, About,
*               System Settings for top-tier only)
*   Person   → dropdown (View Profile, Change Password, Logout)
*
* Replaces the MD2 template stubs (hardcoded NotificationItems + Configurator link).
*/

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PropTypes from "prop-types";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Icon from "@mui/material/Icon";
import Badge from "@mui/material/Badge";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";

import Breadcrumbs from "examples/Breadcrumbs";
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

import { useMaterialUIController, setTransparentNavbar, setMiniSidenav } from "context";
import { useAuth } from "context/AuthContext";
import { TOP_TIER } from "constants/roles";
import { fetchNotifications } from "api/notifications";

const POLL_INTERVAL_MS = 60_000; // 60 s

const SEVERITY_COLORS = {
  CRITICAL: "#d32f2f",
  WARNING:  "#ed6c02",
  INFO:     "#0288d1",
};

function DashboardNavbar({ absolute, light, isMini }) {
  const [navbarType, setNavbarType]     = useState();
  const [controller, dispatch]          = useMaterialUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar, darkMode } = controller;

  const route    = useLocation().pathname.split("/").slice(1);
  const navigate = useNavigate();

  // Auth / role
  const { userProfile } = useAuth();
  const role    = userProfile?.role || null;
  const isStaff = userProfile?.is_staff || false;
  const isTopTierUser = isStaff || TOP_TIER.includes(role);

  // Dropdown anchors
  const [bellAnchor,     setBellAnchor]     = useState(null);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [personAnchor,   setPersonAnchor]   = useState(null);

  // Notifications state
  const [notifData,    setNotifData]    = useState({ count: 0, critical_count: 0, notifications: [] });
  const [notifLoading, setNotifLoading] = useState(false);
  const pollRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (notifLoading) return;
    setNotifLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifData(data);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");
        navigate("/authentication/sign-in", { replace: true });
      }
      // Non-401 errors: keep last-known data (prevent flashing)
    } finally {
      setNotifLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadNotifications();
    pollRef.current = setInterval(loadNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Navbar transparency listener
  useEffect(() => {
    const type = fixedNavbar ? "sticky" : "static";
    setNavbarType(type);

    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }
    window.addEventListener("scroll", handleTransparentNavbar);
    handleTransparentNavbar();
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);

  const iconsStyle = ({ palette: { dark, white, text }, functions: { rgba } }) => ({
    color: () => {
      let colorValue = light || darkMode ? white.main : dark.main;
      if (transparentNavbar && !light) colorValue = darkMode ? rgba(text.main, 0.6) : text.main;
      return colorValue;
    },
  });

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/authentication/sign-in";
  };

  // ── Bell dropdown ──────────────────────────────────────────────────────────
  const bellBadgeCount = notifData.critical_count || notifData.count || 0;

  const renderBellMenu = () => (
    <Menu
      anchorEl={bellAnchor}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top",    horizontal: "right" }}
      open={Boolean(bellAnchor)}
      onClose={() => setBellAnchor(null)}
      sx={{ mt: 1, minWidth: 320 }}
      PaperProps={{ sx: { maxWidth: 360, maxHeight: 420, overflowY: "auto" } }}
    >
      <MDBox px={2} pt={1} pb={0.5}>
        <MDTypography variant="caption" fontWeight="bold" textTransform="uppercase">
          Notifications
          {notifData.critical_count > 0 && (
            <span style={{ color: SEVERITY_COLORS.CRITICAL, marginLeft: 6 }}>
              {notifData.critical_count} critical
            </span>
          )}
        </MDTypography>
      </MDBox>
      <Divider sx={{ my: 0.5 }} />
      {notifData.notifications.length === 0 ? (
        <MenuItem disabled>
          <ListItemText
            primary="No alerts"
            primaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
          />
        </MenuItem>
      ) : (
        notifData.notifications.map((n, i) => (
          <MenuItem
            key={i}
            onClick={() => {
              setBellAnchor(null);
              if (n.target_url) navigate(n.target_url);
            }}
            sx={{ alignItems: "flex-start", py: 1 }}
          >
            <ListItemIcon sx={{ mt: 0.3, minWidth: 28 }}>
              <Icon sx={{ fontSize: "1rem !important", color: SEVERITY_COLORS[n.severity] || "inherit" }}>
                {n.severity === "CRITICAL" ? "error" : n.severity === "WARNING" ? "warning" : "info"}
              </Icon>
            </ListItemIcon>
            <ListItemText
              primary={n.message}
              primaryTypographyProps={{ variant: "caption", sx: { whiteSpace: "normal" } }}
            />
          </MenuItem>
        ))
      )}
      <Divider sx={{ my: 0.5 }} />
      <MenuItem onClick={() => { setBellAnchor(null); navigate("/cash-accountability"); }}>
        <ListItemText
          primary="View Cash Accountability →"
          primaryTypographyProps={{ variant: "caption", color: "primary" }}
        />
      </MenuItem>
    </Menu>
  );

  // ── Settings dropdown ──────────────────────────────────────────────────────
  const renderSettingsMenu = () => (
    <Menu
      anchorEl={settingsAnchor}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top",    horizontal: "right" }}
      open={Boolean(settingsAnchor)}
      onClose={() => setSettingsAnchor(null)}
      sx={{ mt: 1 }}
    >
      <MDTypography variant="caption" fontWeight="bold" textTransform="uppercase" sx={{ px: 2, pt: 1, display: "block" }}>
        Account
      </MDTypography>
      <MenuItem onClick={() => { setSettingsAnchor(null); navigate("/subscription"); }}>
        <ListItemIcon><Icon fontSize="small">star</Icon></ListItemIcon>
        <ListItemText primary="Subscription" />
      </MenuItem>
      <MenuItem onClick={() => { setSettingsAnchor(null); navigate("/preferences"); }}>
        <ListItemIcon><Icon fontSize="small">tune</Icon></ListItemIcon>
        <ListItemText primary="Preferences" />
      </MenuItem>
      <Divider />
      <MDTypography variant="caption" fontWeight="bold" textTransform="uppercase" sx={{ px: 2, pt: 0.5, display: "block" }}>
        Support
      </MDTypography>
      <MenuItem onClick={() => { setSettingsAnchor(null); navigate("/help"); }}>
        <ListItemIcon><Icon fontSize="small">help_outline</Icon></ListItemIcon>
        <ListItemText primary="Help" />
      </MenuItem>
      <MenuItem onClick={() => { setSettingsAnchor(null); navigate("/support"); }}>
        <ListItemIcon><Icon fontSize="small">contact_support</Icon></ListItemIcon>
        <ListItemText primary="Contact Support" />
      </MenuItem>
      <MenuItem onClick={() => { setSettingsAnchor(null); navigate("/about"); }}>
        <ListItemIcon><Icon fontSize="small">info_outline</Icon></ListItemIcon>
        <ListItemText primary="About" />
      </MenuItem>
      {isTopTierUser && <Divider />}
      {isTopTierUser && (
        <>
          <MDTypography variant="caption" fontWeight="bold" textTransform="uppercase" sx={{ px: 2, pt: 0.5, display: "block" }}>
            System
          </MDTypography>
          <MenuItem onClick={() => { setSettingsAnchor(null); navigate("/settings/users"); }}>
            <ListItemIcon><Icon fontSize="small">group</Icon></ListItemIcon>
            <ListItemText primary="Market Users" />
          </MenuItem>
          <MenuItem onClick={() => { setSettingsAnchor(null); navigate("/administration"); }}>
            <ListItemIcon><Icon fontSize="small">admin_panel_settings</Icon></ListItemIcon>
            <ListItemText primary="System Settings" />
          </MenuItem>
        </>
      )}
    </Menu>
  );

  // ── Person dropdown ────────────────────────────────────────────────────────
  const renderPersonMenu = () => (
    <Menu
      anchorEl={personAnchor}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top",    horizontal: "right" }}
      open={Boolean(personAnchor)}
      onClose={() => setPersonAnchor(null)}
      sx={{ mt: 1 }}
    >
      <MenuItem onClick={() => { setPersonAnchor(null); navigate("/profile"); }}>
        <ListItemIcon><Icon fontSize="small">account_circle</Icon></ListItemIcon>
        <ListItemText primary="View Profile" />
      </MenuItem>
      <MenuItem onClick={() => { setPersonAnchor(null); navigate("/profile/password"); }}>
        <ListItemIcon><Icon fontSize="small">lock_reset</Icon></ListItemIcon>
        <ListItemText primary="Change Password" />
      </MenuItem>
      <Divider />
      <MenuItem onClick={handleLogout}>
        <ListItemIcon><Icon fontSize="small" sx={{ color: "error.main" }}>logout</Icon></ListItemIcon>
        <ListItemText primary="Logout" primaryTypographyProps={{ color: "error" }} />
      </MenuItem>
    </Menu>
  );

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light, darkMode })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        <MDBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          <Breadcrumbs icon="home" title={route[route.length - 1]} route={route} light={light} />
        </MDBox>
        {isMini ? null : (
          <MDBox sx={(theme) => navbarRow(theme, { isMini })}>
            <MDBox pr={1}>
              <MDInput label="Search here" />
            </MDBox>
            <MDBox color={light ? "white" : "inherit"} display="flex" alignItems="center">

              {/* Person icon */}
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarIconButton}
                onClick={(e) => setPersonAnchor(e.currentTarget)}
              >
                <Icon sx={iconsStyle}>account_circle</Icon>
              </IconButton>

              {/* Mobile sidenav toggle */}
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon sx={iconsStyle} fontSize="medium">
                  {miniSidenav ? "menu_open" : "menu"}
                </Icon>
              </IconButton>

              {/* Settings icon */}
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarIconButton}
                onClick={(e) => setSettingsAnchor(e.currentTarget)}
              >
                <Icon sx={iconsStyle}>settings</Icon>
              </IconButton>

              {/* Bell icon with badge */}
              <IconButton
                size="small"
                disableRipple
                color="inherit"
                sx={navbarIconButton}
                onClick={(e) => { setBellAnchor(e.currentTarget); loadNotifications(); }}
              >
                <Badge
                  badgeContent={bellBadgeCount > 0 ? bellBadgeCount : null}
                  color="error"
                  max={9}
                  sx={{ "& .MuiBadge-badge": { fontSize: "0.55rem", height: 14, minWidth: 14 } }}
                >
                  <Icon sx={iconsStyle}>notifications</Icon>
                </Badge>
              </IconButton>

              {renderBellMenu()}
              {renderSettingsMenu()}
              {renderPersonMenu()}
            </MDBox>
          </MDBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;
