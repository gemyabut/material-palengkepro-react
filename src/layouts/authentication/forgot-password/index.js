import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

function ForgotPassword() {
  const [login, setLogin] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoading(true);
    try {
      // You may need to adjust the endpoint path to match your Django backend
      const res = await axios.post(`${API_URL}/auth/password/reset/`, {
        login, // backend should accept username/email/mobile
      });
      setSuccess(
        "If an account with those details exists, a password reset link was sent. Please check your email or SMS."
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Request failed. Please try again or contact admin.");
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
            Forgot Password
          </Typography>
          <Typography variant="body2" gutterBottom>
            Enter your username, email, or mobile. We will send a password reset link if your
            account exists.
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Username, Email, or Mobile"
              variant="outlined"
              margin="normal"
              fullWidth
              value={login}
              onChange={(e) => setLogin(e.target.value)}
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
              {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;
