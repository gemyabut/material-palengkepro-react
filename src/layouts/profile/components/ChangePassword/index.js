// profile/components/ChangePassword/index.js

import React, { useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MDTypography from "components/MDTypography";
import { changePassword } from "../../api/changePasswordApi";

const ChangePassword = () => {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async () => {
    if (form.new_password !== form.confirm_password) {
      setError("New password and confirmation do not match.");
      return;
    }
    try {
      await changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess("Password changed successfully.");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setError("Failed to change password. Check your current password.");
    }
  };

  return (
    <Card>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Change Password
        </MDTypography>
        <TextField
          fullWidth
          label="Current Password"
          name="current_password"
          type="password"
          value={form.current_password}
          onChange={handleChange}
          margin="normal"
        />
        <TextField
          fullWidth
          label="New Password"
          name="new_password"
          type="password"
          value={form.new_password}
          onChange={handleChange}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Confirm New Password"
          name="confirm_password"
          type="password"
          value={form.confirm_password}
          onChange={handleChange}
          margin="normal"
        />
        {error && (
          <MDTypography color="error" mt={1}>
            {error}
          </MDTypography>
        )}
        {success && (
          <MDTypography color="success.main" mt={1}>
            {success}
          </MDTypography>
        )}
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSubmit}>
          Update Password
        </Button>
      </CardContent>
    </Card>
  );
};

export default ChangePassword;
