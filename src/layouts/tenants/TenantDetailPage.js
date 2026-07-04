// src/layouts/tenants/TenantDetailPage.js — Unit 28
// Route-level wrapper for /tenants/:id. Fetches tenant by id, renders TenantDetail.
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, Typography } from "@mui/material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";

import TenantDetail from "./components/TenantDetail";
import { getTenantById } from "./api/tenants";
import { useAuth } from "context/AuthContext";

export default function TenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile: user } = useAuth();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getTenantById(id)
      .then(setTenant)
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load tenant."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={2}>
          <Button variant="outlined" size="small" onClick={() => navigate("/tenants")}>
            ← Back to Tenants
          </Button>
        </MDBox>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <TenantDetail tenant={tenant} user={user} showEdit={false} />
        )}
      </MDBox>
    </DashboardLayout>
  );
}
