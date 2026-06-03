import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import {
  Card,
  CardContent,
  Tabs,
  Tab,
  Stack,
  TextField,
  Button,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { canViewReports } from "utils/permissions";
import {
  getAging,
  getCollections,
  getDelinquent,
  getOccupancy,
  getExpiration,
  generateSOA,
  downloadSOA,
} from "./api/reports";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch (e) {
    return "";
  }
}

const peso = (v) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const TABS = ["SOA", "Aging", "Collections", "Occupancy", "Lease Expiration", "Delinquent"];

function SimpleTable({ columns, rows }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {columns.map((c) => (
            <TableCell key={c.key} align={c.align || "left"}>
              {c.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={i}>
            {columns.map((c) => (
              <TableCell key={c.key} align={c.align || "left"}>
                {c.render ? c.render(r) : r[c.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function Reports() {
  const role = getRole();
  const allowed = canViewReports(role);

  const [tab, setTab] = useState(0);
  const [market, setMarket] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // SOA form
  const [soaTenant, setSoaTenant] = useState("");
  const [soaStart, setSoaStart] = useState("2026-02-01");
  const [soaEnd, setSoaEnd] = useState("2026-06-02");
  const [soa, setSoa] = useState(null);

  const load = async (idx) => {
    setError(null);
    setData(null);
    if (idx === 0) return; // SOA tab uses its own form
    setLoading(true);
    try {
      const m = market.trim() || undefined;
      const fetchers = [
        null,
        () => getAging(m),
        () => getCollections(m, "mtd"),
        () => getOccupancy(m),
        () => getExpiration(m, 365),
        () => getDelinquent(m),
      ];
      setData(await fetchers[idx]());
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  const onTab = (_e, v) => {
    setTab(v);
    load(v);
  };

  const runSoa = async () => {
    setError(null);
    setSoa(null);
    if (!soaTenant.trim()) {
      setError("Enter a tenant id.");
      return;
    }
    setLoading(true);
    try {
      setSoa(await generateSOA(soaTenant.trim(), soaStart, soaEnd));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to generate SOA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDTypography variant="h4" mb={1}>
          Reports
        </MDTypography>
        {!allowed ? (
          <Alert severity="warning">You don&apos;t have access to reports.</Alert>
        ) : (
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <Tabs value={tab} onChange={onTab} variant="scrollable" scrollButtons="auto">
                  {TABS.map((t) => (
                    <Tab key={t} label={t} />
                  ))}
                </Tabs>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                <TextField
                  size="small"
                  label="Market code (blank = all)"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  sx={{ width: 220 }}
                />
                {tab !== 0 && (
                  <Button variant="outlined" onClick={() => load(tab)}>
                    Refresh
                  </Button>
                )}
              </Stack>

              {loading && <LinearProgress sx={{ mb: 2 }} />}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {String(error)}
                </Alert>
              )}

              {/* SOA */}
              {tab === 0 && (
                <MDBox>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
                    <TextField
                      size="small"
                      label="Tenant ID"
                      value={soaTenant}
                      onChange={(e) => setSoaTenant(e.target.value)}
                    />
                    <TextField
                      size="small"
                      label="Period start"
                      value={soaStart}
                      onChange={(e) => setSoaStart(e.target.value)}
                    />
                    <TextField
                      size="small"
                      label="Period end"
                      value={soaEnd}
                      onChange={(e) => setSoaEnd(e.target.value)}
                    />
                    <Button variant="contained" color="success" onClick={runSoa}>
                      Generate
                    </Button>
                  </Stack>
                  <MDTypography variant="caption" color="text">
                    SOA excludes the annual rights fee.
                  </MDTypography>
                  {soa && (
                    <MDBox mt={2}>
                      <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                        <MDTypography variant="h6">
                          {soa.tenant_name} — {soa.period_label}
                        </MDTypography>
                        <Button variant="outlined" onClick={() => downloadSOA(soa.id)}>
                          Download CSV
                        </Button>
                      </Stack>
                      <MDTypography variant="button" color="text" display="block" mb={1}>
                        Opening {peso(soa.opening_balance)} · Closing {peso(soa.closing_balance)}
                      </MDTypography>
                      <SimpleTable
                        columns={[
                          { key: "entry_date", label: "Date" },
                          { key: "description", label: "Description" },
                          { key: "amount", label: "Amount", align: "right", render: (r) => peso(r.amount) },
                        ]}
                        rows={soa.lines || []}
                      />
                    </MDBox>
                  )}
                </MDBox>
              )}

              {/* Aging */}
              {tab === 1 && data && (
                <MDBox>
                  <MDTypography variant="h6" mb={1}>
                    Outstanding {peso(data.total_outstanding)} · {data.debtor_count} debtors (as of{" "}
                    {data.as_of})
                  </MDTypography>
                  <SimpleTable
                    columns={[
                      { key: "bucket", label: "Bucket" },
                      { key: "amount", label: "Amount", align: "right" },
                    ]}
                    rows={Object.entries(data.buckets || {}).map(([bucket, amount]) => ({
                      bucket,
                      amount: peso(amount),
                    }))}
                  />
                </MDBox>
              )}

              {/* Collections */}
              {tab === 2 && data && (
                <SimpleTable
                  columns={[
                    { key: "collector", label: "Collector" },
                    { key: "total", label: "Total", align: "right", render: (r) => peso(r.total) },
                    { key: "txn_count", label: "Txns", align: "right" },
                  ]}
                  rows={data.by_collector || []}
                />
              )}

              {/* Occupancy */}
              {tab === 3 && data && (
                <SimpleTable
                  columns={[
                    { key: "section", label: "Section" },
                    { key: "occupied", label: "Occupied", align: "right" },
                    { key: "total", label: "Total", align: "right" },
                    { key: "occupancy_pct", label: "%", align: "right" },
                  ]}
                  rows={data.by_section || []}
                />
              )}

              {/* Lease Expiration */}
              {tab === 4 && data && (
                <SimpleTable
                  columns={[
                    { key: "tenant", label: "Tenant" },
                    { key: "stall", label: "Stall" },
                    { key: "end_date", label: "End date" },
                    { key: "days_left", label: "Days left", align: "right" },
                  ]}
                  rows={data.results || []}
                />
              )}

              {/* Delinquent */}
              {tab === 5 && data && (
                <SimpleTable
                  columns={[
                    { key: "tenant", label: "Tenant" },
                    { key: "balance", label: "Balance", align: "right", render: (r) => peso(r.balance) },
                  ]}
                  rows={data.results || []}
                />
              )}
            </CardContent>
          </Card>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
