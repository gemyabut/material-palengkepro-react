import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Pagination,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import { canAddStall, canEditStall, canDeleteStall } from "utils/permissions";
import { useAuthProfile } from "context/AuthContext";
import StallsSummaryWidget from "./components/StallsSummaryWidget";
import AddStallForm from "./components/AddStallForm";
import EditStallForm from "./components/EditStallForm";
import useStalls from "./hooks/useStalls";
import { STATUS_CHOICES, COMMERCE_TYPE_CHOICES, LEASE_MODEL_CHOICES } from "./data/choices";

const STATUS_COLOR = {
  AVAILABLE:   "success",
  OCCUPIED:    "primary",
  REPURPOSED:  "secondary",
  MAINTENANCE: "warning",
  INACTIVE:    "default",
};

function fmt(val) {
  const n = parseFloat(val ?? 0);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const pageSizeOptions = [20, 50, 100];

export default function StallsPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuthProfile();
  const role = userProfile?.role || "";

  const canAdd    = canAddStall(role);
  const canEdit   = canEditStall(role);
  const canDelete = canDeleteStall(role);

  const [addModalOpen, setAddModalOpen]   = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStall, setSelectedStall] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [reactivateTarget, setReactivateTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const {
    stalls, summary, total, loading, error,
    page, pageSize, filters,
    goToPage, changePageSize, updateFilters, refresh,
    createStall, updateStall, deactivateStall, reactivateStall,
    exportXLSX,
  } = useStalls();

  const handleAddSave = async (data) => {
    try {
      await createStall(data);
      setSnackbar({ open: true, message: "Stall added!", severity: "success" });
      setAddModalOpen(false);
    } catch {
      setSnackbar({ open: true, message: "Error adding stall.", severity: "error" });
    }
  };

  const handleEditSave = async (data) => {
    try {
      await updateStall(selectedStall.id, data);
      setSnackbar({ open: true, message: "Stall updated!", severity: "success" });
      setEditModalOpen(false);
      setSelectedStall(null);
    } catch {
      setSnackbar({ open: true, message: "Error updating stall.", severity: "error" });
    }
  };

  // MDU-005/BUG-76 — was a direct call with no confirmation and no
  // active-lease check. Backend now guards active-lease cases (400 with a
  // structured error), but current_lease_id is already on every row from
  // the list annotation, so we can disable the button client-side too and
  // avoid the round-trip in the common case.
  const confirmDeactivate = async () => {
    const stall = deactivateTarget;
    if (!stall) return;
    try {
      await deactivateStall(stall.id);
      setSnackbar({ open: true, message: "Stall deactivated.", severity: "info" });
    } catch (err) {
      const data = err?.response?.data;
      const message =
        data?.reason === "stall_has_active_lease"
          ? `Cannot deactivate — stall has an active lease (#${data.lease_id}${
              data.lease_end_date ? `, ends ${data.lease_end_date}` : ""
            }). Terminate the lease first.`
          : data?.detail || "Failed to deactivate.";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setDeactivateTarget(null);
    }
  };

  // MDU-006/BUG-77 — no UI path existed to undo a deactivate.
  const confirmReactivate = async () => {
    const stall = reactivateTarget;
    if (!stall) return;
    try {
      await reactivateStall(stall.id);
      setSnackbar({ open: true, message: "Stall reactivated.", severity: "success" });
    } catch (err) {
      const message = err?.response?.data?.detail || "Failed to reactivate.";
      setSnackbar({ open: true, message, severity: "error" });
    } finally {
      setReactivateTarget(null);
    }
  };

  const handleExportXLSX = async () => {
    // BUG-75/MDU-001 — this used to call exportXLSX() and discard the
    // returned blob entirely, never triggering an actual file save. The
    // "Excel export started." toast fired regardless of whether anything
    // downloaded. Now mirrors the Tenant/Lease download pattern.
    try {
      const blob = await exportXLSX();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stalls.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: "Excel export started.", severity: "info" });
    } catch {
      setSnackbar({ open: true, message: "Excel export failed.", severity: "error" });
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox p={3}>
        <StallsSummaryWidget summary={summary} total={total} loading={loading} />

        {/* Filter bar */}
        <Stack direction="row" spacing={2} mb={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="Search"
            value={filters.search || ""}
            onChange={(e) => updateFilters({ search: e.target.value })}
            size="small"
            sx={{ width: 200 }}
          />
          <TextField
            label="Status"
            select
            value={filters.status || ""}
            onChange={(e) => {
              const value = e.target.value;
              // MDU-006 — INACTIVE stalls are excluded from the queryset
              // unless include_inactive=true is also sent; status=INACTIVE
              // alone silently returns zero rows.
              updateFilters({
                status: value,
                include_inactive: value === "INACTIVE" ? "true" : undefined,
              });
            }}
            size="small"
            sx={{ minWidth: 130 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {STATUS_CHOICES.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Commerce type"
            select
            value={filters.commerce_type || ""}
            onChange={(e) => updateFilters({ commerce_type: e.target.value })}
            size="small"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All types</MenuItem>
            {COMMERCE_TYPE_CHOICES.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Lease model"
            select
            value={filters.lease_model || ""}
            onChange={(e) => updateFilters({ lease_model: e.target.value })}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All models</MenuItem>
            {LEASE_MODEL_CHOICES.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
          {canAdd && (
            <Button variant="contained" color="primary" onClick={() => setAddModalOpen(true)}>
              Add Stall
            </Button>
          )}
          <Button variant="outlined" onClick={handleExportXLSX}>Excel</Button>
        </Stack>

        {/* Page size */}
        <Stack direction="row" spacing={1} alignItems="center" mb={1} justifyContent="flex-end">
          <MDTypography variant="button">Rows per page:</MDTypography>
          <TextField
            select size="small" value={pageSize}
            onChange={(e) => changePageSize(Number(e.target.value))}
            sx={{ width: 80 }}
          >
            {pageSizeOptions.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </TextField>
        </Stack>

        {/* Table */}
        {loading ? (
          <MDBox display="flex" justifyContent="center" p={4}><CircularProgress /></MDBox>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Stall #</strong></TableCell>
                <TableCell><strong>Zone / Section</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Tenant</strong></TableCell>
                <TableCell><strong>Lease ends</strong></TableCell>
                <TableCell><strong>Outstanding</strong></TableCell>
                {(canEdit || canDelete) && <TableCell><strong>Actions</strong></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {stalls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <MDTypography variant="body2" color="text" textAlign="center">
                      No stalls found.
                    </MDTypography>
                  </TableCell>
                </TableRow>
              ) : (
                stalls.map((s) => (
                  <TableRow
                    key={s.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/stalls/${s.id}`)}
                  >
                    <TableCell sx={{ fontFamily: "monospace", textAlign: "right" }}>
                      {s.stall_code ?? "—"}
                    </TableCell>
                    <TableCell>
                      <MDTypography variant="button" fontWeight="medium">{s.stall_number}</MDTypography>
                    </TableCell>
                    <TableCell>
                      <MDTypography variant="caption">
                        {[s.zone, s.section].filter(Boolean).join(" / ") || "—"}
                      </MDTypography>
                    </TableCell>
                    <TableCell>
                      <MDTypography variant="caption">
                        {s.commerce_type?.replace(/_/g, " ") || "—"}
                      </MDTypography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={s.status}
                        color={STATUS_COLOR[s.status] || "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <MDTypography variant="caption">
                        {s.current_tenant_name || "—"}
                      </MDTypography>
                    </TableCell>
                    <TableCell>
                      <MDTypography variant="caption">
                        {s.current_lease_end_date || "—"}
                      </MDTypography>
                    </TableCell>
                    <TableCell>
                      <MDTypography
                        variant="caption"
                        color={parseFloat(s.outstanding_balance) > 0 ? "error" : "text"}
                        fontWeight={parseFloat(s.outstanding_balance) > 0 ? "medium" : "regular"}
                      >
                        {s.outstanding_balance != null ? fmt(s.outstanding_balance) : "—"}
                      </MDTypography>
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5}>
                          {canEdit && (
                            <Button
                              size="small"
                              onClick={(e) => { e.stopPropagation(); setSelectedStall(s); setEditModalOpen(true); }}
                            >
                              Edit
                            </Button>
                          )}
                          {canDelete && s.status !== "INACTIVE" && (
                            s.current_lease_id ? (
                              <Tooltip title="Cannot deactivate — stall has an active lease">
                                <span>
                                  <Button size="small" color="error" disabled>
                                    Deactivate
                                  </Button>
                                </span>
                              </Tooltip>
                            ) : (
                              <Button
                                size="small"
                                color="error"
                                onClick={(e) => { e.stopPropagation(); setDeactivateTarget(s); }}
                              >
                                Deactivate
                              </Button>
                            )
                          )}
                          {canDelete && s.status === "INACTIVE" && (
                            <Button
                              size="small"
                              color="success"
                              onClick={(e) => { e.stopPropagation(); setReactivateTarget(s); }}
                            >
                              Reactivate
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        <MDBox display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={Math.ceil(total / pageSize)}
            page={page}
            onChange={(_, v) => goToPage(v)}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </MDBox>

        {/* Modals */}
        <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="sm" fullWidth>
          <AddStallForm
            open={addModalOpen}
            onSave={handleAddSave}
            onClose={() => setAddModalOpen(false)}
            onSuccess={() => setAddModalOpen(false)}
            market={userProfile?.primary_market ?? userProfile?.primary_market_id}
          />
        </Dialog>
        <Dialog
          open={editModalOpen}
          onClose={() => { setEditModalOpen(false); setSelectedStall(null); }}
          maxWidth="sm"
          fullWidth
        >
          {selectedStall && (
            <EditStallForm
              open={editModalOpen}
              stall={selectedStall}
              onClose={() => { setEditModalOpen(false); setSelectedStall(null); }}
              onSuccess={() => { setEditModalOpen(false); setSelectedStall(null); refresh(); }}
            />
          )}
        </Dialog>

        <Dialog open={Boolean(deactivateTarget)} onClose={() => setDeactivateTarget(null)}>
          <DialogTitle>Deactivate stall?</DialogTitle>
          <DialogContent>
            <MDTypography variant="body2">
              Deactivate stall #{deactivateTarget?.stall_number}? This marks the stall
              INACTIVE. It can be reactivated later.
            </MDTypography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeactivateTarget(null)}>Cancel</Button>
            <Button color="error" onClick={confirmDeactivate}>Deactivate</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={Boolean(reactivateTarget)} onClose={() => setReactivateTarget(null)}>
          <DialogTitle>Reactivate stall?</DialogTitle>
          <DialogContent>
            <MDTypography variant="body2">
              Reactivate stall #{reactivateTarget?.stall_number}? This moves it back to
              AVAILABLE and it can be leased again.
            </MDTypography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReactivateTarget(null)}>Cancel</Button>
            <Button color="success" onClick={confirmReactivate}>Reactivate</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </MDBox>
    </DashboardLayout>
  );
}
