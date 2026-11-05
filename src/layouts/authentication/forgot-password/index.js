import React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";

// MDU-020 (Lead 2026-11-05): password reset by email is off until email is
// set up. This page only tells people who to ask; it makes no API call.
function ForgotPassword() {
  const navigate = useNavigate();

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
            Forgot Password
          </Typography>
          <Typography variant="body2" gutterBottom>
            Ask your Market Administrator to reset your password. They&apos;ll give you a temporary
            password, and you&apos;ll choose your own when you sign in.
          </Typography>
          <Typography variant="body2" gutterBottom>
            Market Administrators and Finance Heads: ask your Owner. Owners: contact Octal.
          </Typography>
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button variant="text" size="small" onClick={() => navigate("/authentication/sign-in")}>
              Back to Login
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ForgotPassword;
