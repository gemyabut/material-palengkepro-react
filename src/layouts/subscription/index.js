import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  Alert,
  LinearProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { canManageSubscription } from "utils/permissions";
import { getMySubscription, getInvoices, changePlan } from "./api/subscription";

const TIERS = ["community", "starter", "basic", "standard", "pro", "enterprise"];

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch (e) {
    return "";
  }
}

const peso = (v) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

// Feature keys → friendly labels (only the ones we surface).
const FEATURE_LABELS = {
  batch_import: "Spreadsheet upload (batch import)",
  dashboards: "Dashboards",
  soa_periodic: "Statements of Account (SOA)",
  tenant_inquiry: "Tenant inquiry",
  direct_payment_entry: "Real-time collections",
  collector_app: "Collector mobile app",
  digital_payments: "Digital payments (QRPH/GCash/Maya)",
  reminders: "SMS/Email reminders",
  bank_recon: "Bank reconciliation",
  autobilling: "Automated billing",
  arrears_advanced: "Advanced arrears",
  receiptbook: "Receipt books",
  qr_receipts: "QR receipts",
  multimarket_dash: "Multi-market dashboards",
};

const STATUS_COLOR = {
  active: "success",
  trialing: "info",
  past_due: "warning",
  suspended: "error",
  cancelled: "error",
  expired: "error",
};

export default function Subscription() {
  const role = getRole();
  const allowed = canManageSubscription(role);

  const [data, setData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [target, setTarget] = useState("");
  const [changing, setChanging] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = () =>
    Promise.all([getMySubscription(), getInvoices().catch(() => [])])
      .then(([me, inv]) => {
        setData(me);
        setInvoices(inv);
      })
      .catch((e) => setError(e?.response?.data?.detail || e.message || "Failed to load."))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line
  }, [allowed]);

  const doChangePlan = async () => {
    const subId = data?.subscription?.id;
    if (!subId || !target) return;
    setChanging(true);
    setNotice(null);
    setError(null);
    try {
      const res = await changePlan(subId, target);
      setNotice(
        `Plan changed to ${res.tier}.` +
          (res.proration_invoice ? ` Proration invoice ${res.proration_invoice.number} (₱${res.proration_invoice.total}).` : "")
      );
      setTarget("");
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.detail || e.message || "Change failed.");
    } finally {
      setChanging(false);
    }
  };

  const ents = data?.entitlements || {};
  const includedKeys = Object.keys(FEATURE_LABELS).filter((k) => ents[k]);
  const lockedKeys = Object.keys(FEATURE_LABELS).filter((k) => ents[k] === false);
  const usage = data?.usage || {};
  const sub = data?.subscription;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDTypography variant="h4" mb={1}>
          Subscription &amp; Billing
        </MDTypography>

        {!allowed ? (
          <Alert severity="warning">You don&apos;t have access to subscription management.</Alert>
        ) : loading ? (
          <LinearProgress />
        ) : error ? (
          <Alert severity="error">{String(error)}</Alert>
        ) : !data?.company ? (
          <Alert severity="info">No company / market is linked to your account yet.</Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Plan card */}
            <Grid item xs={12} md={5}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <MDTypography variant="h6">Current plan</MDTypography>
                    {sub && (
                      <Chip size="small" label={sub.status} color={STATUS_COLOR[sub.status] || "default"} />
                    )}
                  </Stack>
                  <MDTypography variant="h4" textTransform="capitalize">
                    {(sub?.tier || data.market?.effective_plan || "community").replace("_", " ")}
                  </MDTypography>
                  <MDTypography variant="button" color="text" display="block">
                    {data.company.name} · {data.market?.code}
                  </MDTypography>
                  {sub ? (
                    <MDTypography variant="caption" color="text" display="block" mt={1}>
                      Since {sub.start_date}
                      {sub.end_date ? ` · renews/ends ${sub.end_date}` : ""}
                    </MDTypography>
                  ) : (
                    <MDTypography variant="caption" color="text" display="block" mt={1}>
                      Community (no paid subscription)
                    </MDTypography>
                  )}
                  {sub && ["suspended", "cancelled", "expired", "past_due"].includes(sub.status) && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Subscription is {sub.status}. Settle the latest invoice to restore full access.
                    </Alert>
                  )}
                  {notice && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      {notice}
                    </Alert>
                  )}
                  {sub ? (
                    <Stack direction="row" spacing={1} alignItems="center" mt={2}>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Change plan</InputLabel>
                        <Select
                          value={target}
                          label="Change plan"
                          onChange={(e) => setTarget(e.target.value)}
                        >
                          {TIERS.filter((t) => t !== sub.tier).map((t) => (
                            <MenuItem key={t} value={t} sx={{ textTransform: "capitalize" }}>
                              {t}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained"
                        color="info"
                        disabled={!target || changing}
                        onClick={doChangePlan}
                      >
                        Apply
                      </Button>
                    </Stack>
                  ) : (
                    <MDTypography variant="caption" color="text" display="block" mt={2}>
                      No paid subscription — contact sales to start one.
                    </MDTypography>
                  )}
                  <MDTypography variant="caption" color="text" display="block" mt={0.5}>
                    Changes are immediate and prorated for the rest of the month.
                  </MDTypography>
                </CardContent>
              </Card>
            </Grid>

            {/* Usage */}
            <Grid item xs={12} md={7}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <MDTypography variant="h6" gutterBottom>
                    Usage
                  </MDTypography>
                  <Stack spacing={1}>
                    <MDBox>
                      <MDTypography variant="button">
                        Markets: {usage.markets_used} / {usage.markets_cap === 0 ? "∞" : usage.markets_cap}
                      </MDTypography>
                      <LinearProgress
                        variant="determinate"
                        value={usage.markets_cap ? Math.min((usage.markets_used / usage.markets_cap) * 100, 100) : 0}
                        color={usage.can_add_market ? "info" : "warning"}
                      />
                    </MDBox>
                    <MDBox>
                      <MDTypography variant="button">
                        Active tenants: {usage.active_tenants} / {usage.seat_cap === 0 ? "∞" : usage.seat_cap}
                      </MDTypography>
                    </MDBox>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Entitlements */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <MDTypography variant="h6" gutterBottom>
                    What&apos;s included
                  </MDTypography>
                  <List dense>
                    {includedKeys.map((k) => (
                      <ListItem key={k} disableGutters>
                        <ListItemText primary={`✓ ${FEATURE_LABELS[k]}`} />
                      </ListItem>
                    ))}
                  </List>
                  {lockedKeys.length > 0 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <MDTypography variant="caption" color="text">
                        Unlock with a higher plan:
                      </MDTypography>
                      <List dense>
                        {lockedKeys.map((k) => (
                          <ListItem key={k} disableGutters>
                            <ListItemText
                              primaryTypographyProps={{ color: "text.secondary" }}
                              primary={`🔒 ${FEATURE_LABELS[k]}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Invoices */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <MDTypography variant="h6" gutterBottom>
                    Invoices
                  </MDTypography>
                  {invoices.length ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Number</TableCell>
                          <TableCell>Period end</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="right">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow key={inv.id || inv.number}>
                            <TableCell>{inv.number}</TableCell>
                            <TableCell>{inv.period_end}</TableCell>
                            <TableCell align="right">{peso(inv.total)}</TableCell>
                            <TableCell align="right">{inv.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <MDTypography variant="caption" color="text">
                      No invoices yet.
                    </MDTypography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
