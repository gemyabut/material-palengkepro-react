import React, { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "context/AuthContext";
import { debugLog } from "layouts/stalls/utils/debug";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

function SignIn() {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUserProfile } = useAuth();

  const handleChange = (e) => {
    setCredentials((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      debugLog("[SignIn] Authenticating...");

      const authRes = await axios.post(`${API_URL}/auth/jwt/create/`, {
        username: credentials.username,
        password: credentials.password,
      });

      const { access, refresh } = authRes.data;

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("access_token", access);
      storage.setItem("refresh_token", refresh);

      const profileRes = await axios.get(`${API_URL}/users/profile/`, {
        headers: { Authorization: `Bearer ${access}` },
      });

      setUserProfile(profileRes.data);
      debugLog("[SignIn] Profile loaded:", profileRes.data);

      navigate("/dashboard");
    } catch (err) {
      const detail = err.response?.data?.detail || "Login failed. Please try again.";
      debugLog("[SignIn] Login failed:", err);
      setErrorMessage(detail);
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
            PalengkeProPH Login
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              name="username"
              label="Username, Email, or Mobile"
              placeholder="e.g. juan123 or 0917..."
              fullWidth
              margin="normal"
              value={credentials.username}
              onChange={handleChange}
              required
              autoComplete="username"
              helperText="Enter your username, email address, or mobile number"
              disabled={loading}
            />
            <TextField
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={credentials.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Remember me"
              sx={{ mt: 1, mb: 1 }}
            />

            {errorMessage && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
              startIcon={loading && <CircularProgress size={18} />}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Box display="flex" justifyContent="space-between" mt={2}>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate("/authentication/forgot-password")}
                disabled={loading}
              >
                Forgot password?
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate("/authentication/sign-up")}
                disabled={loading}
              >
                Sign up
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default SignIn;
