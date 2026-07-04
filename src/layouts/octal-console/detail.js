// src/layouts/octal-console/detail.js — Unit 26 / F1.5
// Full subscription detail: Company · Market(s) · Subscription · Operators · Tenants.
// Reads from GET /api/billing/subscriptions/:id/detail-full/ (platform-admin scoped).
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { useAuthProfile } from "context/AuthContext";
import { getSubscriptionDetail } from "api/octalConsole";

// ── Helpers ────────────────────────────────────────────────────────────────────

const ROLE_LABEL = {
  executive: "Executive",
  finance_head: "Finance Head",
  market_administrator: "Market Administrator",
  admin_staff: "Admin Staff",
  leasing_officer: "Leasing & Marketing Officer",
  accounts_receivable: "Accounts Receivable",
  accounts_payable: "Accounts Payable",
  cashier: "Cashier",
  collector: "Collector",
  system_administrator: "System Administrator",
  // legacy fallbacks
  market_manager: "Market Manager (legacy)",
  admin: "Admin (legacy)",
};

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

function KV({ label, value }) {
  const isElement = typeof value === "object" && value !== null;
  return (
    <MDBox
      display="flex"
      alignItems="center"
      py={0.5}
      sx={{ borderBottom: "1px dashed rgba(0,0,0,0.06)" }}
    >
      <MDTypography variant="caption" color="text" sx={{ minWidth: 130 }}>
        {label}
      </MDTypography>
      {isElement ? (
        <MDBox sx={{ fontWeight: 500 }}>{value}</MDBox>
      ) : (
        <MDTypography variant="body2" sx={{ fontWeight: 500 }}>
          {value ?? "—"}
        </MDTypography>
      )}
    </MDBox>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <MDTypography variant="h6" mb={0.5}>{title}</MDTypography>
        {subtitle && (
          <MDTypography variant="caption" color="text" display="block" mb={1}>
            {subtitle}
          </MDTypography>
        )}
        <Divider sx={{ mb: 1 }} />
        {children}
      </CardContent>
    </Card>
  );
}

function fmtAddress(addr) {
  if (!addr) return "—";
  if (typeof addr === "string") return addr || "—";
  const parts = [addr.line1, addr.line2, addr.city, addr.province, addr.zip].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function fmtDateTime(iso) {
  if (!iso) return "Never";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function OctalConsoleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, loading: authLoading } = useAuthProfile();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAllowed =
    !authLoading &&
    ((userProfile?.role || "").toLowerCase() === "system_administrator" ||
      userProfile?.is_staff === true);

  useEffect(() => {
    if (authLoading || !isAllowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getSubscriptionDetail(id)
      .then(setData)
      .catch((e) => setError(e?.response?.data?.detail || e.message || "Failed to load."))
      .finally(() => setLoading(false));
  }, [id, authLoading, isAllowed]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDBox>
            <MDTypography variant="h4">Subscription #{id}</MDTypography>
            {data?.company?.name && (
              <MDTypography variant="body2" color="text">
                {data.company.name} · Market {data.markets?.map((m) => m.code).join(", ")}
              </MDTypography>
            )}
          </MDBox>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/octal-console")}
          >
            Back
          </Button>
        </MDBox>

        {!isAllowed && !authLoading ? (
          <Alert severity="error">
            Access restricted to Octal platform administrators.
          </Alert>
        ) : authLoading || loading ? (
          <LinearProgress color="info" />
        ) : error ? (
          <Alert severity="error">{String(error)}</Alert>
        ) : !data ? null : (
          <>
            {/* Row 1: Company · Subscription */}
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} md={6}>
                <SectionCard title="Company" subtitle="Client organization operating the market(s)">
                  <KV label="Name" value={data.company.name} />
                  <KV label="Code" value={data.company.code} />
                  <KV label="Contact person" value={data.company.contact_person} />
                  <KV label="Email" value={data.company.email} />
                  <KV label="Phone" value={data.company.phone} />
                  <KV label="Address" value={fmtAddress(data.company.address)} />
                  <KV
                    label="Active"
                    value={
                      <Chip
                        size="small"
                        label={data.company.active ? "Active" : "Inactive"}
                        color={data.company.active ? "success" : "default"}
                      />
                    }
                  />
                </SectionCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <SectionCard title="Subscription" subtitle="Plan, status, dates and billing">
                  <KV
                    label="Tier"
                    value={
                      <Chip
                        size="small"
                        label={
                          (data.subscription.tier || "—").charAt(0).toUpperCase() +
                          (data.subscription.tier || "").slice(1)
                        }
                        color={TIER_COLOR[(data.subscription.tier || "").toLowerCase()] || "default"}
                      />
                    }
                  />
                  <KV
                    label="Status"
                    value={
                      <Chip
                        size="small"
                        label={data.subscription.status}
                        color={STATUS_COLOR[(data.subscription.status || "").toLowerCase()] || "default"}
                      />
                    }
                  />
                  <KV label="Start date" value={fmtDate(data.subscription.start_date)} />
                  <KV label="End date" value={fmtDate(data.subscription.end_date)} />
                  <KV label="Discount %" value={data.subscription.discount_pct ?? "—"} />
                  <KV label="Seats cap" value={data.subscription.seats_cap ?? "—"} />
                  <KV label="Billing email" value={data.account?.billing_email} />
                </SectionCard>
              </Grid>
            </Grid>

            {/* Row 2: Markets */}
            <MDBox mb={2}>
              <SectionCard title="Market(s)" subtitle={`${data.markets.length} market(s) covered by this subscription`}>
                {data.markets.length === 0 ? (
                  <MDTypography variant="body2" color="text">No markets attached.</MDTypography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Currency</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.markets.map((m) => (
                        <TableRow key={m.id} hover>
                          <TableCell><strong>{m.code}</strong></TableCell>
                          <TableCell>{m.name}</TableCell>
                          <TableCell>
                            {[m.barangay, m.city_municipality, m.province].filter(Boolean).join(", ") || "—"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={m.destination_type === "LGU_TREASURY" ? "Public LGU" : "Private"}
                              color={m.destination_type === "LGU_TREASURY" ? "info" : "default"}
                            />
                          </TableCell>
                          <TableCell>{m.currency || "PHP"}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={m.status}
                              color={m.status === "ACTIVE" ? "success" : "default"}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </MDBox>

            {/* Row 3: Registered users */}
            <MDBox mb={2}>
              <SectionCard
                title="Registered Users"
                subtitle={
                  `${data.operator_count} operator${data.operator_count === 1 ? "" : "s"} · ` +
                  `${data.tenant_count} tenant${data.tenant_count === 1 ? "" : "s"} on the market`
                }
              >
                {data.operator_count === 0 ? (
                  <Alert severity="warning">
                    No market operators registered yet. Add users via Administration → Users after onboarding.
                  </Alert>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Mobile</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Market</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Last login</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.operators.map((u) => (
                        <TableRow key={u.id} hover>
                          <TableCell><code>{u.user_id_number}</code></TableCell>
                          <TableCell>{u.full_name || u.username}</TableCell>
                          <TableCell>{ROLE_LABEL[u.role] || u.role}</TableCell>
                          <TableCell>{u.email || "—"}</TableCell>
                          <TableCell>{u.mobile_number || "—"}</TableCell>
                          <TableCell>{u.market_code}</TableCell>
                          <TableCell>{fmtDateTime(u.last_login)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </MDBox>
          </>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
