/**
 * Tenant Portal — Dashboard page (Unit 15, DEC-042).
 *
 * Shows: outstanding balance (prominent), active leases, last payment.
 * D8: read-only contact info block.
 * Kiosk-friendly: large balance display, touch-friendly nav buttons.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar, Box, Card, CardContent, Typography, Alert, CircularProgress,
  Grid, Chip, Divider, Button, Stack,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

import PortalLayout from "./PortalLayout";
import { tenantPortalApi } from "api/tenantPortal";
import { getTenantToken, clearTenantSession } from "utils/tenantPortalAuth";

const peso = (v) => `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export default function TenantDashboard() {
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const load = useCallback(async () => {
    if (!getTenantToken()) { navigate("/tenant/login", { replace: true }); return; }
    setLoading(true);
    setError(null);
    try {
      const resp = await tenantPortalApi.dashboard();
      setData(resp);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearTenantSession();
        navigate("/tenant/login", { replace: true });
      } else {
        setError(err.message || "Failed to load dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  return (
    <PortalLayout>
      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={48} />
        </Box>
      )}

      {error && <Alert severity="error" onClose={load}>{error}</Alert>}

      {data && (
        <Stack spacing={3}>
          {/* Outstanding balance — prominent kiosk display */}
          <Card sx={{ bgcolor: Number(data.outstanding_balance) > 0 ? "#fff8e1" : "#e8f5e9", boxShadow: 3 }}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 48, color: "#1a237e", mb: 1 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Outstanding Balance
              </Typography>
              <Typography variant="h2" fontWeight={800} color={Number(data.outstanding_balance) > 0 ? "#b71c1c" : "#2e7d32"}>
                {peso(data.outstanding_balance)}
              </Typography>
              {data.outstanding_count > 0 && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {data.outstanding_count} unpaid invoice{data.outstanding_count !== 1 ? "s" : ""}
                </Typography>
              )}
              <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                As of {data.as_of}
              </Typography>
            </CardContent>
          </Card>

          {/* Navigation shortcuts */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<ReceiptLongIcon />}
                onClick={() => navigate("/tenant/soa")}
                sx={{ py: 2.5, fontSize: "1rem", borderColor: "#1a237e", color: "#1a237e" }}
              >
                Statement of Account
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<ListAltIcon />}
                onClick={() => navigate("/tenant/payments")}
                sx={{ py: 2.5, fontSize: "1rem", borderColor: "#1a237e", color: "#1a237e" }}
              >
                Payment History
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<PhotoCameraIcon />}
                onClick={() => navigate("/tenant/documents")}
                sx={{ py: 2.5, fontSize: "1rem", borderColor: "#1a237e", color: "#1a237e" }}
              >
                Upload Document
              </Button>
            </Grid>
          </Grid>

          {/* Active leases */}
          {data.leases?.length > 0 && (
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <StorefrontIcon color="action" />
                  <Typography variant="h6">Active Leases</Typography>
                </Stack>
                {data.leases.map((l, i) => (
                  <Box key={i} sx={{ mb: i < data.leases.length - 1 ? 1.5 : 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography fontWeight={600}>{l.stall_number} — {l.market}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {l.start_date} to {l.end_date}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography fontWeight={600}>{peso(l.lease_amount)}/mo</Typography>
                        <Chip size="small" label={l.status} color="success" variant="outlined" />
                      </Box>
                    </Stack>
                    {i < data.leases.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Last payment */}
          {data.last_payment && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Last Payment</Typography>
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography fontWeight={600}>{data.last_payment.date}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">Amount</Typography>
                    <Typography fontWeight={600} color="success.main">{peso(data.last_payment.amount)}</Typography>
                  </Box>
                </Stack>
                {data.last_payment.receipt_number && (
                  <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
                    Receipt: {data.last_payment.receipt_number}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* D8: Contact info (read-only) */}
          {data.contact && (
            <Card sx={{ bgcolor: "#fafafa" }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Your Contact Information
                </Typography>
                <Stack direction="row" spacing={2} mb={2}>
                  <Box textAlign="center">
                    {data.contact.photograph_url ? (
                      <Box
                        component="img"
                        src={data.contact.photograph_url}
                        alt="Your photo"
                        sx={{ width: 72, height: 72, borderRadius: 2, objectFit: "cover" }}
                      />
                    ) : (
                      <Avatar sx={{ width: 72, height: 72, bgcolor: "grey.300" }}>
                        <PhotoCameraIcon />
                      </Avatar>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block">
                      You
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    {data.contact.contact_photograph_url ? (
                      <Box
                        component="img"
                        src={data.contact.contact_photograph_url}
                        alt="Contact person"
                        sx={{ width: 72, height: 72, borderRadius: 2, objectFit: "cover" }}
                      />
                    ) : (
                      <Avatar sx={{ width: 72, height: 72, bgcolor: "grey.300" }}>
                        <PhotoCameraIcon />
                      </Avatar>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block">
                      Contact Person
                    </Typography>
                  </Box>
                </Stack>
                <Stack spacing={0.5}>
                  <Typography variant="body2"><strong>Name:</strong> {data.contact.full_name}</Typography>
                  {data.contact.mobile_phone && (
                    <Typography variant="body2"><strong>Mobile:</strong> {data.contact.mobile_phone}</Typography>
                  )}
                  {data.contact.email_address && (
                    <Typography variant="body2"><strong>Email:</strong> {data.contact.email_address}</Typography>
                  )}
                  <Typography variant="caption" color="text.disabled">
                    To update contact info, see your market administrator.
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}
    </PortalLayout>
  );
}
