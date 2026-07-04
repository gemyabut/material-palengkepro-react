// src/layouts/stalls/components/StallDetail.js — F9
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import { getStallLeases, getStallLeaseholderRights } from "../api/stalls";

// ── Chip colour maps ──────────────────────────────────────────────────────────
const STATUS_COLOR = {
  AVAILABLE:   "success",
  OCCUPIED:    "primary",
  REPURPOSED:  "secondary",
  MAINTENANCE: "warning",
  INACTIVE:    "default",
};
const LEASE_STATUS_COLOR = {
  ACTIVE:      "success",
  PENDING:     "warning",
  EXPIRED:     "default",
  TERMINATED:  "error",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val) {
  const n = parseFloat(val ?? 0);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function KV({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
KV.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.any };

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardHeader
        title={<Typography variant="subtitle1" fontWeight="bold">{title}</Typography>}
        action={
          <Button size="small" onClick={() => setOpen((v) => !v)}>
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Button>
        }
        sx={{ pb: 0 }}
      />
      <Collapse in={open}>
        <CardContent>{children}</CardContent>
      </Collapse>
    </Card>
  );
}
Section.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  defaultOpen: PropTypes.bool,
};

// ── Main component ────────────────────────────────────────────────────────────
export default function StallDetail({ stall, onEdit, showEdit = true }) {
  const navigate = useNavigate();
  const [leases, setLeases]   = useState([]);
  const [rights, setRights]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!stall?.id) return;
    setLoading(true);
    setError(null);
    Promise.all([getStallLeases(stall.id), getStallLeaseholderRights(stall.id)])
      .then(([ls, rs]) => {
        setLeases(Array.isArray(ls) ? ls : ls?.results ?? []);
        setRights(Array.isArray(rs) ? rs : rs?.results ?? []);
      })
      .catch(() => setError("Failed to load stall details."))
      .finally(() => setLoading(false));
  }, [stall?.id]);

  if (!stall) return null;

  const activeLease = leases.find((l) => l.status === "ACTIVE") || null;

  return (
    <Box>
      {/* Header row */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight="bold">{stall.stall_number}</Typography>
          <Typography variant="body2" color="text.secondary">
            {stall.market_name || `Market #${stall.market}`}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={stall.status}
            color={STATUS_COLOR[stall.status] || "default"}
            size="medium"
          />
          {showEdit && onEdit && (
            <Button variant="outlined" size="small" onClick={onEdit}>Edit</Button>
          )}
        </Stack>
      </Stack>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Section 1 — Stall details */}
      <Section title="1. Stall Info">
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4}><KV label="Stall number" value={stall.stall_number} /></Grid>
          <Grid item xs={6} sm={4}><KV label="Commerce type" value={stall.commerce_type?.replace(/_/g, " ")} /></Grid>
          <Grid item xs={6} sm={4}><KV label="Lease model" value={stall.lease_model} /></Grid>
          <Grid item xs={6} sm={4}><KV label="Zone" value={stall.zone || "—"} /></Grid>
          <Grid item xs={6} sm={4}><KV label="Section" value={stall.section || "—"} /></Grid>
          <Grid item xs={6} sm={4}><KV label="Classification" value={stall.classification || "—"} /></Grid>
          <Grid item xs={6} sm={4}><KV label="Size (sqm)" value={stall.size_sqm ? `${stall.size_sqm} sqm` : "—"} /></Grid>
          <Grid item xs={6} sm={4}><KV label="Current rate" value={stall.current_rate ? fmt(stall.current_rate) : "—"} /></Grid>
          <Grid item xs={6} sm={4}><KV label="Status" value={stall.status} /></Grid>
        </Grid>
      </Section>

      {/* Section 2 — Current occupancy summary */}
      <Section title="2. Current Occupancy">
        {activeLease ? (
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <KV label="Tenant" value={stall.current_tenant_name || activeLease.tenant?.full_name || "—"} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <KV label="Tenant ID" value={stall.current_tenant_id_str || activeLease.tenant?.tenant_id || "—"} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <KV label="Lease ID" value={activeLease.id} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <KV label="Lease end" value={stall.current_lease_end_date || activeLease.end_date || "—"} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <KV label="Monthly rate" value={stall.current_lease_rate ? fmt(stall.current_lease_rate) : "—"} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Outstanding balance</Typography>
                <Typography
                  variant="body2"
                  color={parseFloat(stall.outstanding_balance) > 0 ? "error" : "text.primary"}
                  fontWeight={parseFloat(stall.outstanding_balance) > 0 ? "bold" : "regular"}
                >
                  {stall.outstanding_balance != null ? fmt(stall.outstanding_balance) : "—"}
                </Typography>
              </Box>
            </Grid>
            {activeLease.tenant?.id && (
              <Grid item xs={12}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(`/tenants/${activeLease.tenant.id}`)}
                >
                  View Tenant Profile
                </Button>
              </Grid>
            )}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">No active lease — stall is vacant.</Typography>
        )}
      </Section>

      {/* Section 3 — Lease history */}
      <Section title="3. Lease History" defaultOpen={false}>
        {loading ? (
          <CircularProgress size={20} />
        ) : leases.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No leases found.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leases.map((l) => (
                <TableRow key={l.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/leases/${l.id}`)}>
                  <TableCell>{l.id}</TableCell>
                  <TableCell>{l.tenant?.full_name || "—"}</TableCell>
                  <TableCell>{l.start_date}</TableCell>
                  <TableCell>{l.end_date}</TableCell>
                  <TableCell>{l.lease_amount ? fmt(l.lease_amount) : "—"}</TableCell>
                  <TableCell>
                    <Chip label={l.status} color={LEASE_STATUS_COLOR[l.status] || "default"} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Section 4 — Leaseholder rights history */}
      <Section title="4. Leaseholder Rights" defaultOpen={false}>
        {loading ? (
          <CircularProgress size={20} />
        ) : rights.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No rights transfers recorded.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rights.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.transfer_date}</TableCell>
                  <TableCell>{r.from_tenant_name || "—"}</TableCell>
                  <TableCell>{r.to_tenant_name}</TableCell>
                  <TableCell>{r.transfer_reason?.replace(/_/g, " ")}</TableCell>
                  <TableCell>{r.notes || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Section 5 — Physical notes */}
      <Section title="5. Physical Notes" defaultOpen={false}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><KV label="Route / Selling path" value={stall.route || "—"} /></Grid>
          <Grid item xs={12} sm={6}><KV label="Maintenance notes" value={stall.maintenance_notes || "—"} /></Grid>
          <Grid item xs={12}><KV label="Remarks" value={stall.remarks || "—"} /></Grid>
          <Grid item xs={6} sm={4}><KV label="Created" value={stall.created_at ? stall.created_at.slice(0, 10) : "—"} /></Grid>
          <Grid item xs={6} sm={4}><KV label="Last updated" value={stall.updated_at ? stall.updated_at.slice(0, 10) : "—"} /></Grid>
        </Grid>
      </Section>
    </Box>
  );
}

StallDetail.propTypes = {
  stall: PropTypes.object,
  onEdit: PropTypes.func,
  showEdit: PropTypes.bool,
};
