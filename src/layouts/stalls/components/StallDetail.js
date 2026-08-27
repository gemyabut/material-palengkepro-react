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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";

import { getStallLeases, getStallLeaseholderRights } from "../api/stalls";

// ── Chip colour maps ──────────────────────────────────────────────────────────
const STATUS_COLOR = {
  AVAILABLE: "success",
  OCCUPIED: "primary",
  REPURPOSED: "secondary",
  MAINTENANCE: "warning",
  INACTIVE: "default",
};
const LEASE_STATUS_COLOR = {
  ACTIVE: "success",
  PENDING: "warning",
  EXPIRED: "default",
  TERMINATED: "error",
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
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}
KV.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.any };

// Booleans render as nothing under plain KV (React drops a bare `false`
// child) — this renders an explicit ✓ / — icon pair instead.
function BoolKV({ label, value }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {value ? (
        <CheckCircleIcon fontSize="small" color="success" />
      ) : (
        <RemoveCircleOutlineIcon fontSize="small" color="disabled" />
      )}
      <Typography variant="body2">{label}</Typography>
    </Stack>
  );
}
BoolKV.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.bool };

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardHeader
        title={
          <Typography variant="subtitle1" fontWeight="bold">
            {title}
          </Typography>
        }
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
  const [leases, setLeases] = useState([]);
  const [rights, setRights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
          <Typography variant="h5" fontWeight="bold">
            {stall.stall_number}
          </Typography>
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
            <Button variant="outlined" size="small" onClick={onEdit}>
              Edit
            </Button>
          )}
        </Stack>
      </Stack>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Section 1 — Stall details */}
      <Section title="1. Stall Info">
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4}>
            <KV label="Stall number" value={stall.stall_number} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KV label="Commerce type" value={stall.commerce_type?.replace(/_/g, " ")} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KV label="Commerce subtype" value={stall.commerce_subtype?.replace(/_/g, " ")} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KV label="Lease model" value={stall.lease_model} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KV label="Zone" value={stall.zone || "—"} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KV label="Section" value={stall.section || "—"} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KV label="Classification" value={stall.classification || "—"} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KV label="Size (sqm)" value={stall.size_sqm ? `${stall.size_sqm} sqm` : "—"} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KV label="Status" value={stall.status} />
          </Grid>
        </Grid>
      </Section>

      {/* Section 2 — Current occupancy summary */}
      <Section title="2. Current Occupancy">
        {activeLease ? (
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <KV
                label="Tenant"
                value={stall.current_tenant_name || activeLease.tenant?.full_name || "—"}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <KV
                label="Tenant ID"
                value={stall.current_tenant_id_str || activeLease.tenant?.tenant_id || "—"}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <KV label="Lease ID" value={activeLease.id} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <KV
                label="Lease end"
                value={stall.current_lease_end_date || activeLease.end_date || "—"}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <KV
                label="Monthly rate"
                value={stall.current_lease_rate ? fmt(stall.current_lease_rate) : "—"}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Outstanding balance
                </Typography>
                <Typography
                  variant="body2"
                  color={parseFloat(stall.outstanding_balance) > 0 ? "error" : "text.primary"}
                  fontWeight={parseFloat(stall.outstanding_balance) > 0 ? "bold" : "regular"}
                >
                  {stall.outstanding_balance != null ? fmt(stall.outstanding_balance) : "—"}
                </Typography>
              </Box>
            </Grid>
            {/* Charge-type balance breakdown (M1 Q3+C1, Phase D.6) — empty
                sections (₱0.00) still render per the lock. */}
            {stall.sections && (
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  {stall.sections.map((section) => (
                    <Chip
                      key={section.charge_type_code}
                      size="small"
                      color={Number(section.balance) > 0 ? "warning" : "default"}
                      label={`${section.charge_type_label} ${fmt(section.balance)}`}
                    />
                  ))}
                </Stack>
              </Grid>
            )}
            {activeLease.tenant?.id && (
              <Grid item xs={12}>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/tenants/${activeLease.tenant.id}`)}
                  >
                    View Tenant Profile
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="info"
                    onClick={() => navigate(`/soa?tenant_id=${activeLease.tenant.id}`)}
                  >
                    View Full SOA
                  </Button>
                </Stack>
              </Grid>
            )}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No active lease — stall is vacant.
          </Typography>
        )}
      </Section>

      {/* Section 3 — Physical attributes (PR #93) */}
      <Section title="3. Physical Attributes" defaultOpen={false}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4}>
            <KV label="Floor level" value={stall.floor_level?.replace(/_/g, " ")} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KV label="Frontage type" value={stall.frontage_type?.replace(/_/g, " ")} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KV label="Size dimensions" value={stall.size_dimensions || "—"} />
          </Grid>
          <Grid item xs={12}>
            <KV label="Description" value={stall.description || "—"} />
          </Grid>
        </Grid>
      </Section>

      {/* Section 4 — Utility infrastructure (PR #93) */}
      <Section title="4. Utility Infrastructure" defaultOpen={false}>
        <Grid container spacing={1}>
          <Grid item xs={6} sm={3}>
            <BoolKV label="Electricity" value={stall.has_electricity} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <BoolKV label="Electricity meter" value={stall.has_electricity_meter} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <BoolKV label="Water" value={stall.has_water} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <BoolKV label="Water meter" value={stall.has_water_meter} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <BoolKV label="Drainage" value={stall.has_drainage} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <BoolKV label="Gas connection" value={stall.has_gas_connection} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <BoolKV label="Cold storage" value={stall.has_cold_storage} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <BoolKV label="Grease trap" value={stall.has_grease_trap} />
          </Grid>
        </Grid>
      </Section>

      {/* Section 5 — Photos (PR #93). Full gallery is Tier 1.5 — pilot gets a
          count + a link to the first photo. */}
      <Section title="5. Photos" defaultOpen={false}>
        {(() => {
          const urls = (stall.photo_urls || "")
            .split(",")
            .map((u) => u.trim())
            .filter(Boolean);
          if (urls.length === 0) {
            return (
              <Typography variant="body2" color="text.secondary">
                0 photos attached.
              </Typography>
            );
          }
          return (
            <Stack direction="row" spacing={1} alignItems="center">
              <PhotoLibraryIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {urls.length} photo{urls.length === 1 ? "" : "s"} attached
              </Typography>
              <Button
                size="small"
                variant="outlined"
                href={urls[0]}
                target="_blank"
                rel="noopener noreferrer"
              >
                View
              </Button>
            </Stack>
          );
        })()}
      </Section>

      {/* Section 6 — Lease history */}
      <Section title="6. Lease History" defaultOpen={false}>
        {loading ? (
          <CircularProgress size={20} />
        ) : leases.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No leases found.
          </Typography>
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
                <TableRow
                  key={l.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/leases/${l.id}`)}
                >
                  <TableCell>{l.id}</TableCell>
                  <TableCell>{l.tenant?.full_name || "—"}</TableCell>
                  <TableCell>{l.start_date}</TableCell>
                  <TableCell>{l.end_date}</TableCell>
                  <TableCell>{l.lease_amount ? fmt(l.lease_amount) : "—"}</TableCell>
                  <TableCell>
                    <Chip
                      label={l.status}
                      color={LEASE_STATUS_COLOR[l.status] || "default"}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Section 7 — Leaseholder rights history */}
      <Section title="7. Leaseholder Rights" defaultOpen={false}>
        {loading ? (
          <CircularProgress size={20} />
        ) : rights.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No rights transfers recorded.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment method</TableCell>
                <TableCell>LGU approval</TableCell>
                <TableCell>LGU reference</TableCell>
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
                  <TableCell>{r.transfer_amount ? fmt(r.transfer_amount) : "—"}</TableCell>
                  <TableCell>{r.payment_method?.replace(/_/g, " ") || "—"}</TableCell>
                  <TableCell>{r.lgu_approval_status?.replace(/_/g, " ") || "—"}</TableCell>
                  <TableCell>{r.lgu_approval_reference || "—"}</TableCell>
                  <TableCell>{r.notes || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Section 8 — Physical notes */}
      <Section title="8. Physical Notes" defaultOpen={false}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <KV label="Route / Selling path" value={stall.route || "—"} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <KV label="Maintenance notes" value={stall.maintenance_notes || "—"} />
          </Grid>
          <Grid item xs={12}>
            <KV label="Remarks" value={stall.remarks || "—"} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KV label="Created" value={stall.created_at ? stall.created_at.slice(0, 10) : "—"} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <KV
              label="Last updated"
              value={stall.updated_at ? stall.updated_at.slice(0, 10) : "—"}
            />
          </Grid>
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
