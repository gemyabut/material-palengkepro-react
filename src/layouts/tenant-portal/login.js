/**
 * Tenant Portal — Login page (Unit 15, DEC-042).
 *
 * Single identifier field accepts email, mobile (raw or +63 normalized), or TID-XXXXXX.
 * On success: stores tokens, redirects to change-password (if must_change_password) or dashboard.
 * Kiosk-friendly: large touch targets, no operator sidebar.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, TextField, Button, Alert,
  CircularProgress, Typography, InputAdornment,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";

import { useMaterialUIController, setLayout } from "context";
import { tenantPortalApi } from "api/tenantPortal";
import { setTenantSession, getTenantToken } from "utils/tenantPortalAuth";

export default function TenantLogin() {
  const [, dispatch] = useMaterialUIController();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    setLayout(dispatch, "page");
    // Already logged in → go straight to dashboard
    if (getTenantToken()) navigate("/tenant/dashboard", { replace: true });
  }, [dispatch, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const data = await tenantPortalApi.login(identifier.trim(), password);
      setTenantSession(data);
      if (data.must_change_password) {
        navigate("/tenant/change-password", { replace: true });
      } else {
        navigate("/tenant/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f7fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: "100%", boxShadow: 4 }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" fontWeight={700} color="#1a237e" gutterBottom>
              PalengkeProPH
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Tenant Portal — Sign in to view your account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email, mobile, or Tenant ID (TID-XXXXXX)"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2.5 }}
              inputProps={{ style: { fontSize: "1.05rem" } }}
            />

            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3.5 }}
              inputProps={{ style: { fontSize: "1.05rem" } }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || !identifier.trim() || !password}
              sx={{
                py: 1.75,
                fontSize: "1.1rem",
                fontWeight: 700,
                bgcolor: "#1a237e",
                "&:hover": { bgcolor: "#283593" },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Sign In"}
            </Button>
          </Box>

          <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mt={3}>
            For assistance, see your market administrator.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
