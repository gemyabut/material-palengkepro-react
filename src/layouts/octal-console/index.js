// src/layouts/octal-console/index.js — Unit 26 / F1.3
// Read-only Octal Philippines platform admin console: all client subscriptions.
// Access: role=system_administrator OR is_staff=True.
// No mutation actions in v1 — Change Plan + Suspend deferred to Phase 5.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
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
import { getSubscriptionList } from "api/octalConsole";

// ── Helpers ───────────────────────────────────────────────────────────────────

// BillingAccount.company StringRelatedField returns "Name (CODE)"
function parseCompany(str) {
  const m = String(str || "").match(/^(.*)\s+\(([^)]+)\)$/);
  return m ? { name: m[1], code: m[2] } : { name: str || "—", code: "—" };
}

// SubscriptionItem.market StringRelatedField returns "Name (CODE)" — extract code only
function marketCodes(items) {
  if (!items?.length) return "—";
  return items
    .map((i) => {
      const m = String(i.market || "").match(/\(([^)]+)\)$/);
      return m ? m[1] : i.market;
    })
    .join(", ");
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
  past_due: "warning",
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
  // past_due gets orange via sx since MUI has no orange color token
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

// ── Main component ─────────────────────────────────────────────────────────────

export default function OctalConsole() {
  const { userProfile, loading: authLoading } = useAuthProfile();
  const navigate = useNavigate();

  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAllowed =
    !authLoading &&
    ((userProfile?.role || "").toLowerCase() === "system_administrator" ||
      userProfile?.is_staff === true);

  const load = () => {
    setLoading(true);
    setError(null);
    getSubscriptionList()
      .then(setSubs)
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
          <MDTypography variant="h4">Client Subscriptions</MDTypography>
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
          <Card>
            <CardContent sx={{ p: 0 }}>
              {subs.length === 0 ? (
                <MDBox p={4} textAlign="center">
                  <MDTypography variant="body2" color="text">
                    No subscriptions yet. Onboard your first client at{" "}
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => navigate("/administration")}
                      sx={{ textTransform: "none", p: 0, minWidth: 0, verticalAlign: "baseline" }}
                    >
                      /administration
                    </Button>
                    .
                  </MDTypography>
                </MDBox>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Company Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 130 }}>Company Code</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 200 }}>Market Code(s)</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 130 }}>Tier</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 110 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 115 }}>Start Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 110 }} align="right">
                        Seats Cap
                      </TableCell>
                      <TableCell sx={{ width: 120 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subs.map((sub) => {
                      const company = parseCompany(sub._account?.company);
                      return (
                        <TableRow key={sub.id} hover>
                          <TableCell>{company.name}</TableCell>
                          <TableCell>{company.code}</TableCell>
                          <TableCell>{marketCodes(sub.items)}</TableCell>
                          <TableCell>
                            <TierChip tier={sub.tier} />
                          </TableCell>
                          <TableCell>
                            <StatusChip status={sub.status} />
                          </TableCell>
                          <TableCell>{sub.start_date || "—"}</TableCell>
                          <TableCell align="right">
                            {sub.seats_cap === 0 ? "∞" : sub.seats_cap ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate(`/octal-console/subscription/${sub.id}`)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
