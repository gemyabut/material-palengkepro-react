import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL =
  process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000/api`;

function SignUp() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    mobile_number: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });
  const [registration_code, setRegistrationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/register/`, {
        username: form.username,
        password: form.password,
        email: form.email,
        mobile_number: form.mobile_number,
        first_name: form.first_name,
        last_name: form.last_name,
        registration_code: registration_code, // send to backend!
      });
      setSuccess("Registration successful! You may now log in.");
      setLoading(false);
      setTimeout(() => navigate("/authentication/sign-in"), 2000);
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        let msg = "";
        if (typeof errorData === "string") {
          msg = errorData;
        } else if (typeof errorData === "object") {
          msg = Object.values(errorData).flat().join(", ");
        }
        setError(msg || "Registration failed. Please check your info.");
      } else {
        setError("Registration failed. Please check your info.");
      }
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
      <Card sx={{ minWidth: 400, p: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            PalengkeProPH Registration
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box display="flex" gap={2}>
              <TextField
                label="First Name"
                name="first_name"
                variant="outlined"
                margin="normal"
                fullWidth
                value={form.first_name}
                onChange={handleChange}
                required
              />
              <TextField
                label="Last Name"
                name="last_name"
                variant="outlined"
                margin="normal"
                fullWidth
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </Box>
            <TextField
              label="Username"
              name="username"
              variant="outlined"
              margin="normal"
              fullWidth
              value={form.username}
              onChange={handleChange}
              required
            />

            <TextField
              label="Email"
              name="email"
              variant="outlined"
              margin="normal"
              fullWidth
              value={form.email}
              onChange={handleChange}
              type="email"
              required
            />
            <TextField
              label="Mobile Number"
              name="mobile_number"
              variant="outlined"
              margin="normal"
              fullWidth
              value={form.mobile_number}
              onChange={handleChange}
              placeholder="e.g. 09171234567"
              required
            />
            <TextField
              label="Password"
              name="password"
              variant="outlined"
              margin="normal"
              fullWidth
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((show) => !show)}
                      edge="end"
                      size="large"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm Password"
              name="confirmPassword"
              variant="outlined"
              margin="normal"
              fullWidth
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
            <TextField
              label="Registration Code (optional)"
              fullWidth
              value={registration_code}
              onChange={(e) => setRegistrationCode(e.target.value)}
              sx={{ mt: 2 }}
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
              {loading ? "Registering..." : "Register"}
            </Button>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate("/authentication/sign-in")}
              >
                Already have an account? Login
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default SignUp;
