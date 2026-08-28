// src/layouts/tenants/components/TenantDetail.js — F11 Round A
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UndoIcon from "@mui/icons-material/Undo";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";
import MDButton from "components/MDButton";

import { canEdit } from "../../leases/utils/roleUtils";
import { getMarket } from "../../../api/markets";
import {
  getTenantLeases,
  getTenantLeaseholderRights,
  getTenantInvoices,
  getTenantPayments,
  uploadTenantDocument,
  uploadTenantPhotograph,
  updateVerificationNotes,
  setVerificationStatus,
  downloadTenantIdCard,
} from "../api/tenants";

// ── Chip colour maps ──────────────────────────────────────────────────────────
const STATUS_CHIP = {
  ACTIVE: { label: "Active", color: "success" },
  INACTIVE: { label: "Inactive", color: "default" },
  DELINQUENT: { label: "Delinquent", color: "warning" },
  BLACKLISTED: { label: "Blacklisted", color: "error" },
};
const VERIFICATION_CHIP = {
  VERIFIED: { label: "Verified", color: "success" },
  PENDING: { label: "Pending", color: "warning" },
  UNVERIFIED: { label: "Unverified", color: "default" },
};
const INVOICE_STATUS_CHIP = {
  PAID: { label: "Paid", color: "success" },
  PARTIAL: { label: "Partial", color: "warning" },
  OPEN: { label: "Unpaid", color: "error" },
  VOID: { label: "Void", color: "default" },
};
const METHOD_LABEL = {
  CASH: "Cash",
  E_WALLET: "E-Wallet",
  BANK: "Bank Transfer",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
  CHECK: "Cheque",
  MAYA: "Maya",
  OTHER: "Other",
};
const WALLET_PROVIDER_LABEL = {
  GCASH: "GCash",
  MAYA: "Maya",
  GOTYME: "GoTyme",
  SHOPEEPAY: "ShopeePay",
  OTHER: "Other",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val) {
  const n = parseFloat(val ?? 0);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Neither date-fns nor dayjs is installed in this project — native
// Date.toLocaleDateString covers "MMM yyyy" without a new dependency (same
// pattern as D.1/D.3/D.4/D.5). Appending T00:00:00 (no Z) parses the ISO
// date as local time, avoiding an off-by-one-day shift in negative-UTC-
// offset timezones.
function formatPeriod(periodStart) {
  if (!periodStart) return "—";
  const d = new Date(`${periodStart}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// M1 (UNIT_53 Phase D.1/D.3/D.5/D.6) — canonical SOA order is already
// applied server-side; this just abbreviates for the chip.
const TYPE_ABBREV = {
  RENT: "RENT",
  RIGHTS: "RIGHTS",
  ELECTRICITY: "ELEC",
  WATER: "WATER",
  OTHER: "OTHER",
};

function typeChipLabel(linesSummary) {
  if (!linesSummary || linesSummary.length === 0) return "—";
  return linesSummary.map((code) => TYPE_ABBREV[code] || code).join("+");
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
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

// ── Main component ────────────────────────────────────────────────────────────
export default function TenantDetail({ tenant, user, onEdit, onRequestUpdate, showEdit = true }) {
  const navigate = useNavigate();
  const [leases, setLeases] = useState([]);
  const [rights, setRights] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pastExpanded, setPastExpanded] = useState(false);

  // ── Task #115: Documents & Verification (staff-side upload/verify) ────────
  const [docOverrides, setDocOverrides] = useState({});
  const [notesDraft, setNotesDraft] = useState(tenant?.verification_notes || "");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [docActionError, setDocActionError] = useState(null);
  const [unverifyDialogOpen, setUnverifyDialogOpen] = useState(false);

  // ── PR 4: preferred_market resolution + Print ID Card ──────────────────────
  const [preferredMarket, setPreferredMarket] = useState(null);
  const [downloadingIdCard, setDownloadingIdCard] = useState(false);
  const [idCardError, setIdCardError] = useState(null);

  useEffect(() => {
    setDocOverrides({});
    setNotesDraft(tenant?.verification_notes || "");
  }, [tenant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPreferredMarket(null);
    if (!tenant?.preferred_market) return;
    getMarket(tenant.preferred_market)
      .then(setPreferredMarket)
      .catch(() => {}); // best-effort -- KV row falls back to "—" on failure
  }, [tenant?.preferred_market]);

  const effectiveTenant = { ...tenant, ...docOverrides };

  const handleUploadDocument = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file next time
    if (!file) return;
    setDocActionError(null);
    setUploadingDoc(true);
    try {
      const updated = await uploadTenantDocument(tenant.id, file);
      setDocOverrides((prev) => ({ ...prev, uploaded_documents: updated.uploaded_documents }));
    } catch (err) {
      setDocActionError(err?.response?.data?.detail || "Failed to upload document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleUploadPhotograph = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setDocActionError(null);
    setUploadingPhoto(true);
    try {
      const updated = await uploadTenantPhotograph(tenant.id, file);
      setDocOverrides((prev) => ({ ...prev, photograph: updated.photograph }));
    } catch (err) {
      setDocActionError(err?.response?.data?.detail || "Failed to upload photograph.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePrintIdCard = async () => {
    setIdCardError(null);
    setDownloadingIdCard(true);
    try {
      await downloadTenantIdCard(tenant.id);
    } catch (err) {
      setIdCardError(err?.response?.data?.error || "Failed to generate ID card.");
    } finally {
      setDownloadingIdCard(false);
    }
  };

  const handleSaveNotes = async () => {
    setDocActionError(null);
    setSavingNotes(true);
    try {
      const updated = await updateVerificationNotes(tenant.id, notesDraft);
      setDocOverrides((prev) => ({ ...prev, verification_notes: updated.verification_notes }));
    } catch (err) {
      setDocActionError(err?.response?.data?.detail || "Failed to save verification notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleMarkVerified = async () => {
    setDocActionError(null);
    setVerifying(true);
    try {
      const updated = await setVerificationStatus(tenant.id, "VERIFIED");
      setDocOverrides((prev) => ({
        ...prev,
        verification_status: updated.verification_status,
        date_verified: updated.date_verified,
      }));
    } catch (err) {
      setDocActionError(err?.response?.data?.detail || "Failed to mark tenant verified.");
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmUnverify = async () => {
    setDocActionError(null);
    setVerifying(true);
    try {
      const updated = await setVerificationStatus(tenant.id, "UNVERIFIED");
      setDocOverrides((prev) => ({
        ...prev,
        verification_status: updated.verification_status,
        date_verified: updated.date_verified,
      }));
    } catch (err) {
      setDocActionError(err?.response?.data?.detail || "Failed to unverify tenant.");
    } finally {
      setVerifying(false);
      setUnverifyDialogOpen(false);
    }
  };

  const loadSubResources = (id) => {
    setLoading(true);
    setError(null);
    return Promise.all([
      getTenantLeases(id),
      getTenantLeaseholderRights(id),
      getTenantInvoices(id),
      getTenantPayments(id),
    ])
      .then(([ls, rts, inv, pay]) => {
        setLeases(Array.isArray(ls) ? ls : []);
        setRights(Array.isArray(rts) ? rts : []);
        setInvoices(Array.isArray(inv) ? inv : []);
        setPayments(Array.isArray(pay) ? pay : []);
      })
      .catch((e) => setError(e?.response?.data?.detail || "Failed to load tenant data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!tenant?.id) return;
    loadSubResources(tenant.id);
  }, [tenant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tenant) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">Tenant not found.</Typography>
        </CardContent>
      </Card>
    );
  }

  const editable = canEdit(user);
  const statusMeta = STATUS_CHIP[tenant.status] || { label: tenant.status, color: "default" };
  const verMeta = VERIFICATION_CHIP[effectiveTenant.verification_status] || {
    label: effectiveTenant.verification_status,
    color: "default",
  };
  const activeLeases = leases.filter((l) => l.status === "ACTIVE");
  const pastLeases = leases.filter((l) => l.status !== "ACTIVE");
  const leaseMap = Object.fromEntries(leases.map((l) => [l.id, l]));

  return (
    <Stack spacing={3}>
      {/* ── Section 1: Identity & Verification ─────────────────────────── */}
      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="flex-start">
            {/* Photo / Avatar -- tenant + contact person (view-only), side by side.
                Both blank -> a single placeholder (not two empty avatars);
                one present -> show it plus a placeholder for the other. */}
            {!effectiveTenant.photograph && !effectiveTenant.contact_person_photograph ? (
              <Grid item xs={12} sm="auto">
                <Avatar sx={{ width: 96, height: 96, bgcolor: "primary.main", fontSize: 32 }}>
                  {initials(tenant.full_name)}
                </Avatar>
              </Grid>
            ) : (
              <Grid item xs={12} sm="auto">
                <Stack direction="row" spacing={1}>
                  <Box textAlign="center">
                    {effectiveTenant.photograph ? (
                      <Box
                        component="img"
                        src={effectiveTenant.photograph}
                        alt={tenant.full_name}
                        sx={{ width: 96, height: 96, borderRadius: 2, objectFit: "cover" }}
                      />
                    ) : (
                      <Avatar sx={{ width: 96, height: 96, bgcolor: "primary.main", fontSize: 32 }}>
                        {initials(tenant.full_name)}
                      </Avatar>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block">
                      Tenant
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    {effectiveTenant.contact_person_photograph ? (
                      <Box
                        component="img"
                        src={effectiveTenant.contact_person_photograph}
                        alt={tenant.contact_person || "Contact person"}
                        sx={{ width: 96, height: 96, borderRadius: 2, objectFit: "cover" }}
                      />
                    ) : (
                      <Avatar sx={{ width: 96, height: 96, bgcolor: "grey.400", fontSize: 32 }}>
                        {initials(tenant.contact_person)}
                      </Avatar>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block">
                      Contact Person
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            )}

            {/* Identity */}
            <Grid item xs>
              <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                {tenant.tenant_id || "—"}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {tenant.full_name}
              </Typography>
              {tenant.business_name && tenant.business_name !== tenant.full_name && (
                <Typography variant="subtitle1" color="text.secondary">
                  {tenant.business_name}
                </Typography>
              )}
              <Stack direction="row" spacing={1} mt={1}>
                <Chip size="small" label={statusMeta.label} color={statusMeta.color} />
                <Chip size="small" label={verMeta.label} color={verMeta.color} variant="outlined" />
              </Stack>
            </Grid>

            {/* Actions */}
            {(editable && showEdit) || user?.role === "tenant" || user?.role === "executive" ? (
              <Grid item xs={12} sm="auto">
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {editable && showEdit && (
                    <Button size="small" variant="outlined" onClick={() => onEdit?.(tenant.id)}>
                      Edit
                    </Button>
                  )}
                  {editable && showEdit && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => onEdit?.(tenant.id, "deactivate")}
                    >
                      Deactivate
                    </Button>
                  )}
                  {user?.role === "tenant" && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => onRequestUpdate?.(tenant.id)}
                    >
                      Request Update
                    </Button>
                  )}
                  {/* Owner-only, matches backend TenantIdCardExportPermission gate exactly
                      (defense-in-depth per BUG #25 discipline -- not relying on the 403 alone) */}
                  {user?.role === "executive" && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handlePrintIdCard}
                      disabled={downloadingIdCard}
                    >
                      {downloadingIdCard ? "Generating…" : "Print ID Card"}
                    </Button>
                  )}
                </Stack>
                {idCardError && (
                  <Typography variant="caption" color="error" display="block" mt={0.5}>
                    {idCardError}
                  </Typography>
                )}
              </Grid>
            ) : null}
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Key/value grid */}
          <Grid container spacing={2} columns={2}>
            <Grid item xs={2} sm={1}>
              <KV label="Address" value={tenant.address} />
            </Grid>
            <Grid item xs={2} sm={1}>
              <KV label="Barangay" value={tenant.barangay} />
            </Grid>
            <Grid item xs={2} sm={1}>
              <KV label="Mobile" value={tenant.mobile_phone} />
            </Grid>
            <Grid item xs={2} sm={1}>
              <KV label="Email" value={tenant.email_address} />
            </Grid>
            <Grid item xs={2} sm={1}>
              <KV label="Contact Person" value={tenant.contact_person} />
            </Grid>
            <Grid item xs={2} sm={1}>
              <KV label="Contact Phone" value={tenant.contact_phone_number} />
            </Grid>
            <Grid item xs={2} sm={1}>
              <KV label="Preferred Market" value={preferredMarket?.code} />
            </Grid>
            <Grid item xs={2} sm={1}>
              <KV label="Government ID" value={tenant.government_id} />
            </Grid>
            <Grid item xs={2} sm={1}>
              <KV label="Barangay Permit" value={tenant.barangay_permit_number} />
            </Grid>
            {effectiveTenant.verification_status === "VERIFIED" && (
              <Grid item xs={2} sm={1}>
                <KV label="Date Verified" value={effectiveTenant.date_verified} />
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* ── Documents & Verification (Task #115) ─────────────────────── */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Documents &amp; Verification
          </Typography>

          {docActionError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDocActionError(null)}>
              {docActionError}
            </Alert>
          )}

          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Uploaded Document
              </Typography>
              {effectiveTenant.uploaded_documents ? (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <a href={effectiveTenant.uploaded_documents} target="_blank" rel="noreferrer">
                    View current document
                  </a>
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  None uploaded.
                </Typography>
              )}
              {editable && (
                <MDButton
                  variant="contained"
                  color="info"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  disabled={uploadingDoc}
                >
                  {uploadingDoc
                    ? "Uploading…"
                    : effectiveTenant.uploaded_documents
                    ? "Replace Document"
                    : "Upload Document"}
                  <input hidden type="file" onChange={handleUploadDocument} />
                </MDButton>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Photograph
              </Typography>
              {editable && (
                <MDButton
                  variant="contained"
                  color="info"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto
                    ? "Uploading…"
                    : effectiveTenant.photograph
                    ? "Replace Photograph"
                    : "Upload Photograph"}
                  <input hidden type="file" accept="image/*" onChange={handleUploadPhotograph} />
                </MDButton>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Verification Notes
              </Typography>
              {editable ? (
                <>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    size="small"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <MDButton
                    variant="contained"
                    color="info"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveNotes}
                    disabled={
                      savingNotes || notesDraft === (effectiveTenant.verification_notes || "")
                    }
                  >
                    {savingNotes ? "Saving…" : "Save Notes"}
                  </MDButton>
                </>
              ) : (
                <Typography
                  variant="body2"
                  color={effectiveTenant.verification_notes ? "text.primary" : "text.secondary"}
                >
                  {effectiveTenant.verification_notes || "No notes on record."}
                </Typography>
              )}
            </Grid>

            {editable && (
              <Grid item xs={12}>
                <Stack direction="row" spacing={1}>
                  {effectiveTenant.verification_status !== "VERIFIED" ? (
                    <MDButton
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={handleMarkVerified}
                      disabled={verifying}
                    >
                      Mark Verified
                    </MDButton>
                  ) : (
                    <MDButton
                      variant="outlined"
                      color="warning"
                      startIcon={<UndoIcon />}
                      onClick={() => setUnverifyDialogOpen(true)}
                      disabled={verifying}
                    >
                      Unverify
                    </MDButton>
                  )}
                </Stack>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* ── Unverify confirmation dialog (Task #115) ───────────────────── */}
      <Dialog open={unverifyDialogOpen} onClose={() => setUnverifyDialogOpen(false)}>
        <DialogTitle>Unverify this tenant?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will revert their status from VERIFIED to UNVERIFIED. date_verified will be
            preserved for audit trail.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnverifyDialogOpen(false)} disabled={verifying}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmUnverify}
            disabled={verifying}
          >
            {verifying ? "Unverifying…" : "Unverify"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Error / Loading for sub-resources ──────────────────────────── */}
      {loading && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={28} />
        </Box>
      )}
      {error && !loading && (
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={() => loadSubResources(tenant.id)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {/* ── Section 2: Stalls & Leases ─────────────────────────────── */}
          <Card>
            <CardHeader
              title={
                <Typography variant="h6">
                  Stalls &amp; Leases{" "}
                  <Typography component="span" variant="body2" color="text.secondary">
                    {activeLeases.length} active · {pastLeases.length} past
                  </Typography>
                </Typography>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              {leases.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No leases on record for this tenant.
                </Typography>
              ) : (
                <>
                  {activeLeases.length > 0 && (
                    <LeaseTable leases={activeLeases} showTerminated={false} />
                  )}
                  {pastLeases.length > 0 && (
                    <Box mt={activeLeases.length > 0 ? 2 : 0}>
                      <Button
                        size="small"
                        endIcon={pastExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        onClick={() => setPastExpanded((p) => !p)}
                      >
                        {pastExpanded ? "Hide" : "Show"} past leases ({pastLeases.length})
                      </Button>
                      <Collapse in={pastExpanded}>
                        <Box mt={1}>
                          <LeaseTable leases={pastLeases} showTerminated />
                        </Box>
                      </Collapse>
                    </Box>
                  )}
                </>
              )}
              {/* ── Rights sub-section ─────────────────────────────── */}
              {rights.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Stalls where this tenant holds leaseholder rights
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {["Stall #", "Market", "Since", "Reason", "From", "Current"].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(() => {
                        // Latest record per stall = current holder
                        const latestPerStall = {};
                        rights.forEach((r) => {
                          if (
                            !latestPerStall[r.stall] ||
                            r.transfer_date > latestPerStall[r.stall].transfer_date
                          ) {
                            latestPerStall[r.stall] = r;
                          }
                        });
                        return rights.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell sx={{ fontFamily: "monospace" }}>{r.stall_code}</TableCell>
                            <TableCell>{r.market_code}</TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>{r.transfer_date}</TableCell>
                            <TableCell>{r.transfer_reason?.replace(/_/g, " ")}</TableCell>
                            <TableCell>{r.from_tenant_name || "—"}</TableCell>
                            <TableCell>
                              {latestPerStall[r.stall]?.id === r.id && (
                                <Chip size="small" label="Current" color="success" />
                              )}
                            </TableCell>
                          </TableRow>
                        ));
                      })()}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Section 3: Financial Summary ────────────────────────────── */}
          <Grid container spacing={2}>
            {[
              {
                label: "Outstanding Balance",
                value: fmt(tenant.outstanding_balance),
                alert: parseFloat(tenant.outstanding_balance ?? 0) > 0,
              },
              { label: "Lifetime Payments", value: fmt(tenant.lifetime_payment_total) },
              { label: "Late Payments", value: tenant.number_of_late_payments ?? 0 },
              { label: "Active Leases", value: tenant.active_lease_count ?? 0 },
            ].map(({ label, value, alert }) => (
              <Grid item xs={6} sm={3} key={label}>
                <Card>
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {label}
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color={alert ? "error.main" : "text.primary"}
                    >
                      {value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* ── Charge-type balance breakdown + View Full SOA (M1 Q3+C1, Phase D.6) —
              empty sections (₱0.00) still render per the lock. ─────────────── */}
          {tenant.sections && (
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              {tenant.sections.map((section) => (
                <Chip
                  key={section.charge_type_code}
                  size="small"
                  color={Number(section.balance) > 0 ? "warning" : "default"}
                  label={`${section.charge_type_label} ${fmt(section.balance)}`}
                />
              ))}
              <Button
                size="small"
                variant="outlined"
                color="info"
                onClick={() => navigate(`/soa?tenant_id=${tenant.id}`)}
              >
                View Full SOA
              </Button>
            </Stack>
          )}

          {/* ── Section 4: Recent Invoices ──────────────────────────────── */}
          <Card>
            <CardHeader title="Recent Invoices" />
            <CardContent sx={{ pt: 0 }}>
              {invoices.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No invoices on record.
                </Typography>
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {[
                          "Invoice #",
                          "Period",
                          "Type",
                          "Total",
                          "Paid",
                          "Balance",
                          "Due Date",
                          "Status",
                        ].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((inv) => {
                        const meta = INVOICE_STATUS_CHIP[inv.status] || {
                          label: inv.status,
                          color: "default",
                        };
                        return (
                          <TableRow
                            key={inv.id}
                            hover
                            sx={{ cursor: "pointer" }}
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                          >
                            <TableCell sx={{ fontFamily: "monospace" }}>
                              {inv.invoice_number || `#${inv.id}`}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {formatPeriod(inv.period_start)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={typeChipLabel(inv.lines_summary)}
                                size="small"
                                color="default"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{fmt(inv.total)}</TableCell>
                            <TableCell>{fmt(inv.paid)}</TableCell>
                            <TableCell
                              sx={{
                                color: parseFloat(inv.balance ?? 0) > 0 ? "error.main" : "inherit",
                                fontWeight: parseFloat(inv.balance ?? 0) > 0 ? "bold" : "normal",
                              }}
                            >
                              {fmt(inv.balance)}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {inv.due_date || "—"}
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={meta.label} color={meta.color} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {invoices.length === 10 && (
                    <Box mt={1} textAlign="right">
                      <Button
                        size="small"
                        onClick={() => navigate(`/invoices?tenant=${tenant.id}`)}
                      >
                        View all invoices →
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Section 5: Recent Payments ──────────────────────────────── */}
          <Card>
            <CardHeader title="Recent Payments" />
            <CardContent sx={{ pt: 0 }}>
              {payments.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No payments on record.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Date", "Amount", "Method", "Receipt #", "Stall"].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((pay) => {
                      const lease = leaseMap[pay.lease];
                      const stall = lease?.stall;
                      return (
                        <TableRow key={pay.id}>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{pay.payment_date}</TableCell>
                          <TableCell>{fmt(pay.amount)}</TableCell>
                          <TableCell>
                            {METHOD_LABEL[pay.method] || pay.method}
                            {pay.method === "E_WALLET" && pay.wallet_provider && (
                              <Chip
                                size="small"
                                label={WALLET_PROVIDER_LABEL[pay.wallet_provider] || pay.wallet_provider}
                                sx={{ ml: 1 }}
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ fontFamily: "monospace" }}>
                            {pay.receipt_number || "—"}
                          </TableCell>
                          <TableCell>{stall?.stall_number || `Lease #${pay.lease}`}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Stack>
  );
}

// ── LeaseTable sub-component ──────────────────────────────────────────────────
function LeaseTable({ leases, showTerminated }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {[
            "Stall #",
            "Zone",
            "Type",
            "Start – End",
            "Rate",
            "Schedule",
            ...(showTerminated ? ["Status"] : []),
          ].map((h) => (
            <TableCell key={h} sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}>
              {h}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {leases.map((l) => (
          <TableRow key={l.id}>
            <TableCell>{l.stall?.stall_number || "—"}</TableCell>
            <TableCell>{l.stall?.zone || "—"}</TableCell>
            <TableCell>{l.lease_type}</TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
              {l.start_date} – {l.end_date}
            </TableCell>
            <TableCell>{fmt(l.lease_amount)}</TableCell>
            <TableCell>{l.payment_schedule}</TableCell>
            {showTerminated && <TableCell>{l.status}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

TenantDetail.propTypes = {
  tenant: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    tenant_id: PropTypes.string,
    full_name: PropTypes.string,
    business_name: PropTypes.string,
    address: PropTypes.string,
    barangay: PropTypes.string,
    mobile_phone: PropTypes.string,
    email_address: PropTypes.string,
    contact_person: PropTypes.string,
    contact_phone_number: PropTypes.string,
    government_id: PropTypes.string,
    barangay_permit_number: PropTypes.string,
    status: PropTypes.string,
    verification_status: PropTypes.string,
    date_verified: PropTypes.string,
    verification_notes: PropTypes.string,
    photograph: PropTypes.string,
    lifetime_payment_total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    number_of_late_payments: PropTypes.number,
    lease_duration_average: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    active_lease_count: PropTypes.number,
    outstanding_balance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        charge_type_code: PropTypes.string,
        charge_type_label: PropTypes.string,
        balance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        total_charged: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        total_paid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
  }),
  user: PropTypes.object,
  showEdit: PropTypes.bool,
  onEdit: PropTypes.func,
  onRequestUpdate: PropTypes.func,
};
