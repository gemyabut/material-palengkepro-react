// src/layouts/profile/change-password/index.js — Unit 26 / F1.2
import { useState } from "react";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import apiClient from "api/axios";

export default function ChangePassword() {
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [status,   setStatus]   = useState(null); // null | "success" | "error"
  const [errMsg,   setErrMsg]   = useState("");
  const [loading,  setLoading]  = useState(false);

  const valid = current.trim() && next.trim() && next === confirm;

  const handleSubmit = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setStatus(null);
    try {
      await apiClient.post("/auth/change-password/", {
        old_password: current,
        new_password: next,
      });
      setStatus("success");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setStatus("error");
      const detail = err?.response?.data?.detail
        || err?.response?.data?.new_password?.[0]
        || err?.response?.data?.old_password?.[0]
        || "Password change failed. Check current password.";
      setErrMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  const pwAdornment = (
    <InputAdornment position="end">
      <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">
        <Icon fontSize="small">{showPw ? "visibility_off" : "visibility"}</Icon>
      </IconButton>
    </InputAdornment>
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container justifyContent="center">
          <Grid item xs={12} md={5}>
            <Card>
              <MDBox p={3}>
                <MDTypography variant="h5" fontWeight="bold" mb={0.5}>
                  Change Password
                </MDTypography>
                <MDTypography variant="body2" color="text" mb={3}>
                  Enter your current password and choose a new one.
                </MDTypography>

                {status === "success" && (
                  <MDTypography variant="caption" color="success" display="block" mb={2}>
                    ✓ Password changed successfully.
                  </MDTypography>
                )}
                {status === "error" && (
                  <MDTypography variant="caption" color="error" display="block" mb={2}>
                    {errMsg}
                  </MDTypography>
                )}

                <MDInput
                  label="Current password"
                  type={showPw ? "text" : "password"}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  fullWidth
                  InputProps={{ endAdornment: pwAdornment }}
                  sx={{ mb: 2 }}
                />
                <MDInput
                  label="New password"
                  type={showPw ? "text" : "password"}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <MDInput
                  label="Confirm new password"
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  error={confirm.length > 0 && next !== confirm}
                  helperText={confirm.length > 0 && next !== confirm ? "Passwords do not match" : ""}
                  fullWidth
                  sx={{ mb: 3 }}
                />
                <MDButton
                  variant="gradient"
                  color="info"
                  onClick={handleSubmit}
                  disabled={!valid || loading}
                  fullWidth
                >
                  {loading ? "Saving…" : "Change Password"}
                </MDButton>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}
