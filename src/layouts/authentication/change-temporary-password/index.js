// MDU-022 (Heart QA 2026-09-29): a staff account created with a temporary
// password (Add Staff, staff upload, onboarding, or a password reset) must
// change it before the server will answer anything else (403 "Change your
// temporary password first." — users/authentication.py). Sign-in sends the
// person here; so does the API client if it ever sees that 403.
import React, { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import apiClient from "api/axios";
import { useAuth } from "context/AuthContext";
import { landingPathForRole } from "utils/landingPath";

function firstMessage(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const field = ["new_password", "old_password"].find((k) => data[k]);
  if (field) return [].concat(data[field]).join(" ");
  return null;
}

export default function ChangeTemporaryPassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { userProfile, setUserProfile, logout } = useAuth();

  const mismatch = confirm !== "" && next !== confirm;
  const valid = current && next && next === confirm && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setError("");
    setLoading(true);
    try {
      await apiClient.post("/auth/change-password/", { old_password: current, new_password: next });
      const { data } = await apiClient.get("/users/profile/");
      setUserProfile(data);
      navigate(landingPathForRole(data.role || userProfile?.role), { replace: true });
    } catch (err) {
      setError(
        firstMessage(err?.response?.data) || "Could not change the password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    logout();
    navigate("/authentication/sign-in", { replace: true });
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f3f6fb"
    >
      <Card sx={{ minWidth: 350, maxWidth: 440, p: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Choose a new password
          </Typography>
          <Alert severity="info" sx={{ mb: 1 }}>
            You signed in with a temporary password. Choose your own to continue — nothing else
            works until you do.
          </Alert>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Temporary password"
              type={showPw ? "text" : "password"}
              fullWidth
              margin="normal"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
            <TextField
              label="New password"
              type={showPw ? "text" : "password"}
              fullWidth
              margin="normal"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPw((v) => !v)}
                      edge="end"
                      aria-label={showPw ? "Hide passwords" : "Show passwords"}
                    >
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm new password"
              type={showPw ? "text" : "password"}
              fullWidth
              margin="normal"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
              error={mismatch}
              helperText={mismatch ? "Passwords don't match." : " "}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={!valid}
              startIcon={loading && <CircularProgress size={18} />}
            >
              {loading ? "Saving..." : "Change password"}
            </Button>
            <Button
              variant="text"
              size="small"
              fullWidth
              sx={{ mt: 1 }}
              onClick={handleCancel}
              disabled={loading}
            >
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
