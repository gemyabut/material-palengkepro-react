// src/layouts/tenants/pages/GuestFallback.js
import React from "react";
import { Typography, Box } from "@mui/material";

export default function GuestFallback() {
  return (
    <Box p={4} textAlign="center">
      <Typography variant="h6" color="error">
        You are not logged in. Please log in to access the tenants module.
      </Typography>
    </Box>
  );
}
