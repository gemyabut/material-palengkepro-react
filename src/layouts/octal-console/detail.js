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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { useAuthProfile } from "context/AuthContext";
import { getSubscriptionDetail } from "api/octalConsole";
import { changePlan, recordPayment, getInvoices, getAccountSOA } from "../subscription/api/subscription";

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

const INVOICE_STATUS_COLOR = {
  paid: "success",
  open: "warning",
  draft: "default",
  void: "error",
};

// markets.models.LicenseTier
const TIER_OPTIONS = ["community", "starter", "basic", "standard", "pro", "enterprise"];

// billing.models.ARPayment.method choices
const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "e_wallet", label: "E-Wallet" },
  { value: "maya", label: "Maya" },
  { value: "check", label: "Check" },
];

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

  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState("");
  const [changePlanSubmitting, setChangePlanSubmitting] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    invoiceId: "", amount: "", method: "bank", refNo: "", notes: "",
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [soaOpen, setSoaOpen] = useState(false);
  const [soaStart, setSoaStart] = useState("");
  const [soaEnd, setSoaEnd] = useState("");
  const [soaData, setSoaData] = useState(null);
  const [soaLoading, setSoaLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const isAllowed =
    !authLoading &&
    ((userProfile?.role || "").toLowerCase() === "system_administrator" ||
      userProfile?.is_staff === true);

  const fetchDetail = () => {
    setLoading(true);
    setError(null);
    return getSubscriptionDetail(id)
      .then(setData)
      .catch((e) => setError(e?.response?.data?.detail || e.message || "Failed to load."))
      .finally(() => setLoading(false));
  };

  // InvoiceViewSet has no server-side filterset_fields wired up (confirmed
  // in views.py) — fetch everything the caller can see and filter client-side.
  const fetchInvoices = (accountId) => {
    if (!accountId) return Promise.resolve();
    setInvoicesLoading(true);
    return getInvoices()
      .then((all) => setInvoices(all.filter((inv) => inv.account === accountId)))
      .catch(() => setInvoices([]))
      .finally(() => setInvoicesLoading(false));
  };

  useEffect(() => {
    if (authLoading || !isAllowed) {
      setLoading(false);
      return;
    }
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, authLoading, isAllowed]);

  useEffect(() => {
    if (data?.account?.id) fetchInvoices(data.account.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.account?.id]);

  const openChangePlan = () => {
    setSelectedTier(data?.subscription?.tier || "");
    setChangePlanOpen(true);
  };

  const handleChangePlanConfirm = async () => {
    setChangePlanSubmitting(true);
    try {
      const res = await changePlan(id, selectedTier);
      setSnackbar({ open: true, message: `Plan changed to ${res.tier}`, severity: "success" });
      setChangePlanOpen(false);
      fetchDetail();
    } catch (err) {
      const msg =
        err?.response?.data?.error || err?.response?.data?.detail || err.message ||
        "Failed to change plan.";
      setSnackbar({ open: true, message: String(msg), severity: "error" });
    } finally {
      setChangePlanSubmitting(false);
    }
  };

  const openRecordPayment = () => {
    setPaymentForm({ invoiceId: "", amount: "", method: "bank", refNo: "", notes: "" });
    setPaymentOpen(true);
  };

  const handleInvoiceSelect = (invoiceId) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    setPaymentForm((f) => ({
      ...f,
      invoiceId,
      // Defaults to the full invoice total — there's no "balance" field on
      // Invoice; the operator edits down manually for a partial payment.
      amount: inv ? inv.total : f.amount,
    }));
  };

  const handleRecordPaymentConfirm = async () => {
    const invoice = invoices.find((i) => i.id === paymentForm.invoiceId);
    setPaymentSubmitting(true);
    try {
      await recordPayment({
        invoiceNumber: invoice?.number,
        amount: paymentForm.amount,
        method: paymentForm.method,
        refNo: paymentForm.refNo,
        notes: paymentForm.notes,
      });
      setSnackbar({ open: true, message: "Payment recorded", severity: "success" });
      setPaymentOpen(false);
      await fetchInvoices(data?.account?.id);
      fetchDetail();
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Failed to record payment.";
      setSnackbar({ open: true, message: String(msg), severity: "error" });
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const fetchSOA = async (start, end) => {
    if (!data?.account?.id) return;
    setSoaLoading(true);
    try {
      const res = await getAccountSOA(data.account.id, start || undefined, end || undefined);
      setSoaData(res);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Failed to load SOA.";
      setSnackbar({ open: true, message: String(msg), severity: "error" });
    } finally {
      setSoaLoading(false);
    }
  };

  const openSOA = () => {
    // Default to last 12 months — editable, "Apply" re-fetches.
    const endD = new Date();
    const startD = new Date();
    startD.setFullYear(startD.getFullYear() - 1);
    const toISO = (d) => d.toISOString().slice(0, 10);
    const s = toISO(startD);
    const e = toISO(endD);
    setSoaStart(s);
    setSoaEnd(e);
    setSoaData(null);
    setSoaOpen(true);
    fetchSOA(s, e);
  };

  const downloadSoaCsv = () => {
    if (!soaData) return;
    const lines = ["Type,Number/Ref,Date,Amount,Status/Method"];
    soaData.invoices.forEach((inv) => {
      lines.push(`Invoice,${inv.number},${inv.issued_at},${inv.total},${inv.status}`);
    });
    soaData.payments.forEach((p) => {
      lines.push(`Payment,${p.ref_no || ""},${p.received_at},${p.amount},${p.method}`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soa_account_${data.account.id}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
          <MDBox display="flex" gap={1}>
            {data && (
              <>
                <Button variant="outlined" color="info" onClick={openChangePlan}>
                  Change Plan
                </Button>
                <Button variant="outlined" color="success" onClick={openRecordPayment}>
                  Record Payment
                </Button>
                <Button variant="outlined" color="secondary" onClick={openSOA}>
                  View SOA
                </Button>
              </>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/octal-console")}
            >
              Back
            </Button>
          </MDBox>
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

            {/* Row 4: Invoices */}
            <MDBox mb={2}>
              <SectionCard
                title="Invoices"
                subtitle={`${invoices.length} invoice(s) on this billing account`}
              >
                {invoicesLoading ? (
                  <LinearProgress color="info" />
                ) : invoices.length === 0 ? (
                  <MDTypography variant="body2" color="text">No invoices yet.</MDTypography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Number</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow
                          key={inv.id}
                          hover
                          sx={{ cursor: "pointer" }}
                          onClick={() => navigate(`/octal-console/invoice/${inv.id}`)}
                        >
                          <TableCell><code>{inv.number}</code></TableCell>
                          <TableCell>
                            {fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}
                          </TableCell>
                          <TableCell>₱{inv.total}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={inv.status}
                              color={INVOICE_STATUS_COLOR[inv.status] || "default"}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </SectionCard>
            </MDBox>
          </>
        )}

        {/* Change Plan dialog */}
        <Dialog open={changePlanOpen} onClose={() => setChangePlanOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Change subscription plan</DialogTitle>
          <DialogContent>
            <TextField
              select fullWidth margin="normal" label="Tier"
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
            >
              {TIER_OPTIONS.map((t) => (
                <MenuItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChangePlanOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="info"
              disabled={
                !selectedTier || selectedTier === data?.subscription?.tier || changePlanSubmitting
              }
              onClick={handleChangePlanConfirm}
            >
              Change Plan
            </Button>
          </DialogActions>
        </Dialog>

        {/* Record Payment dialog */}
        <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Record payment against invoice</DialogTitle>
          <DialogContent>
            <TextField
              select fullWidth margin="normal" label="Invoice"
              value={paymentForm.invoiceId}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
            >
              {invoices.filter((i) => i.status === "open").map((inv) => (
                <MenuItem key={inv.id} value={inv.id}>
                  {inv.number} — ₱{inv.total}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth margin="normal" label="Amount" type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <TextField
              select fullWidth margin="normal" label="Method"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm((f) => ({ ...f, method: e.target.value }))}
            >
              {PAYMENT_METHOD_OPTIONS.map((m) => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth margin="normal" label="Reference number"
              value={paymentForm.refNo}
              onChange={(e) => setPaymentForm((f) => ({ ...f, refNo: e.target.value }))}
            />
            <TextField
              fullWidth margin="normal" label="Notes (optional)" multiline minRows={2}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="success"
              disabled={
                !paymentForm.invoiceId || !paymentForm.amount || !paymentForm.method ||
                paymentSubmitting
              }
              onClick={handleRecordPaymentConfirm}
            >
              Record Payment
            </Button>
          </DialogActions>
        </Dialog>

        {/* View SOA dialog */}
        <Dialog open={soaOpen} onClose={() => setSoaOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Statement of account</DialogTitle>
          <DialogContent>
            <MDBox display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={1}>
              <TextField
                type="date" label="Start" size="small"
                value={soaStart}
                onChange={(e) => setSoaStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="date" label="End" size="small"
                value={soaEnd}
                onChange={(e) => setSoaEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="outlined" size="small"
                onClick={() => fetchSOA(soaStart, soaEnd)}
                disabled={soaLoading}
              >
                Apply
              </Button>
              {soaData && (
                <Button variant="text" size="small" onClick={downloadSoaCsv}>
                  Download CSV
                </Button>
              )}
            </MDBox>

            {soaLoading ? (
              <LinearProgress color="info" />
            ) : soaData ? (
              <>
                <MDTypography variant="body2" color="text" mb={1}>
                  Opening balance: ₱{soaData.opening_balance} · Closing balance: ₱
                  {soaData.closing_balance}
                </MDTypography>

                <MDTypography variant="h6" mt={2} mb={0.5}>Invoices</MDTypography>
                {soaData.invoices.length === 0 ? (
                  <MDTypography variant="body2" color="text">
                    No invoices in this period.
                  </MDTypography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Number</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Issued</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Paid at</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {soaData.invoices.map((inv) => {
                        // compute_account_soa's invoice rows carry only `number`,
                        // no `id` — resolve it from the Invoices-section state
                        // (same account, unfiltered, already fetched with `id`)
                        // instead of adding a backend field for this alone.
                        const matched = invoices.find((i) => i.number === inv.number);
                        return (
                          <TableRow
                            key={inv.number}
                            hover={!!matched}
                            sx={matched ? { cursor: "pointer" } : undefined}
                            onClick={
                              matched
                                ? () => navigate(`/octal-console/invoice/${matched.id}`)
                                : undefined
                            }
                          >
                            <TableCell><code>{inv.number}</code></TableCell>
                            <TableCell>{fmtDate(inv.issued_at)}</TableCell>
                            <TableCell align="right">₱{inv.total}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={inv.status}
                                color={INVOICE_STATUS_COLOR[inv.status] || "default"}
                              />
                            </TableCell>
                            <TableCell>{inv.paid_at ? fmtDateTime(inv.paid_at) : "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                <MDTypography variant="h6" mt={2} mb={0.5}>Payments</MDTypography>
                {soaData.payments.length === 0 ? (
                  <MDTypography variant="body2" color="text">
                    No payments in this period.
                  </MDTypography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Received</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Ref #</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Invoice</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {soaData.payments.map((p, idx) => (
                        <TableRow key={`${p.invoice_number || "noinv"}-${idx}`}>
                          <TableCell>{fmtDateTime(p.received_at)}</TableCell>
                          <TableCell align="right">₱{p.amount}</TableCell>
                          <TableCell>{p.method}</TableCell>
                          <TableCell>{p.ref_no || "—"}</TableCell>
                          <TableCell><code>{p.invoice_number || "—"}</code></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSoaOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </MDBox>
    </DashboardLayout>
  );
}
