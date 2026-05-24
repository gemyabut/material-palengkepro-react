// src/layouts/authentication/sign-in/SignIn.js
import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "context/AuthContext"; // <-- Context import
import { debugLog } from "../../stalls/utils/debug"; // <-- Optional: for debugging

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

function SignIn() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUserProfile } = useAuth(); // <-- Context setter

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      debugLog("[SignIn] Logging in...");
      // 1. Authenticate user and get tokens
      const res = await axios.post(`${API_URL}/auth/login/`, {
        username: login,
        password,
      });
      const { access, refresh } = res.data;

      if (rememberMe) {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
      } else {
        sessionStorage.setItem("access_token", access);
        sessionStorage.setItem("refresh_token", refresh);
      }

      // 2. Fetch profile using new token, and save to context
      const profileRes = await axios.get(`${API_URL}/users/profile/`, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });
      setUserProfile(profileRes.data);
      debugLog("[SignIn] Login successful, profile loaded:", profileRes.data);

      // 3. Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
      debugLog("[SignIn] Login error:", err);
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
              label="Username, Email, or Mobile"
              placeholder="e.g. juan123, juan@email.com, 09171234567"
              variant="outlined"
              margin="normal"
              fullWidth
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              helperText="Enter your username, email address, or mobile number."
              autoComplete="username"
              disabled={loading}
            />
            <TextField
              label="Password"
              variant="outlined"
              margin="normal"
              fullWidth
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((show) => !show)}
                      edge="end"
                      size="large"
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
                  color="primary"
                  disabled={loading}
                />
              }
              label="Remember me"
              sx={{ mt: 1, mb: 1 }}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} /> : null}
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
