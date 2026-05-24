// src/layouts/profile/index.js
import React from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import MDBox from "components/MDBox";

import Header from "./components/Header";
import EditableFields from "./components/EditableFields";
import ContactInfo from "./components/ContactInfo";
import AddressFields from "./components/AddressFields";
import GovernmentIDUpload from "./components/GovernmentIDUpload";
import SaveButton from "./components/SaveButton";
import ChangePassword from "./components/ChangePassword";
import PlatformSettings from "./components/PlatformSettings";
import TenantDetails from "./components/TenantDetails";

import useProfile from "./hooks/useProfile";

export default function Profile() {
  const { profile, setProfile, loading, saving, handleSave, snackbar, setSnackbar } = useProfile();

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

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={6} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Header profile={profile} />
          </Grid>

          <Grid item xs={12} md={6}>
            <EditableFields profile={profile} setProfile={setProfile} />
            <ContactInfo profile={profile} setProfile={setProfile} />
            <AddressFields profile={profile} setProfile={setProfile} />
            <GovernmentIDUpload profile={profile} setProfile={setProfile} />

            {/* Tenant-specific fields */}
            {isTenant && <TenantDetails profile={profile} setProfile={setProfile} />}

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
            <PlatformSettings profile={profile} setProfile={setProfile} />
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}
