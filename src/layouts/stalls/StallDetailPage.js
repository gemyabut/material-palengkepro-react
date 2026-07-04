// src/layouts/stalls/StallDetailPage.js — F9
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, Typography } from "@mui/material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";

import StallDetail from "./components/StallDetail";
import { fetchStall } from "./api/stalls";

export default function StallDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [stall, setStall]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchStall(id)
      .then(setStall)
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load stall."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={2}>
          <Button variant="outlined" size="small" onClick={() => navigate("/stalls")}>
            ← Back to Stalls
          </Button>
        </MDBox>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <StallDetail stall={stall} showEdit={false} />
        )}
      </MDBox>
    </DashboardLayout>
  );
}
