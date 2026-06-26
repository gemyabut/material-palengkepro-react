import React, { useState, useEffect, useMemo } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { getUnbatchedDCs } from "api/remittanceBatches";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function CreateBatchForm({ marketCode, onSubmit, submitting }) {
  const today = new Date().toISOString().slice(0, 10);

  const [dcs, setDcs]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selected, setSelected] = useState(new Set());

  const [bankName, setBankName]         = useState("");
  const [last4, setLast4]               = useState("");
  const [date, setDate]                 = useState(today);
  const [notes, setNotes]               = useState("");
  const [validErr, setValidErr]         = useState({});

  useEffect(() => {
    setLoading(true);
    getUnbatchedDCs({ market: marketCode })
      .then(setDcs)
      .catch(() => setError("Failed to load unbatched collections."))
      .finally(() => setLoading(false));
  }, [marketCode]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === dcs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(dcs.map((d) => d.id)));
    }
  };

  const runningTotal = useMemo(() => {
    return dcs
      .filter((d) => selected.has(d.id))
      .reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
  }, [dcs, selected]);

  const validate = () => {
    const errs = {};
    if (!bankName.trim()) errs.bankName = "Bank name is required.";
    if (!date) errs.date = "Date is required.";
    if (selected.size === 0) errs.dcs = "Select at least one collection.";
    setValidErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      date,
      bank_name: bankName.trim(),
      bank_account_last4: last4.trim(),
      notes,
      dc_ids: [...selected],
    });
  };

  if (loading) {
    return (
      <MDBox display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </MDBox>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <MDBox>
      {/* Bank metadata */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <MDTypography variant="h6" mb={1}>Bank Details</MDTypography>
        <MDBox display="flex" gap={2} flexWrap="wrap">
          <TextField
            label="Bank name *"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            error={!!validErr.bankName}
            helperText={validErr.bankName}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Account last 4 digits"
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 8))}
            size="small"
            sx={{ width: 160 }}
          />
          <TextField
            label="Operational date *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={!!validErr.date}
            helperText={validErr.date}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
        </MDBox>
      </Paper>

      {/* DC selector */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <MDTypography variant="h6">
            Unbatched Collections ({dcs.length} available)
          </MDTypography>
          {dcs.length > 0 && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={selected.size === dcs.length && dcs.length > 0}
                  indeterminate={selected.size > 0 && selected.size < dcs.length}
                  onChange={toggleAll}
                  size="small"
                />
              }
              label="Select all"
            />
          )}
        </MDBox>

        {validErr.dcs && (
          <Alert severity="error" sx={{ mb: 1 }}>{validErr.dcs}</Alert>
        )}

        {dcs.length === 0 ? (
          <MDTypography variant="body2" color="secondary">
            No unbatched collections found for this market.
          </MDTypography>
        ) : (
          dcs.map((dc) => (
            <MDBox
              key={dc.id}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              py={0.5}
              sx={{ borderBottom: "1px solid", borderColor: "divider" }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selected.has(dc.id)}
                    onChange={() => toggle(dc.id)}
                    size="small"
                  />
                }
                label={
                  <MDBox>
                    <MDTypography variant="body2" fontWeight="medium">
                      {dc.date}
                    </MDTypography>
                    <MDTypography variant="caption" color="secondary">
                      {dc.collector_name}
                    </MDTypography>
                  </MDBox>
                }
              />
              <MDTypography variant="body2" fontWeight="medium">
                {peso(dc.total_amount)}
              </MDTypography>
            </MDBox>
          ))
        )}

        {selected.size > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <MDBox display="flex" justifyContent="space-between" alignItems="center">
              <MDTypography variant="caption" color="secondary">
                {selected.size} collection{selected.size !== 1 ? "s" : ""} selected
              </MDTypography>
              <MDTypography variant="h6" fontWeight="bold">
                Total: {peso(runningTotal)}
              </MDTypography>
            </MDBox>
          </>
        )}
      </Paper>

      <MDBox mt={2} display="flex" gap={2}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Creating…" : "Create Batch"}
        </Button>
      </MDBox>
    </MDBox>
  );
}
