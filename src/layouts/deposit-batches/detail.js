import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canViewBatches, canEditBatches, canConfirmBatches } from "utils/permissions";
import { destinationLabel } from "utils/destinationLabels";
import { getBatch, markDeposited, confirmBatch } from "api/remittanceBatches";
import BatchStatusChip from "./components/BatchStatusChip";
import MarkDepositedModal from "./components/MarkDepositedModal";
import ConfirmDepositModal from "./components/ConfirmDepositModal";
import DeductionList from "./components/DeductionList";
import DeductionCreateModal from "./components/DeductionCreateModal";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

const peso = (v) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const MEDIA_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

function LV({ label, value }) {
  return (
    <MDBox mb={1}>
      <MDTypography variant="caption" color="secondary" fontWeight="medium">
        {label}
      </MDTypography>
      <MDTypography variant="body2">{value ?? "—"}</MDTypography>
    </MDBox>
  );
}

function DestinationChip({ destinationType }) {
  if (!destinationType) return null;
  return (
    <Chip
      size="small"
      label={destinationLabel(destinationType, "destinationName")}
      color={destinationType === "LGU_TREASURY" ? "success" : "info"}
      variant="outlined"
    />
  );
}

export default function DepositBatchDetailPage() {
  const role = getRole();
  const { id } = useParams();
  const navigate = useNavigate();

  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, msg: "", sev: "success" });
  const [depositOpen, setDepositOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [deductionOpen, setDeductionOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const b = await getBatch(id);
      setBatch(b);
    } catch (e) {
      setError(e?.response?.status === 404 ? "Batch not found." : "Failed to load batch.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canViewBatches(role)) return <Navigate to="/dashboard" replace />;

  const toast = (msg, sev = "success") => setSnackbar({ open: true, msg, sev });

  const handleMarkDeposited = async (formData) => {
    setActioning(true);
    try {
      const updated = await markDeposited(id, formData);
      setBatch(updated);
      setDepositOpen(false);
      const dest = batch?.destination_type ?? "BANK";
      toast(`Batch marked as deposited. Cash moved: Safe → ${destinationLabel(dest, "pending")}.`);
    } catch (e) {
      const detail =
        e?.response?.data?.denomination_total?.[0] ||
        e?.response?.data?.detail ||
        e?.response?.data?.slip_file ||
        "Action failed.";
      toast(detail, "error");
    } finally {
      setActioning(false);
    }
  };

  const handleConfirm = async (ref) => {
    setActioning(true);
    try {
      const dest = batch?.destination_type ?? "BANK";
      const refField = destinationLabel(dest, "refField");
      const updated = await confirmBatch(id, ref, refField);
      setBatch(updated);
      setConfirmOpen(false);
      toast(
        `Remittance confirmed. Cash moved: ${destinationLabel(
          dest,
          "pending"
        )} → ${destinationLabel(dest, "settled")}.`
      );
    } catch (e) {
      const detail =
        e?.response?.data?.detail ||
        e?.response?.data?.bank_confirmation_ref ||
        e?.response?.data?.lgu_or_number ||
        "Action failed.";
      toast(detail, "error");
    } finally {
      setActioning(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </MDBox>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox p={4}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="outlined" color="dark" onClick={() => navigate("/deposit-batches")}>
            Back to Batches
          </Button>
        </MDBox>
      </DashboardLayout>
    );
  }

  if (!batch) return null;

  const dest = batch.destination_type ?? "BANK";
  const isLGU = dest === "LGU_TREASURY";

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* Header */}
        <MDBox display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
          <MDTypography variant="h4" fontWeight="bold">
            Deposit Batch #{batch.id}
          </MDTypography>
          <BatchStatusChip status={batch.status} size="medium" />
          <DestinationChip destinationType={batch.destination_type} />
        </MDBox>

        {/* Meta + Totals */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={7}>
            <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
              <MDTypography variant="h6" mb={1}>
                Batch Details
              </MDTypography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <LV label="Date" value={batch.date} />
                </Grid>
                <Grid item xs={6}>
                  <LV label="Type" value={batch.batch_type} />
                </Grid>
                {isLGU ? (
                  <Grid item xs={6}>
                    <LV label="LGU Office" value={batch.bank_name} />
                  </Grid>
                ) : (
                  <>
                    <Grid item xs={6}>
                      <LV label="Bank" value={batch.bank_name} />
                    </Grid>
                    <Grid item xs={6}>
                      <LV
                        label="Account"
                        value={batch.bank_account_last4 ? `••••${batch.bank_account_last4}` : "—"}
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={6}>
                  <LV label="Deposit date" value={batch.deposit_date} />
                </Grid>
                <Grid item xs={6}>
                  <LV label="Reference" value={batch.reference} />
                </Grid>
                {batch.status === "CONFIRMED" && (
                  <>
                    <Grid item xs={6}>
                      <LV
                        label={destinationLabel(dest, "refLabel")}
                        value={isLGU ? batch.lgu_or_number : batch.bank_confirmation_ref}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <LV
                        label="Confirmed at"
                        value={
                          batch.confirmed_at ? new Date(batch.confirmed_at).toLocaleString() : "—"
                        }
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
              <MDTypography variant="h6" mb={1}>
                Totals
              </MDTypography>
              <LV label="Total" value={peso((Number(batch.total_to_bank) || 0) + (Number(batch.total_to_lgu) || 0))} />
              <LV label="Items" value={`${batch.item_count || (batch.items || []).length}`} />
              {batch.notes && <LV label="Notes" value={batch.notes} />}
            </Paper>
          </Grid>
        </Grid>

        {/* Denomination breakdown — shown when entered on mark-deposited (D4) */}
        {batch.denomination_entered && (
          <MDBox mb={2}>
            <MDTypography variant="h6" mb={1}>Denomination Breakdown</MDTypography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {[
                ["₱1,000 bills", batch.bill_1000, 1000],
                ["₱500 bills",   batch.bill_500,  500],
                ["₱200 bills",   batch.bill_200,  200],
                ["₱100 bills",   batch.bill_100,  100],
                ["₱50 bills",    batch.bill_50,   50],
                ["₱20 bills",    batch.bill_20,   20],
                ["₱20 coins",    batch.coin_20,   20],
                ["₱10 coins",    batch.coin_10,   10],
                ["₱5 coins",     batch.coin_5,    5],
                ["₱1 coins",     batch.coin_1,    1],
                ["25¢ coins",    batch.coin_025,  0.25],
                ["10¢ coins",    batch.coin_010,  0.10],
              ].filter(([, count]) => count > 0).map(([label, count, unit]) => (
                <MDBox key={label} display="flex" justifyContent="space-between" mb={0.5}>
                  <MDTypography variant="caption">{label} × {count}</MDTypography>
                  <MDTypography variant="caption" fontWeight="medium">
                    {peso(count * unit)}
                  </MDTypography>
                </MDBox>
              ))}
              <MDBox display="flex" justifyContent="space-between" mt={1} pt={1}
                sx={{ borderTop: "1px solid #e0e0e0" }}>
                <MDTypography variant="body2" fontWeight="bold">Denomination Total</MDTypography>
                <MDTypography variant="body2" fontWeight="bold">
                  {peso(batch.computed_denomination_total)}
                </MDTypography>
              </MDBox>
            </Paper>
          </MDBox>
        )}

        {/* Items table */}
        <MDTypography variant="h6" mb={1}>
          Collections in Batch
        </MDTypography>
        <Paper variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Collection date</TableCell>
                <TableCell>Collector</TableCell>
                <TableCell align="right">Cash intake</TableCell>
                <TableCell align="right">To bank</TableCell>
                <TableCell align="right">To LGU</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(batch.items || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <MDTypography variant="body2" color="secondary">
                      No items.
                    </MDTypography>
                  </TableCell>
                </TableRow>
              ) : (
                (batch.items || []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.dc_date}</TableCell>
                    <TableCell>{item.collector_name}</TableCell>
                    <TableCell align="right">{peso(item.amount_cash)}</TableCell>
                    <TableCell align="right">{peso(item.total_to_bank)}</TableCell>
                    <TableCell align="right">{peso(item.total_to_lgu)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* Cash movements */}
        {(batch.cash_movements || []).length > 0 && (
          <>
            <MDTypography variant="h6" mb={1}>
              Cash Movements
            </MDTypography>
            <Paper variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell>Direction</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>When</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batch.cash_movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.source_type}</TableCell>
                      <TableCell>
                        {m.account_name} ({m.account_type})
                      </TableCell>
                      <TableCell>{m.direction}</TableCell>
                      <TableCell align="right">{peso(m.amount)}</TableCell>
                      <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </>
        )}

        {/* Proof docs */}
        {(batch.bank_docs || []).length > 0 && (
          <>
            <MDTypography variant="h6" mb={1}>
              {destinationLabel(dest, "proofLabel")}
            </MDTypography>
            {batch.bank_docs.map((d) => (
              <Paper key={d.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                <MDBox display="flex" gap={2} alignItems="center">
                  <MDTypography variant="body2">
                    {d.bank_name} {d.account_last4 ? `••••${d.account_last4}` : ""}
                  </MDTypography>
                  <MDTypography variant="caption" color="secondary">
                    {d.deposit_date}
                  </MDTypography>
                  {d.file_url && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="dark"
                      href={`${MEDIA_BASE}${d.file_url}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View {destinationLabel(dest, "proofLabel")}
                    </Button>
                  )}
                </MDBox>
              </Paper>
            ))}
            <Divider sx={{ my: 2 }} />
          </>
        )}

        <DeductionList
          deductions={batch?.deductions}
          batchId={id}
          role={role}
          onOpenCreate={() => setDeductionOpen(true)}
          onRefresh={load}
        />

        {/* Action buttons */}
        <MDBox display="flex" gap={2} flexWrap="wrap" mt={3}>
          <Button variant="outlined" color="dark" onClick={() => navigate("/deposit-batches")}>
            Back to List
          </Button>
          {batch.status === "OPEN" && canEditBatches(role) && (
            <Button variant="contained" color="warning" onClick={() => setDepositOpen(true)}>
              Mark Deposited
            </Button>
          )}
          {batch.status === "POSTED" && canConfirmBatches(role) && (
            <Button variant="contained" color="success" onClick={() => setConfirmOpen(true)}>
              Confirm Remittance
            </Button>
          )}
        </MDBox>
      </MDBox>

      {deductionOpen && (
        <DeductionCreateModal
          open={deductionOpen}
          batchId={id}
          pendingCount={
            (batch?.deductions?.items || []).filter((d) => d.status === "PENDING_APPROVAL").length
          }
          onClose={() => setDeductionOpen(false)}
          onCreated={() => {
            setDeductionOpen(false);
            load();
          }}
        />
      )}
      {depositOpen && (
        <MarkDepositedModal
          open={depositOpen}
          batch={batch}
          onClose={() => setDepositOpen(false)}
          onConfirm={handleMarkDeposited}
          submitting={actioning}
        />
      )}
      {confirmOpen && (
        <ConfirmDepositModal
          open={confirmOpen}
          batch={batch}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
          submitting={actioning}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.sev}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
