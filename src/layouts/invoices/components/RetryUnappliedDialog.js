import React, { useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Select,
  Typography,
  TextField,
} from "@mui/material";
import PropTypes from "prop-types";
import { retryUnappliedPayments } from "api/payments";
import { getMarket } from "api/markets";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function currentMonth() {
  return new Date().getMonth() + 1;
}

function currentYear() {
  return new Date().getFullYear();
}

// M1 (UNIT_53 Phase D.1 addendum) — payment retry is always monthly-scoped;
// @mui/x-date-pickers is not installed, so this uses plain Selects
// (Option A) rather than adding a new dependency for one picker.
function yearOptions() {
  const y = currentYear();
  return [y - 2, y - 1, y, y + 1, y + 2];
}

function monthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export default function RetryUnappliedDialog({ open, onClose, onSuccess, marketId }) {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [marketCode, setMarketCode] = useState("");
  const [marketName, setMarketName] = useState("");

  useEffect(() => {
    if (!marketId) return;
    getMarket(marketId)
      .then((m) => {
        setMarketCode(m.code || "");
        setMarketName(m.name || "");
      })
      .catch(() => setMarketCode(""));
  }, [marketId]);

  const resetState = () => {
    setMonth(currentMonth());
    setYear(currentYear());
    setPreview(null);
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseError = (err) => {
    const data = err?.response?.data;
    if (!data) return "Unexpected error — check network connection.";
    if (typeof data === "string") return data;
    if (data.error) return data.error;
    const msgs = Object.entries(data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("; ");
    return msgs || "Unknown error.";
  };

  const handlePreview = async () => {
    setError(null);
    setPreview(null);
    setLoading(true);
    try {
      const { start, end } = monthRange(year, month);
      const result = await retryUnappliedPayments({
        market_code: marketCode,
        start_date: start,
        end_date: end,
        dry_run: true,
      });
      setPreview(result);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      const { start, end } = monthRange(year, month);
      const result = await retryUnappliedPayments({
        market_code: marketCode,
        start_date: start,
        end_date: end,
        dry_run: false,
      });
      resetState();
      onClose();
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const marketLabel = marketName ? `${marketName} (${marketCode})` : marketCode;
  const monthYearLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Retry Unapplied Payments
        {marketLabel ? (
          <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
            — {marketLabel}
          </Typography>
        ) : null}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <Select
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPreview(null);
              }}
              fullWidth
              disabled={loading}
              displayEmpty
              renderValue={(v) => `Invoice Month: ${MONTH_NAMES[v - 1]}`}
            >
              {MONTH_NAMES.map((name, i) => (
                <MenuItem key={name} value={i + 1}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setPreview(null);
              }}
              fullWidth
              disabled={loading}
              displayEmpty
              renderValue={(v) => `Year: ${v}`}
            >
              {yearOptions().map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          {!marketId && (
            <Grid item xs={12}>
              <TextField
                label="Market Code"
                value={marketCode}
                onChange={(e) => {
                  setMarketCode(e.target.value.toUpperCase());
                  setPreview(null);
                }}
                fullWidth
                helperText="e.g. GENTRI"
                disabled={loading}
              />
            </Grid>
          )}
        </Grid>

        {loading && (
          <Box display="flex" justifyContent="center" mt={2}>
            <CircularProgress size={28} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {preview && (
          <Box mt={2} p={2} sx={{ backgroundColor: "#f5f5f5", borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Preview — {preview.market_code} {monthYearLabel}
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2">
              Orphan payments found:&nbsp;<strong>{preview.found ?? "—"}</strong>
            </Typography>
            <Typography variant="body2">
              Would apply:&nbsp;<strong>{preview.applied ?? "—"}</strong>
            </Typography>
            {(preview.failed ?? 0) > 0 && (
              <>
                <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                  Failed:&nbsp;<strong>{preview.failed}</strong>
                </Typography>
                {preview.errors?.slice(0, 5).map((e, i) => (
                  <Typography key={i} variant="caption" color="error" display="block">
                    Payment #{e.payment_id}: {e.error}
                  </Typography>
                ))}
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="secondary" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handlePreview}
          variant="outlined"
          color="primary"
          disabled={loading || !marketCode}
        >
          Preview
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={loading || !marketCode}
        >
          Confirm Retry
        </Button>
      </DialogActions>
    </Dialog>
  );
}

RetryUnappliedDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  marketId: PropTypes.number,
};
