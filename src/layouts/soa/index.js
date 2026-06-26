import React, { useState } from "react";
import { jwtDecode } from "jwt-decode";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Icon from "@mui/material/Icon";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { canViewSoa } from "utils/permissions";
import { generateSOA, downloadSOAcsv } from "api/soa";
import SoaTenantPicker from "./components/SoaTenantPicker";
import SoaTable from "./components/SoaTable";
import SoaAgingBlock from "./components/SoaAgingBlock";
import "./soa.css";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

function getUsername() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    const decoded = jwtDecode(t);
    return decoded.username || decoded.email || "Operator";
  } catch {
    return "Operator";
  }
}

// Today as YYYY-MM-DD for default period end
const todayStr = new Date().toISOString().slice(0, 10);
// First day of current month as default period start
const firstOfMonth = todayStr.slice(0, 7) + "-01";

export default function SoaPage() {
  const role = getRole();

  const [tenant, setTenant] = useState(null); // { tenant_id, full_name }
  const [periodStart, setPeriodStart] = useState(firstOfMonth);
  const [periodEnd, setPeriodEnd] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [soa, setSoa] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const canGenerate = !!tenant && !!periodStart && !!periodEnd && periodEnd >= periodStart;

  async function handleGenerate() {
    setError(null);
    setSoa(null);
    setLoading(true);
    try {
      const result = await generateSOA(tenant.tenant_id, periodStart, periodEnd);
      setSoa(result);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to generate SOA.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadCsv() {
    if (!soa?.id) return;
    setCsvLoading(true);
    try {
      await downloadSOAcsv(soa.id);
    } catch (e) {
      setError("CSV download failed.");
    } finally {
      setCsvLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <DashboardLayout>
      <DashboardNavbar className="no-print" />
      <MDBox py={3}>
        <MDTypography variant="h4" mb={2}>
          Statement of Account
        </MDTypography>

        {!canViewSoa(role) ? (
          <Alert severity="warning">You don&apos;t have access to SOA reports.</Alert>
        ) : (
          <>
            {/* Controls — hidden on print */}
            <Box className="no-print" mb={3}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "flex-start" }}
                flexWrap="wrap"
              >
                <SoaTenantPicker value={tenant} onChange={setTenant} />
                <TextField
                  size="small"
                  label="Period start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 180 }}
                />
                <TextField
                  size="small"
                  label="Period end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 180 }}
                />
                <Button
                  variant="contained"
                  color="success"
                  disabled={!canGenerate || loading}
                  onClick={handleGenerate}
                  startIcon={<Icon>description</Icon>}
                >
                  Generate
                </Button>
              </Stack>
              {periodStart && periodEnd && periodEnd < periodStart && (
                <Alert severity="error" sx={{ mt: 1, maxWidth: 480 }}>
                  Period end must be on or after period start.
                </Alert>
              )}
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} className="no-print">
                {String(error)}
              </Alert>
            )}

            {/* SOA body — appears on screen and in print */}
            {soa && (
              <Box className="soa-print-area">
                {/* Header */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  mb={1}
                >
                  <Box>
                    <MDTypography variant="h5" fontWeight="bold">
                      {soa.tenant_name}
                    </MDTypography>
                    <MDTypography variant="body2" color="secondary">
                      Period: {soa.period_start} → {soa.period_end} &nbsp;|&nbsp; As of: {soa.as_of}
                    </MDTypography>
                    {Number(soa.balance_forward) > 0 && (
                      <MDTypography variant="body2" color="warning">
                        Balance forward (prior periods): {peso(soa.balance_forward)}
                      </MDTypography>
                    )}
                  </Box>

                  {/* Action buttons — hidden on print */}
                  <Stack direction="row" spacing={1} className="no-print">
                    <Button
                      variant="outlined"
                      startIcon={<Icon>print</Icon>}
                      onClick={handlePrint}
                    >
                      Print
                    </Button>
                    <Tooltip title="Download ledger lines as CSV">
                      <span>
                        <Button
                          variant="outlined"
                          startIcon={<Icon>download</Icon>}
                          onClick={handleDownloadCsv}
                          disabled={csvLoading}
                        >
                          CSV
                        </Button>
                      </span>
                    </Tooltip>
                    <Tooltip title="Unit 4 — coming soon">
                      <span>
                        <Button variant="outlined" disabled startIcon={<Icon>picture_as_pdf</Icon>}>
                          PDF
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Divider sx={{ mb: 1 }} />

                {/* Invoice table */}
                <MDTypography variant="overline" color="text">
                  Invoices
                </MDTypography>
                <SoaTable invoices={soa.invoices} />

                {/* Aging block */}
                <SoaAgingBlock aging={soa.aging} />

                {/* Totals footer */}
                <Box
                  mt={2}
                  p={2}
                  sx={{ bgcolor: "grey.100", borderRadius: 1 }}
                  className="soa-page-break"
                >
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                    <Box>
                      <MDTypography variant="caption" color="secondary" display="block">
                        Total Charged
                      </MDTypography>
                      <MDTypography variant="h6">{peso(soa.totals?.charged)}</MDTypography>
                    </Box>
                    <Box>
                      <MDTypography variant="caption" color="secondary" display="block">
                        Total Paid
                      </MDTypography>
                      <MDTypography variant="h6">{peso(soa.totals?.paid)}</MDTypography>
                    </Box>
                    <Box>
                      <MDTypography variant="caption" color="secondary" display="block">
                        Ending Balance
                      </MDTypography>
                      <MDTypography
                        variant="h6"
                        color={Number(soa.totals?.ending_balance) > 0 ? "error" : "success"}
                        fontWeight="bold"
                      >
                        {peso(soa.totals?.ending_balance)}
                      </MDTypography>
                    </Box>
                  </Stack>
                </Box>

                {/* Print-only footer */}
                <Box mt={2} sx={{ display: "none", "@media print": { display: "block" } }}>
                  <Divider />
                  <MDTypography variant="caption" color="secondary">
                    Generated by {getUsername()} &nbsp;|&nbsp; PalengkeProPH &nbsp;|&nbsp; {soa.as_of}
                  </MDTypography>
                </Box>
              </Box>
            )}
          </>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
