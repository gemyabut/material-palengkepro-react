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
  TextField,
  Typography,
} from "@mui/material";
import PropTypes from "prop-types";
import { retryUnappliedPayments } from "api/payments";
import { getMarket } from "api/markets";

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function lastOfMonth() {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

export default function RetryUnappliedDialog({ open, onClose, onSuccess, marketId }) {
  const [startDate, setStartDate]   = useState(firstOfMonth);
  const [endDate, setEndDate]       = useState(lastOfMonth);
  const [loading, setLoading]       = useState(false);
  const [preview, setPreview]       = useState(null);
  const [error, setError]           = useState(null);
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
    setStartDate(firstOfMonth());
    setEndDate(lastOfMonth());
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
      const result = await retryUnappliedPayments({
        market_code: marketCode,
        start_date:  startDate,
        end_date:    endDate,
        dry_run:     true,
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
      const result = await retryUnappliedPayments({
        market_code: marketCode,
        start_date:  startDate,
        end_date:    endDate,
        dry_run:     false,
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
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPreview(null); }}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPreview(null); }}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={loading}
            />
          </Grid>
          {!marketId && (
            <Grid item xs={12}>
              <TextField
                label="Market Code"
                value={marketCode}
                onChange={(e) => { setMarketCode(e.target.value.toUpperCase()); setPreview(null); }}
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
              Preview — {preview.market_code}&nbsp;
              {preview.window?.start_date} → {preview.window?.end_date}
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
  open:      PropTypes.bool.isRequired,
  onClose:   PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  marketId:  PropTypes.number,
};
