import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000/api`;

function PasswordResetConfirm() {
  const { uidb64, token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/password/reset/confirm/`, {
        uidb64,
        token,
        new_password: newPassword,
      });
      setSuccess("Password has been reset. You may now log in.");
      setTimeout(() => navigate("/authentication/sign-in"), 2000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Password reset failed. Please try again or request a new link."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f3f6fb"
    >
      <Card sx={{ minWidth: 350, p: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Reset Your Password
          </Typography>
          <Typography variant="body2" gutterBottom>
            Enter and confirm your new password.
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="New Password"
              type="password"
              variant="outlined"
              margin="normal"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <TextField
              label="Confirm New Password"
              type="password"
              variant="outlined"
              margin="normal"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate("/authentication/sign-in")}
              >
                Back to Login
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default PasswordResetConfirm;
