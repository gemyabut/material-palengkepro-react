import React, { useState, useEffect, useMemo } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { destinationLabel } from "utils/destinationLabels";
import { getUnbatchedDCs } from "api/remittanceBatches";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function CreateBatchForm({ marketCode, destinationType, canOverride, onSubmit, submitting }) {
  const today = new Date().toISOString().slice(0, 10);

  const [dcs, setDcs]         = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selected, setSelected] = useState(new Set());

  const [localDest, setLocalDest]   = useState(destinationType || "BANK");
  const [bankName, setBankName]     = useState("");
  const [last4, setLast4]           = useState("");
  const [date, setDate]             = useState(today);
  const [notes, setNotes]           = useState("");
  const [validErr, setValidErr]     = useState({});

  useEffect(() => { setLocalDest(destinationType || "BANK"); }, [destinationType]);

  useEffect(() => {
    setLoading(true);
    getUnbatchedDCs({ market: marketCode })
      .then((res) => setDcs(Array.isArray(res) ? res : (res?.results ?? [])))
      .catch(() => setError("Failed to load unbatched collections."))
      .finally(() => setLoading(false));
  }, [marketCode]);

  const isLGU = localDest === "LGU_TREASURY";
  const isOverride = localDest !== (destinationType || "BANK");

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selected.size === dcs.length ? new Set() : new Set(dcs.map((d) => d.id)));
  };

  const runningTotal = useMemo(
    () => dcs.filter((d) => selected.has(d.id)).reduce((sum, d) => sum + Number(d.total_amount || 0), 0),
    [dcs, selected]
  );

  const validate = () => {
    const errs = {};
    if (!isLGU && !bankName.trim()) errs.bankName = "Bank name is required.";
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
      bank_account_last4: isLGU ? "" : last4.trim(),
      notes,
      dc_ids: [...selected],
      destination_type: localDest,
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
      {/* Destination selector */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <MDTypography variant="h6" mb={1}>Destination</MDTypography>
        <MDBox display="flex" alignItems="center" gap={2} flexWrap="wrap">
          {canOverride ? (
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Destination *</InputLabel>
              <Select
                value={localDest}
                label="Destination *"
                onChange={(e) => setLocalDest(e.target.value)}
              >
                <MenuItem value="BANK">Private Market (Bank)</MenuItem>
                <MenuItem value="LGU_TREASURY">Public (LGU Treasury Office)</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <Chip
              label={`Destination: ${destinationLabel(localDest, "destinationName")}`}
              size="small"
              variant="outlined"
            />
          )}
          {isOverride && (
            <Alert severity="info" sx={{ py: 0 }}>
              Override: market default is {destinationLabel(destinationType, "destinationName")}.
            </Alert>
          )}
        </MDBox>
      </Paper>

      {/* Bank / LGU metadata */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <MDTypography variant="h6" mb={1}>
          {isLGU ? "LGU Details" : "Bank Details"}
        </MDTypography>
        <MDBox display="flex" gap={2} flexWrap="wrap">
          <TextField
            label={isLGU ? "LGU Office name" : "Bank name *"}
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            error={!!validErr.bankName}
            helperText={validErr.bankName}
            size="small"
            sx={{ minWidth: 200 }}
          />
          {!isLGU && (
            <TextField
              label="Account last 4 digits"
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 8))}
              size="small"
              sx={{ width: 160 }}
            />
          )}
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
        <Button variant="contained" color="info" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Creating…" : "Create Batch"}
        </Button>
      </MDBox>
    </MDBox>
  );
}
