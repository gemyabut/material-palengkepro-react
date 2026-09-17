// src/layouts/octal-console/plans.js
// Subscription Plans: edit PriceBook rates per LicenseTier. Platform-admin
// only. Tier choices are a fixed enum (LicenseTier) — no Add/Delete, this
// page only edits the existing seeded rows. The Community row is critical
// (drives ECM's comped pilot billing) — never delete it.
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { useAuthProfile } from "context/AuthContext";
import { canManagePricing } from "utils/permissions";
import { listPricebook, updatePricebook } from "../subscription/api/subscription";

function tierLabel(tier) {
  if (!tier) return "—";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export default function SubscriptionPlans() {
  const { userProfile, loading: authLoading } = useAuthProfile();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    rate_per_stall_month: "", rate_per_tenant_month: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const isAllowed =
    !authLoading && (canManagePricing(userProfile?.role) || userProfile?.is_staff === true);

  const load = () => {
    setLoading(true);
    setError(null);
    listPricebook()
      .then(setRows)
      .catch((e) => setError(e?.response?.data?.detail || e.message || "Failed to load."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAllowed) {
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAllowed]);

  const openEdit = (row) => {
    setEditRow(row);
    setEditForm({
      rate_per_stall_month: row.rate_per_stall_month ?? "",
      rate_per_tenant_month: row.rate_per_tenant_month ?? "",
      notes: row.notes || "",
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editRow) return;
    setSaving(true);
    try {
      await updatePricebook(editRow.id, {
        rate_per_stall_month:
          editForm.rate_per_stall_month === "" ? null : editForm.rate_per_stall_month,
        rate_per_tenant_month:
          editForm.rate_per_tenant_month === "" ? null : editForm.rate_per_tenant_month,
        notes: editForm.notes,
      });
      setSnackbar({ open: true, message: `${tierLabel(editRow.tier)} plan updated.`, severity: "success" });
      setEditOpen(false);
      load();
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Failed to save.";
      setSnackbar({ open: true, message: String(msg), severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDBox>
            <MDTypography variant="h4">Subscription Plans</MDTypography>
            <MDTypography variant="body2" color="text">
              Community tier uses rate_per_stall_month × total stalls. Other tiers currently use
              rate_per_tenant_month × tenants (legacy). Set rate_per_stall_month on a paying tier
              to migrate it to per-stall billing.
            </MDTypography>
          </MDBox>
        </MDBox>

        {!isAllowed && !authLoading ? (
          <Alert severity="error">
            Access restricted to Octal platform administrators.
          </Alert>
        ) : authLoading || loading ? (
          <LinearProgress color="info" />
        ) : error ? (
          <Alert severity="error">{String(error)}</Alert>
        ) : (
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Tier</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Rate per stall/month</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Rate per tenant/month</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <MDTypography variant="button" fontWeight="medium">
                          {tierLabel(row.tier)}
                        </MDTypography>
                      </TableCell>
                      <TableCell align="right">
                        {row.rate_per_stall_month != null ? `₱${row.rate_per_stall_month}` : "—"}
                      </TableCell>
                      <TableCell align="right">
                        {row.rate_per_tenant_month != null ? `₱${row.rate_per_tenant_month}` : "—"}
                      </TableCell>
                      <TableCell>{row.notes || "—"}</TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" onClick={() => openEdit(row)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Edit dialog */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Edit {tierLabel(editRow?.tier)} plan</DialogTitle>
          <DialogContent>
            <MDTypography variant="caption" color="text" display="block" mb={1}>
              Community tier uses rate_per_stall_month × total stalls. Other tiers currently use
              rate_per_tenant_month × tenants (legacy). Set rate_per_stall_month on paying tiers to
              migrate them to per-stall billing.
            </MDTypography>
            <TextField
              fullWidth margin="normal" label="Tier" value={tierLabel(editRow?.tier)}
              disabled
            />
            <TextField
              fullWidth margin="normal" label="Rate per stall/month" type="number"
              value={editForm.rate_per_stall_month}
              onChange={(e) => setEditForm((f) => ({ ...f, rate_per_stall_month: e.target.value }))}
            />
            <TextField
              fullWidth margin="normal" label="Rate per tenant/month" type="number"
              value={editForm.rate_per_tenant_month}
              onChange={(e) => setEditForm((f) => ({ ...f, rate_per_tenant_month: e.target.value }))}
            />
            <TextField
              fullWidth margin="normal" label="Notes"
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button variant="contained" color="info" disabled={saving} onClick={handleSave}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </MDBox>
    </DashboardLayout>
  );
}
