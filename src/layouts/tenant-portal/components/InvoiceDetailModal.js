/**
 * Invoice detail modal — Task #115 item 7.
 *
 * Opened by clicking an invoice row on the tenant portal SOA page.
 * Shows line items, totals, and related payment applications.
 * Kiosk-friendly: large fonts, generous padding, matches soa.js's
 * existing #1a237e navy conventions.
 */
import PropTypes from "prop-types";
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, Divider,
  CircularProgress, Alert, Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const peso = (v) => `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const STATUS_COLOR = { PAID: "success", PARTIAL: "warning", OPEN: "error", VOID: "default" };

export default function InvoiceDetailModal({ open, onClose, invoice, loading, error }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          bgcolor: "#1a237e", color: "white",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography variant="h6" fontWeight={700}>
            {invoice ? invoice.invoice_number : "Invoice"}
          </Typography>
          {invoice && (
            <Chip
              size="small"
              label={invoice.status}
              color={STATUS_COLOR[invoice.status] || "default"}
              sx={{ fontWeight: 700 }}
            />
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: "white" }} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading && (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        )}

        {error && !loading && <Alert severity="error">{error}</Alert>}

        {invoice && !loading && !error && (
          <Stack spacing={3} mt={1}>
            {/* Period / due date */}
            <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">Period</Typography>
                <Typography fontWeight={600}>
                  {invoice.period_start} – {invoice.period_end}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="caption" color="text.secondary">Due Date</Typography>
                <Typography fontWeight={600}>{invoice.due_date || "—"}</Typography>
              </Box>
            </Stack>

            {/* Line items */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Charges
              </Typography>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#e8eaf6" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Charge</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(invoice.lines || []).map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{line.charge_type_display || line.charge_type || "—"}</TableCell>
                      <TableCell>{line.description || "—"}</TableCell>
                      <TableCell align="right">{peso(line.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {(!invoice.lines || invoice.lines.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="text.secondary">No charges on record.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            <Divider />

            {/* Totals */}
            <Stack direction="row" justifyContent="space-around" textAlign="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Charged</Typography>
                <Typography variant="h6" fontWeight={700}>{peso(invoice.total)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Paid</Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">{peso(invoice.paid)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Balance</Typography>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color={Number(invoice.balance) > 0 ? "error.main" : "text.primary"}
                >
                  {peso(invoice.balance)}
                </Typography>
              </Box>
            </Stack>

            <Divider />

            {/* Payments */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Payments Applied
              </Typography>
              {(invoice.applications || []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No payments applied yet.</Typography>
              ) : (
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#e8eaf6" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Receipt #</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>{app.payment_date || "—"}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>{app.payment_receipt || "—"}</TableCell>
                        <TableCell align="right">{peso(app.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

InvoiceDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  invoice: PropTypes.shape({
    invoice_number: PropTypes.string,
    status: PropTypes.string,
    period_start: PropTypes.string,
    period_end: PropTypes.string,
    due_date: PropTypes.string,
    total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    paid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    balance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    lines: PropTypes.array,
    applications: PropTypes.array,
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
};

InvoiceDetailModal.defaultProps = {
  invoice: null,
  loading: false,
  error: null,
};
