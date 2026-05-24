// src/layouts/tenants/pages/TenantSelfPortal.js

import React, { useState, useEffect } from "react";
import { Stack, Paper, Typography, CircularProgress, Button } from "@mui/material";

import TenantDetail from "../components/TenantDetail";
import RequestUpdateModal from "../components/RequestUpdateModal";

import { getTenantById } from "../api/tenants";
import { useAuth } from "context/AuthContext";
import { debugLog } from "../../stalls/utils/debug";

// Temporary mock placeholders for future data
const mockStalls = [];
const mockLeases = [];
const mockPayments = [];
const mockSOA = [];

export default function TenantSelfPortal() {
  const { userProfile: user } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    setLoading(true);
    getTenantById("me")
      .then((data) => {
        setTenant(data);
        debugLog("[TenantSelfPortal] Fetched tenant profile:", data);
      })
      .catch((err) => debugLog("[TenantSelfPortal] Error fetching tenant:", err))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleRequestUpdate = () => setShowUpdate(true);

  return (
    <Stack spacing={2}>
      <Typography variant="h5">My Tenant Profile</Typography>

      {loading ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <TenantDetail
            tenant={tenant}
            user={user}
            onRequestUpdate={handleRequestUpdate}
            showEdit={false}
          />
        </Paper>
      )}

      {/* TODO: Replace mock sections with real components */}
      {/* <StallsTable stalls={mockStalls} /> */}
      {/* <LeasesTable leases={mockLeases} /> */}
      {/* <PaymentsTable payments={mockPayments} /> */}
      {/* <StatementOfAccountTable soa={mockSOA} /> */}

      <RequestUpdateModal
        open={showUpdate}
        onClose={() => setShowUpdate(false)}
        onSubmit={(fields) => {
          debugLog("[TenantSelfPortal] Request update submitted:", fields);
          setShowUpdate(false);
          // TODO: API call to submit request
        }}
      />
    </Stack>
  );
}
