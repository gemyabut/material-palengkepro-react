// src/layouts/octal-console/invoice-detail.js
// SaaS billing invoice detail: header + lines + payments applied.
// Reads from GET /api/billing/invoices/:id/ (platform-admin scoped, same
// pattern as the subscriber detail page). Payments are fetched separately
// via GET /api/billing/payments/?invoice=:id (server-side filter, Tier 1.5
// H11 — see ARPaymentViewSet.filterset_fields).
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
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
import { getInvoice, listPayments, listSubscriptions } from "../subscription/api/subscription";

const STATUS_COLOR = { paid: "success", open: "warning", draft: "default", void: "error" };

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function fmtDateTime(iso) {
  if (!iso) return "—";
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

function KV({ label, value }) {
  return (
    <MDBox display="flex" alignItems="center" py={0.5} sx={{ borderBottom: "1px dashed rgba(0,0,0,0.06)" }}>
      <MDTypography variant="caption" color="text" sx={{ minWidth: 130 }}>{label}</MDTypography>
      <MDTypography variant="body2" sx={{ fontWeight: 500 }}>{value ?? "—"}</MDTypography>
    </MDBox>
  );
}

export default function OctalInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, loading: authLoading } = useAuthProfile();

  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [subscriptionId, setSubscriptionId] = useState(null);
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
    Promise.all([getInvoice(id), listPayments({ invoice: id }), listSubscriptions()])
      .then(([inv, invoicePayments, allSubs]) => {
        setInvoice(inv);
        setPayments(invoicePayments);
        // InvoiceSerializer only exposes account as a numeric PK, and there's
        // no reverse account->subscriptions endpoint — resolve the owning
        // subscription client-side for the "back to subscriber" link.
        const sub = allSubs.find((s) => s.account === inv.account);
        setSubscriptionId(sub ? sub.id : null);
      })
      .catch((e) => setError(e?.response?.data?.detail || e.message || "Failed to load."))
      .finally(() => setLoading(false));
  }, [id, authLoading, isAllowed]);

  const goToSubscriber = () => {
    if (subscriptionId != null) navigate(`/octal-console/subscription/${subscriptionId}`);
    else navigate(-1);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDTypography variant="h4">Invoice {invoice?.number || `#${id}`}</MDTypography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={goToSubscriber}
          >
            Back to subscriber
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
        ) : !invoice ? null : (
          <>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <MDTypography variant="h6" mb={0.5}>Invoice</MDTypography>
                <Divider sx={{ mb: 1 }} />
                <KV label="Number" value={<code>{invoice.number}</code>} />
                <KV
                  label="Subscriber"
                  value={
                    subscriptionId != null ? (
                      <MDTypography
                        variant="body2"
                        color="info"
                        sx={{ cursor: "pointer", fontWeight: 500 }}
                        onClick={goToSubscriber}
                      >
                        View subscriber →
                      </MDTypography>
                    ) : (
                      "—"
                    )
                  }
                />
                <KV
                  label="Status"
                  value={
                    <Chip
                      size="small"
                      label={invoice.status}
                      color={STATUS_COLOR[invoice.status] || "default"}
                    />
                  }
                />
                <KV label="Period" value={`${fmtDate(invoice.period_start)} – ${fmtDate(invoice.period_end)}`} />
                <KV label="Issued" value={fmtDateTime(invoice.issued_at)} />
                <KV label="Due" value={fmtDateTime(invoice.due_at)} />
                <KV label="Subtotal" value={`₱${invoice.subtotal}`} />
                <KV label="Discount" value={`₱${invoice.discount}`} />
                <KV label="Total" value={`₱${invoice.total}`} />
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <MDTypography variant="h6" mb={0.5}>Lines</MDTypography>
                <Divider sx={{ mb: 1 }} />
                {invoice.lines.length === 0 ? (
                  <MDTypography variant="body2" color="text">No lines on this invoice.</MDTypography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Kind</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Market</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tier</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Basis</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Count</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Rate</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Line total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoice.lines.map((line) => {
                        const isStall = line.billing_basis === "stall";
                        const count = isStall ? line.billable_stalls : line.billable_tenants;
                        const rate = isStall ? line.rate_per_stall_month : line.rate_per_tenant_month;
                        return (
                          <TableRow key={line.id}>
                            <TableCell>{line.kind}</TableCell>
                            <TableCell>{line.market || "—"}</TableCell>
                            <TableCell>{line.tier}</TableCell>
                            <TableCell>{line.billing_basis}</TableCell>
                            <TableCell align="right">{count ?? "—"}</TableCell>
                            <TableCell align="right">{rate != null ? `₱${rate}` : "—"}</TableCell>
                            <TableCell align="right">₱{line.line_total}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <MDTypography variant="h6" mb={0.5}>Payments applied</MDTypography>
                <Divider sx={{ mb: 1 }} />
                {payments.length === 0 ? (
                  <MDTypography variant="body2" color="text">
                    No payments recorded against this invoice.
                  </MDTypography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Received</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Ref #</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{fmtDateTime(p.received_at)}</TableCell>
                          <TableCell align="right">₱{p.amount}</TableCell>
                          <TableCell>{p.method}</TableCell>
                          <TableCell>{p.ref_no || "—"}</TableCell>
                          <TableCell>{p.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
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
