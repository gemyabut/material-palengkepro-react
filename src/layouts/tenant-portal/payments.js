/**
 * Tenant Portal — Payment History page (Unit 15, DEC-042).
 *
 * Paginated (20/page, max 100). Per-payment receipt PDF download (D6).
 * applied_to: shows invoice(s) via Unit 14 PA→InvoiceLine FK chain from backend.
 * Kiosk-friendly layout via PortalLayout.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, Typography, Alert, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, Stack,
  Button, Chip, Pagination, Tooltip, IconButton,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import PortalLayout from "./PortalLayout";
import { tenantPortalApi, downloadBlob } from "api/tenantPortal";
import { getTenantToken } from "utils/tenantPortalAuth";

const peso = (v) => `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const STATUS_COLOR = { POSTED: "success", PENDING: "warning", REVERSED: "error", VOIDED: "default" };

export default function TenantPayments() {
  const navigate = useNavigate();

  const [page, setPage]                  = useState(1);
  const [data, setData]                  = useState(null);
  const [loading, setLoading]            = useState(true);
  const [error, setError]                = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async (p) => {
    if (!getTenantToken()) { navigate("/tenant/login", { replace: true }); return; }
    setLoading(true);
    setError(null);
    try {
      const resp = await tenantPortalApi.payments(p, 20);
      setData(resp);
    } catch (err) {
      if (err.status === 401 || err.status === 403) navigate("/tenant/login", { replace: true });
      else setError(err.message || "Failed to load payment history.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(page); }, [page, load]);

  const handlePageChange = (_, val) => setPage(val);

  const handleReceiptPdf = async (paymentId, receiptNumber) => {
    setDownloadingId(paymentId);
    try {
      const { blob } = await tenantPortalApi.paymentReceiptPdf(paymentId);
      const fname = receiptNumber
        ? `receipt_${receiptNumber.replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`
        : `payment_receipt_${paymentId}.pdf`;
      downloadBlob(blob, fname);
    } catch (err) {
      setError("Receipt download failed: " + (err.message || "unknown error"));
    } finally {
      setDownloadingId(null);
    }
  };

  const rows    = data?.results || [];
  const total   = data?.total_pages || 1;

  return (
    <PortalLayout>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/tenant/dashboard")} sx={{ color: "#1a237e" }}>
            Dashboard
          </Button>
          <Typography variant="h5" fontWeight={700} flex={1}>
            Payment History
          </Typography>
          {data && (
            <Typography variant="body2" color="text.secondary">
              {data.count} record{data.count !== 1 ? "s" : ""}
            </Typography>
          )}
        </Stack>

        {loading && <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>}
        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

        {!loading && rows.length === 0 && <Alert severity="info">No payment records found.</Alert>}

        {!loading && rows.length > 0 && (
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#1a237e" }}>
                    <TableRow>
                      {["Date", "Receipt", "Amount", "Type", "Applied To", "Status", ""].map((h) => (
                        <TableCell key={h} sx={{ color: "white", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((p, i) => (
                      <TableRow key={p.id} sx={{ bgcolor: i % 2 === 1 ? "#f8f9ff" : "white" }}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{p.date}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                          {p.receipt_number || "—"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{peso(p.amount)}</TableCell>
                        <TableCell>{(p.payment_type || "—").replace(/_/g, " ")}</TableCell>
                        <TableCell>
                          {p.applied_to?.length > 0 ? (
                            <Stack spacing={0.25}>
                              {p.applied_to.map((a, j) => (
                                <Typography key={j} variant="caption" sx={{ fontFamily: "monospace" }}>
                                  {a.invoice_number} ({peso(a.amount_applied)})
                                </Typography>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={p.status}
                            color={STATUS_COLOR[p.status] || "default"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Download receipt PDF">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleReceiptPdf(p.id, p.receipt_number)}
                                disabled={downloadingId === p.id}
                              >
                                {downloadingId === p.id
                                  ? <CircularProgress size={16} />
                                  : <DownloadIcon fontSize="small" sx={{ color: "#1a237e" }} />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        )}

        {total > 1 && (
          <Box display="flex" justifyContent="center">
            <Pagination
              count={total}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Stack>
    </PortalLayout>
  );
}
