/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================
* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
=========================================================
*/

import { useEffect, useMemo } from "react";

// react-router-dom
import { useLocation, NavLink, useNavigate } from "react-router-dom";

import PropTypes from "prop-types";

// @mui material components
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import SidenavCollapse from "examples/Sidenav/SidenavCollapse";

// Custom styles for the Sidenav
import SidenavRoot from "examples/Sidenav/SidenavRoot";
import sidenavLogoLabel from "examples/Sidenav/styles/sidenav";

// Material Dashboard 2 React context
import {
  useMaterialUIController,
  setMiniSidenav,
  setTransparentSidenav,
  setWhiteSidenav,
} from "context";

// Auth context for role-based filtering (Unit 26 / DEC-055)
import { useAuth } from "context/AuthContext";

// Role constants
import { ROLE, SIDENAV_SECTIONS, MOBILE_ONLY_ROLES, WEB_OPERATOR_ROLES } from "constants/roles";

// ---------------------------------------------------------------------------
// buildSidenavSections — filter + group routes for a given role
//
// Returns: array of { section: string|null, items: [] }
//   section === null → cross-cutting entries (render above named sections, no header)
//   section === string → named section (render under labelled section header)
// Returns null → caller triggers redirect (unknown/mobile-only role)
// ---------------------------------------------------------------------------
function buildSidenavSections(routes, role, isStaff) {
  if (isStaff) {
    // Django is_staff bypass (Quirk #15): show all sidebar entries flat, no role filter
    const items = routes.filter((r) => r.type === "collapse" && r.sidenavGroup !== undefined);
    return [{ section: null, items }];
  }

  // Mobile-only or tenant → redirect (Quirk #24 / A4)
  if (MOBILE_ONLY_ROLES.includes(role)) return null;

  // Unknown or legacy role → redirect + "Contact administrator" (A4)
  if (role && !WEB_OPERATOR_ROLES.includes(role)) return null;

  // Filter sidebar entries by allowedRoles
  const filtered = routes.filter((r) => {
    if (r.type !== "collapse") return false;
    if (r.sidenavGroup === undefined) return false;
    const allowed = r.allowedRoles;
    if (!allowed) return true;
    return allowed.includes(role);
  });

  // Split cross-cutting (sidenavGroup: null) from named sections
  const crossCutting = filtered.filter((r) => r.sidenavGroup === null);
  const grouped = {};
  for (const r of filtered) {
    if (r.sidenavGroup === null) continue;
    if (!grouped[r.sidenavGroup]) grouped[r.sidenavGroup] = [];
    grouped[r.sidenavGroup].push(r);
  }

  const sections = [];
  if (crossCutting.length > 0) {
    sections.push({ section: null, items: crossCutting });
  }
  // Named sections in canonical order; skip empty (D3)
  for (const s of SIDENAV_SECTIONS) {
    if (grouped[s] && grouped[s].length > 0) {
      sections.push({ section: s, items: grouped[s] });
    }
  }
  return sections;
}

function Sidenav({ color, brand, brandName, routes, ...rest }) {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode } = controller;
  const location = useLocation();
  const navigate = useNavigate();
  const collapseName = location.pathname.replace("/", "");

  // Role from auth context (Unit 26 / DEC-055)
  const { userProfile } = useAuth();
  const role = userProfile?.role || null;
  const isStaff = userProfile?.is_staff || false;

  let textColor = "white";
  if (transparentSidenav || (whiteSidenav && !darkMode)) {
    textColor = "dark";
  } else if (whiteSidenav && darkMode) {
    textColor = "inherit";
  }

  const closeSidenav = () => setMiniSidenav(dispatch, true);

  useEffect(() => {
    function handleMiniSidenav() {
      setMiniSidenav(dispatch, window.innerWidth < 1200);
      setTransparentSidenav(dispatch, window.innerWidth < 1200 ? false : transparentSidenav);
      setWhiteSidenav(dispatch, window.innerWidth < 1200 ? false : whiteSidenav);
    }
    window.addEventListener("resize", handleMiniSidenav);
    handleMiniSidenav();
    return () => window.removeEventListener("resize", handleMiniSidenav);
  }, [dispatch, location]);

  // Route guard (D4 + A4): redirect on load for mobile-only and unknown roles
  useEffect(() => {
    if (!userProfile) return;
    if (isStaff) return;
    if (role === ROLE.TEN) {
      navigate("/tenant/login", { replace: true });
      return;
    }
    if (MOBILE_ONLY_ROLES.includes(role) || (role && !WEB_OPERATOR_ROLES.includes(role))) {
      navigate("/authentication/sign-in", { replace: true });
    }
  }, [userProfile, role, isStaff, navigate]);

  // Build filtered, grouped sections (memoized — only recomputes when role/routes change)
  const sidenavSections = useMemo(
    () => buildSidenavSections(routes, role, isStaff),
    [routes, role, isStaff]
  );

  // Render one sidebar item
  const renderItem = ({ key, name, icon, href, route, noCollapse, signerRole: isSigner }) => {
    const isActive = key === collapseName;
    // SIGNS badge for Monthly Close required signers (MA + AR per DEC-051)
    const label =
      isSigner && !miniSidenav ? (
        <MDBox display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <span>{name}</span>
          <Chip
            label="SIGNS"
            size="small"
            color="warning"
            sx={{ height: 16, fontSize: "0.6rem", ml: 0.5 }}
          />
        </MDBox>
      ) : (
        name
      );

    if (href) {
      return (
        <Link
          href={href}
          key={key}
          target="_blank"
          rel="noreferrer"
          sx={{ textDecoration: "none" }}
        >
          <SidenavCollapse name={label} icon={icon} active={isActive} noCollapse={noCollapse} />
        </Link>
      );
    }
    return (
      <NavLink key={key} to={route}>
        <SidenavCollapse name={label} icon={icon} active={isActive} />
      </NavLink>
    );
  };

  // Render one section (optional header + items)
  const renderSection = ({ section, items }) => {
    const entries = items.map(renderItem);
    if (!section) return entries;
    return [
      <MDTypography
        key={`section-${section}`}
        color={textColor}
        display="block"
        variant="caption"
        fontWeight="bold"
        textTransform="uppercase"
        pl={3}
        mt={2}
        mb={1}
        ml={1}
      >
        {section}
      </MDTypography>,
      ...entries,
    ];
  };

  const renderRoutes = sidenavSections ? sidenavSections.flatMap(renderSection) : [];

  // A/P sparse-view upsell nudge (Tier 1 — patch spec "A/P Staff: Tier 1 sparse view")
  const showApUpsell = !isStaff && role === ROLE.AP;

  return (
    <SidenavRoot
      {...rest}
      variant="permanent"
      ownerState={{ transparentSidenav, whiteSidenav, miniSidenav, darkMode }}
    >
      <MDBox pt={3} pb={1} px={4} textAlign="center">
        <MDBox
          display={{ xs: "block", xl: "none" }}
          position="absolute"
          top={0}
          right={0}
          p={1.625}
          onClick={closeSidenav}
          sx={{ cursor: "pointer" }}
        >
          <MDTypography variant="h6" color="secondary">
            <Icon sx={{ fontWeight: "bold" }}>close</Icon>
          </MDTypography>
        </MDBox>
        <MDBox component={NavLink} to="/" display="flex" alignItems="center">
          {brand && <MDBox component="img" src={brand} alt="Brand" width="2rem" />}
          <MDBox
            width={!brandName && "100%"}
            sx={(theme) => sidenavLogoLabel(theme, { miniSidenav })}
          >
            <MDTypography component="h6" variant="button" fontWeight="medium" color={textColor}>
              {brandName}
            </MDTypography>
          </MDBox>
        </MDBox>
      </MDBox>
      <Divider
        light={
          (!darkMode && !whiteSidenav && !transparentSidenav) ||
          (darkMode && !transparentSidenav && whiteSidenav)
        }
      />
      <List>{renderRoutes}</List>
      <MDBox p={2} mt="auto">
        {showApUpsell && !miniSidenav && (
          <MDBox
            mb={1.5}
            p={1.5}
            borderRadius="lg"
            sx={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <MDTypography variant="caption" color={textColor} fontWeight="bold" display="block">
              Unlock full A/P
            </MDTypography>
            <MDTypography variant="caption" color={textColor} display="block" mb={1}>
              Payables management, approval workflows + vendor reports available in Tier 2.
            </MDTypography>
            <MDButton
              variant="outlined"
              color="warning"
              size="small"
              fullWidth
              onClick={() => navigate("/subscription")}
            >
              Upgrade plan
            </MDButton>
          </MDBox>
        )}
        <MDButton
          variant="gradient"
          color="warning"
          fullWidth
          startIcon={<Icon>logout</Icon>}
          onClick={() => {
            localStorage.removeItem("access_token");
            sessionStorage.removeItem("access_token");
            window.location.href = "/authentication/sign-in";
          }}
        >
          Logout
        </MDButton>
      </MDBox>
    </SidenavRoot>
  );
}

Sidenav.defaultProps = {
  color: "info",
  brand: "",
};

Sidenav.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  brand: PropTypes.string,
  brandName: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;
