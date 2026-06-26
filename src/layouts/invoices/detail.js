import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInvoiceDetail } from "./hooks/useInvoiceDetail";
import useProfile from "../profile/hooks/useProfile";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { Button, Chip, Divider, Grid, Paper, Snackbar, Tooltip } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import InvoiceLinesTable from "./components/InvoiceLinesTable";
import PaymentApplicationsTable from "./components/PaymentApplicationsTable";
import { canViewInvoices } from "utils/permissions";

const STATUS_COLOR = {
  OPEN: "info",
  PARTIAL: "warning",
  PAID: "success",
  VOID: "default",
};

function LabelValue({ label, value, valueColor }) {
  return (
    <MDBox mb={1}>
      <MDTypography variant="caption" color="secondary" fontWeight="medium">
        {label}
      </MDTypography>
      <MDTypography variant="body2" color={valueColor || "text"}>
        {value ?? "—"}
      </MDTypography>
    </MDBox>
  );
}

function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, loading: profileLoading } = useProfile();
  const { invoice, loading, error, notFound } = useInvoiceDetail(id);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  // All hooks above any early return
  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: "Failed to load invoice. Please try again." });
    }
  }, [error]);

  if (profileLoading || !userProfile || !userProfile.role) {
    return (
      <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </MDBox>
    );
  }

  if (!canViewInvoices(userProfile.role)) {
    return (
      <MDBox p={4}>
        <MDTypography variant="h6" color="error">
          You do not have permission to view invoices.
        </MDTypography>
      </MDBox>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar userProfile={userProfile} />
        <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </MDBox>
      </DashboardLayout>
    );
  }

  if (notFound) {
    return (
      <DashboardLayout>
        <DashboardNavbar userProfile={userProfile} />
        <MDBox p={4} textAlign="center">
          <MDTypography variant="h5" color="error" mb={2}>
            Invoice not found.
          </MDTypography>
          <Button variant="outlined" onClick={() => navigate("/invoices")}>
            Back to Invoices
          </Button>
        </MDBox>
      </DashboardLayout>
    );
  }

  if (!invoice) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isSoftClose =
    invoice.period_end < today && ["OPEN", "PARTIAL"].includes(invoice.status);
  const balance = parseFloat(invoice.balance || 0);

  return (
    <DashboardLayout>
      <DashboardNavbar userProfile={userProfile} />
      <MDBox sx={{ p: 2 }}>

        {/* ── Header ── */}
        <MDBox display="flex" alignItems="center" gap={2} mb={2}>
          <MDTypography variant="h4">
            {invoice.invoice_number || `Invoice #${invoice.id}`}
          </MDTypography>
          <Chip
            label={invoice.status}
            color={STATUS_COLOR[invoice.status] || "default"}
            size="medium"
          />
        </MDBox>

        {isSoftClose && (
          <MDBox mb={2} px={2} py={1} sx={{ bgcolor: "grey.100", borderRadius: 1 }}>
            <MDTypography variant="caption" color="secondary">
              This invoice&apos;s period has closed but its status is {invoice.status}.
              Late-posted lines may still be applied.
            </MDTypography>
          </MDBox>
        )}

        {/* ── Two-column: Invoice meta + Totals ── */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={7}>
            <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
              <MDTypography variant="h6" mb={1}>Invoice Details</MDTypography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <LabelValue label="Tenant" value={invoice.tenant_full_name} />
                </Grid>
                <Grid item xs={6}>
                  <LabelValue label="Business name" value={invoice.tenant_business_name} />
                </Grid>
                <Grid item xs={6}>
                  <LabelValue label="Stall" value={invoice.stall_number} />
                </Grid>
                <Grid item xs={6}>
                  <LabelValue label="Market" value={invoice.market_code} />
                </Grid>
                <Grid item xs={6}>
                  <LabelValue label="Period" value={`${invoice.period_start} – ${invoice.period_end}`} />
                </Grid>
                <Grid item xs={6}>
                  <LabelValue label="Issue date" value={invoice.issue_date} />
                </Grid>
                <Grid item xs={6}>
                  <LabelValue label="Due date" value={invoice.due_date} />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 2, height: "100%" }}>
              <MDTypography variant="h6" mb={1}>Totals</MDTypography>
              <LabelValue label="Subtotal"  value={`₱${invoice.subtotal}`} />
              <LabelValue label="Discount"  value={`₱${invoice.discount}`} />
              <Divider sx={{ my: 0.5 }} />
              <LabelValue label="Total"     value={`₱${invoice.total}`} />
              <LabelValue label="Paid"      value={`₱${invoice.paid}`} />
              <Divider sx={{ my: 0.5 }} />
              <LabelValue
                label="Balance"
                value={`₱${invoice.balance}`}
                valueColor={balance > 0 ? "error" : "success"}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* ── Invoice Lines ── */}
        <MDTypography variant="h6" mb={1}>Invoice Lines</MDTypography>
        <MDBox mb={3}>
          <InvoiceLinesTable lines={invoice.lines || []} />
        </MDBox>

        {/* ── Payment Applications ── */}
        <MDTypography variant="h6" mb={1}>Payment Applications</MDTypography>
        <MDBox mb={3}>
          <PaymentApplicationsTable applications={invoice.applications || []} />
        </MDBox>

        {/* ── Actions ── */}
        <MDBox display="flex" gap={2} mt={1}>
          <Tooltip title="Statement of Account page — available in Unit 3">
            <span>
              <Button variant="outlined" disabled>
                Print SOA
              </Button>
            </span>
          </Tooltip>
          <Button variant="contained" onClick={() => navigate("/invoices")}>
            Back to Invoices
          </Button>
        </MDBox>
      </MDBox>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </DashboardLayout>
  );
}

export default InvoiceDetailPage;
