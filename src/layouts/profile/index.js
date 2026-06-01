// src/layouts/profile/index.js

// src/layouts/profile/index.js
import React, { useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import MDBox from "components/MDBox";

import Header from "./components/Header";
import EditableFields from "./components/EditableFields";
import SaveButton from "./components/SaveButton";
import ChangePassword from "./components/ChangePassword";
import PlatformSettings from "./components/PlatformSettings";
import TenantDetails from "./components/TenantDetails";

import useProfile from "./hooks/useProfile";
import { updateProfile } from "./api/profileApi";
import Snackbar from "@mui/material/Snackbar";
import { debugLog } from "../stalls/utils/debug";

export default function Profile() {
  const { userProfile: profile, setUserProfile, loading, refreshProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  if (loading || !profile) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox mt={6} mb={3} display="flex" justifyContent="center">
          <CircularProgress />
        </MDBox>
      </DashboardLayout>
    );
  }

  const { role } = profile;
  const isTenant = role === "tenant";
  const isAdmin = role === "admin" || role === "admin_staff";
  const isCollector = role === "collector";

  // Save handler (calls updateProfile + context refresh)
  const handleSave = async () => {
    setSaving(true);
    try {
      debugLog("[Profile] handleSave: updating profile", profile);
      await updateProfile(profile);
      await refreshProfile();
      setSnackbar({ open: true, message: "Profile updated!", severity: "success" });
    } catch (err) {
      debugLog("[Profile] handleSave: failed", err);
      setSnackbar({
        open: true,
        message: "Failed to update profile.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={6} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Header profile={profile} />
          </Grid>

          <Grid item xs={12} md={6}>
            <EditableFields profile={profile} setProfile={setUserProfile} />

            {/* Tenant-specific fields */}
            {isTenant && <TenantDetails profile={profile} setProfile={setUserProfile} />}

            {/* Placeholder: Admin or Collector-specific fields could go here */}
            {isAdmin && (
              <MDBox mt={2}>
                <strong>Admin tools coming soon…</strong>
              </MDBox>
            )}

            {isCollector && (
              <MDBox mt={2}>
                <strong>Collector features to be added here…</strong>
              </MDBox>
            )}

            <SaveButton onClick={handleSave} loading={saving} />
          </Grid>

          <Grid item xs={12} md={6} display="flex" flexDirection="column" gap={2}>
            <ChangePassword />
            <PlatformSettings profile={profile} setProfile={setUserProfile} />
          </Grid>
        </Grid>
      </MDBox>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </DashboardLayout>
  );
}
