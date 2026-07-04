// src/layouts/octal-console/index.js — Unit 26 / F1.4
// Markets-first view: every Market in the platform with its subscription status.
// Unsubscribed markets show "Onboard" → /administration.
// Subscribed markets show tier/status and "View" → detail placeholder.
// Access: role=system_administrator OR is_staff=True.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { useAuthProfile } from "context/AuthContext";
import { getOctalConsoleData } from "api/octalConsole";

// ── Helpers ───────────────────────────────────────────────────────────────────

// BillingAccount.company StringRelatedField returns "Name (CODE)" — extract name only
function companyName(accountDetail) {
  if (!accountDetail?.company) return "—";
  const m = String(accountDetail.company).match(/^(.*)\s+\([^)]+\)$/);
  return m ? m[1] : accountDetail.company;
}

const TIER_COLOR = {
  community: "default",
  standard: "info",
  pro: "secondary",
  enterprise: "success",
};

const STATUS_COLOR = {
  active: "success",
  trialing: "warning",
  suspended: "error",
  cancelled: "error",
  expired: "error",
};

function TierChip({ tier }) {
  const t = (tier || "").toLowerCase();
  return (
    <Chip
      size="small"
      label={t ? t.charAt(0).toUpperCase() + t.slice(1) : "—"}
      color={TIER_COLOR[t] || "default"}
    />
  );
}

function StatusChip({ status }) {
  if (!status) return <Chip size="small" label="—" color="default" />;
  const s = status.toLowerCase();
  const isOrange = s === "past_due";
  return (
    <Chip
      size="small"
      label={s.replace(/_/g, " ")}
      color={isOrange ? "default" : STATUS_COLOR[s] || "default"}
      sx={isOrange ? { bgcolor: "warning.main", color: "white" } : undefined}
    />
  );
}

// ── Summary cards ─────────────────────────────────────────────────────────────

function SummaryCards({ markets, subscriptionByMarketCode }) {
  const total = markets.length;
  const subscribed = markets.filter((m) => subscriptionByMarketCode[m.code]).length;
  const pending = total - subscribed;

  const stats = [
    { label: "Total Markets", value: total, color: "info" },
    { label: "Subscribed", value: subscribed, color: "success" },
    { label: "Pending Onboarding", value: pending, color: pending > 0 ? "warning" : "default" },
  ];

  return (
    <Grid container spacing={2} mb={2}>
      {stats.map((s) => (
        <Grid item xs={12} sm={4} key={s.label}>
          <Card>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <MDTypography variant="caption" color="text" display="block">
                {s.label}
              </MDTypography>
              <MDTypography variant="h4" color={s.color}>
                {s.value}
              </MDTypography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OctalConsole() {
  const { userProfile, loading: authLoading } = useAuthProfile();
  const navigate = useNavigate();

  const [markets, setMarkets] = useState([]);
  const [subscriptionByMarketCode, setSubscriptionByMarketCode] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAllowed =
    !authLoading &&
    ((userProfile?.role || "").toLowerCase() === "system_administrator" ||
      userProfile?.is_staff === true);

  const load = () => {
    setLoading(true);
    setError(null);
    getOctalConsoleData()
      .then(({ markets: m, subscriptionByMarketCode: s }) => {
        setMarkets(m);
        setSubscriptionByMarketCode(s);
      })
      .catch((e) => setError(e?.response?.data?.detail || e.message || "Failed to load."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAllowed) {
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line
  }, [authLoading, isAllowed]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDTypography variant="h4">Octal Console</MDTypography>
          {isAllowed && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={load}
              disabled={loading}
            >
              Refresh
            </Button>
          )}
        </MDBox>

        {!authLoading && !isAllowed ? (
          <Alert severity="error">
            Access restricted to Octal platform administrators. Log in as{" "}
            <strong>system_administrator</strong> or an is_staff account.
          </Alert>
        ) : authLoading || loading ? (
          <LinearProgress color="info" />
        ) : error ? (
          <Alert severity="error">{String(error)}</Alert>
        ) : (
          <>
            <SummaryCards
              markets={markets}
              subscriptionByMarketCode={subscriptionByMarketCode}
            />

            <Card>
              <CardContent sx={{ p: 0 }}>
                {markets.length === 0 ? (
                  <MDBox p={4} textAlign="center">
                    <MDTypography variant="body2" color="text">
                      No markets in platform yet.
                    </MDTypography>
                  </MDBox>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: 110 }}>Market Code</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Market Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 130 }}>Subscription Tier</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 110 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 115 }}>Start Date</TableCell>
                        <TableCell sx={{ width: 120 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {markets.map((market) => {
                        const entry = subscriptionByMarketCode[market.code];
                        const sub = entry?.sub;
                        const acct = entry?.account;
                        return (
                          <TableRow key={market.id} hover>
                            <TableCell>
                              <MDTypography variant="button" fontWeight="medium">
                                {market.code}
                              </MDTypography>
                            </TableCell>
                            <TableCell>{market.name}</TableCell>
                            <TableCell>{companyName(acct)}</TableCell>
                            <TableCell>
                              {sub ? (
                                <TierChip tier={sub.tier} />
                              ) : (
                                <Chip size="small" label="Not subscribed" color="default" />
                              )}
                            </TableCell>
                            <TableCell>
                              {sub ? <StatusChip status={sub.status} /> : "—"}
                            </TableCell>
                            <TableCell>{sub?.start_date ?? "—"}</TableCell>
                            <TableCell>
                              {sub ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() =>
                                    navigate(`/octal-console/subscription/${sub.id}`)
                                  }
                                >
                                  View
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => navigate("/administration")}
                                >
                                  Onboard
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
