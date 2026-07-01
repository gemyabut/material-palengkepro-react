/**
 * Kiosk shell layout for Unit 15 Tenant Portal (DEC-042).
 *
 * - Hides the operator sidebar (setLayout "page")
 * - Shows tenant name + TID in header
 * - D4: 5-minute idle auto-logout via useIdleAutoLogout
 * - Touch-friendly: large fonts, generous padding, no dense operator chrome
 */
import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Box, AppBar, Toolbar, Typography, Button, Divider } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

import { useMaterialUIController, setLayout } from "context";
import { clearTenantSession, getTenantSession, useIdleAutoLogout } from "utils/tenantPortalAuth";

export default function PortalLayout({ children }) {
  const [, dispatch] = useMaterialUIController();
  const navigate = useNavigate();
  const { tenantName, tenantIdCode } = getTenantSession();

  useEffect(() => {
    setLayout(dispatch, "page");
  }, [dispatch]);

  const handleLogout = useCallback(() => {
    clearTenantSession();
    navigate("/tenant/login", { replace: true });
  }, [navigate]);

  useIdleAutoLogout(handleLogout, 5);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fa", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" sx={{ bgcolor: "#1a237e", boxShadow: 2 }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" sx={{ color: "white", fontWeight: 700, lineHeight: 1.2 }}>
              PalengkeProPH
            </Typography>
            {tenantName && (
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                {tenantName}{tenantIdCode ? ` · ${tenantIdCode}` : ""}
              </Typography>
            )}
          </Box>
          <Button
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ color: "white", textTransform: "none", fontSize: "0.95rem" }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Divider />

      <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, maxWidth: 900, mx: "auto", width: "100%" }}>
        {children}
      </Box>

      <Box sx={{ py: 1.5, textAlign: "center" }}>
        <Typography variant="caption" color="text.disabled">
          Session auto-expires after 5 minutes of inactivity.
        </Typography>
      </Box>
    </Box>
  );
}

PortalLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
