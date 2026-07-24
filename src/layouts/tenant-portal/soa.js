/**
 * Tenant Portal — Statement of Account page (Unit 15, DEC-042).
 *
 * D5: Default last 12 months; period picker for custom range.
 * D6: PDF download button (calls GET /api/tenant/soa/pdf/).
 * Kiosk-friendly layout via PortalLayout.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Alert, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, Stack,
  Button, TextField, Chip, Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";

import PortalLayout from "./PortalLayout";
import { tenantPortalApi, downloadBlob } from "api/tenantPortal";
import { getTenantToken } from "utils/tenantPortalAuth";

const peso = (v) => `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

function defaultPeriod() {
  const today = new Date();
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { start: fmt(yearAgo), end: fmt(today) };
}

export default function TenantSOA() {
  const navigate = useNavigate();
  const { start: defStart, end: defEnd } = defaultPeriod();

  const [periodStart, setPeriodStart] = useState(defStart);
  const [periodEnd, setPeriodEnd]     = useState(defEnd);
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [pdfLoading, setPdfLoading]   = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(null);
  const [error, setError]             = useState(null);

  const load = useCallback(async (start, end) => {
    if (!getTenantToken()) { navigate("/tenant/login", { replace: true }); return; }
    setLoading(true);
    setError(null);
    setEmailSuccess(null);
    try {
      const resp = await tenantPortalApi.soa(start, end);
      setData(resp);
    } catch (err) {
      if (err.status === 401 || err.status === 403) navigate("/tenant/login", { replace: true });
      else setError(err.message || "Failed to load statement.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(periodStart, periodEnd); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = () => load(periodStart, periodEnd);

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const { blob } = await tenantPortalApi.soaPdf(periodStart, periodEnd);
      downloadBlob(blob, `tenant_soa_${periodEnd}.pdf`);
    } catch (err) {
      setError("PDF download failed: " + (err.message || "unknown error"));
    } finally {
      setPdfLoading(false);
    }
  };

  const handleEmailSoa = async () => {
    setEmailLoading(true);
    setError(null);
    setEmailSuccess(null);
    try {
      const resp = await tenantPortalApi.emailSoaPdf(periodStart, periodEnd);
      setEmailSuccess(`Statement emailed to ${resp.sent_to}.`);
    } catch (err) {
      setError("Email failed: " + (err.message || "unknown error"));
    } finally {
      setEmailLoading(false);
    }
  };

  const invoices = data?.invoices || [];
  const summary  = data?.summary || {};
  const tenantEmail = data?.tenant_email;

  return (
    <PortalLayout>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/tenant/dashboard")} sx={{ color: "#1a237e" }}>
            Dashboard
          </Button>
          <Typography variant="h5" fontWeight={700} flex={1}>
            Statement of Account
          </Typography>
          <Button
            variant="contained"
            startIcon={pdfLoading ? <CircularProgress size={16} sx={{ color: "white" }} /> : <DownloadIcon />}
            onClick={handleDownloadPdf}
            disabled={pdfLoading || loading}
            sx={{ bgcolor: "#1a237e", "&:hover": { bgcolor: "#283593" }, whiteSpace: "nowrap" }}
          >
            Download PDF
          </Button>
          <Tooltip title={tenantEmail ? "" : "Add email to your profile first"}>
            <span>
              <Button
                variant="outlined"
                startIcon={emailLoading ? <CircularProgress size={16} sx={{ color: "#1a237e" }} /> : <EmailIcon />}
                onClick={handleEmailSoa}
                disabled={emailLoading || loading || !tenantEmail}
                sx={{ borderColor: "#1a237e", color: "#1a237e", whiteSpace: "nowrap" }}
              >
                Email to me
              </Button>
            </span>
          </Tooltip>
        </Stack>

        {/* Period selector */}
        <Card>
          <CardContent>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <TextField
                size="small"
                type="date"
                label="Period Start"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />
              <TextField
                size="small"
                type="date"
                label="Period End"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 160 }}
              />
              <Button variant="outlined" onClick={handleApply} disabled={loading} sx={{ borderColor: "#1a237e", color: "#1a237e" }}>
                Apply
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>}
        {error && <Alert severity="error">{error}</Alert>}
        {emailSuccess && <Alert severity="success">{emailSuccess}</Alert>}

        {/* Summary row */}
        {data && !loading && (
          <Card sx={{ bgcolor: "#e8eaf6" }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3} justifyContent="space-around" textAlign="center">
                {[
                  ["Balance Forward", summary.balance_forward],
                  ["Total Charged",   summary.total_charged],
                  ["Total Paid",      summary.total_paid],
                  ["Ending Balance",  summary.ending_balance],
                ].map(([label, val]) => (
                  <Box key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="h6" fontWeight={700}>{peso(val)}</Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Invoice table */}
        {!loading && invoices.length === 0 && data && (
          <Alert severity="info">No invoices found for this period.</Alert>
        )}

        {!loading && invoices.length > 0 && (
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#1a237e" }}>
                    <TableRow>
                      {["Invoice #", "Period", "Charged", "Paid", "Balance", "Status"].map((h) => (
                        <TableCell key={h} sx={{ color: "white", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((inv, i) => (
                      <TableRow key={i} sx={{ bgcolor: i % 2 === 1 ? "#f8f9ff" : "white" }}>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{inv.invoice_number}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {inv.period_start} – {inv.period_end}
                        </TableCell>
                        <TableCell align="right">{peso(inv.total)}</TableCell>
                        <TableCell align="right">{peso(inv.paid)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: Number(inv.balance) > 0 ? 700 : 400 }}>
                          {peso(inv.balance)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={inv.status}
                            color={inv.status === "PAID" ? "success" : inv.status === "PARTIAL" ? "warning" : "default"}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        )}
      </Stack>
    </PortalLayout>
  );
}
