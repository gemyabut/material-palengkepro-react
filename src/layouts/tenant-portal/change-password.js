/**
 * Tenant Portal — Change Password page (Unit 15, DEC-042).
 *
 * D3: Shown on first login when must_change_password=true.
 * On success: clears the flag from session, navigates to dashboard.
 * Kiosk-friendly layout; no operator sidebar.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, TextField, Button, Alert,
  CircularProgress, Typography,
} from "@mui/material";

import { useMaterialUIController, setLayout } from "context";
import { tenantPortalApi } from "api/tenantPortal";
import { getTenantToken, getTenantSession, setTenantSession, clearTenantSession } from "utils/tenantPortalAuth";

export default function TenantChangePassword() {
  const [, dispatch] = useMaterialUIController();
  const navigate = useNavigate();

  const [oldPwd, setOldPwd]         = useState("");
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    setLayout(dispatch, "page");
    if (!getTenantToken()) navigate("/tenant/login", { replace: true });
  }, [dispatch, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPwd.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await tenantPortalApi.changePassword(oldPwd, newPwd, confirmPwd);
      // Clear must_change_password flag locally
      const session = getTenantSession();
      setTenantSession({ ...session, must_change_password: false });
      navigate("/tenant/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to change password. Check your current password.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearTenantSession();
    navigate("/tenant/login", { replace: true });
  };

  const { tenantName } = getTenantSession();

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
            <Typography variant="h5" fontWeight={700} color="#1a237e" gutterBottom>
              Set a New Password
            </Typography>
            {tenantName && (
              <Typography variant="body2" color="text.secondary">
                Welcome, {tenantName}. Please set your password before continuing.
              </Typography>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type="password"
              label="Current (temporary) password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              autoFocus
              disabled={loading}
              sx={{ mb: 2.5 }}
            />
            <TextField
              fullWidth
              type="password"
              label="New password (min 8 characters)"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              disabled={loading}
              sx={{ mb: 2.5 }}
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm new password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              disabled={loading}
              sx={{ mb: 3.5 }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || !oldPwd || !newPwd || !confirmPwd}
              sx={{
                py: 1.75,
                fontSize: "1.1rem",
                fontWeight: 700,
                bgcolor: "#1a237e",
                "&:hover": { bgcolor: "#283593" },
                mb: 1.5,
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Change Password"}
            </Button>

            <Button fullWidth variant="text" onClick={handleCancel} disabled={loading}>
              Cancel and sign out
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
