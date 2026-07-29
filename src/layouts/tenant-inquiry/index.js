import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Card,
  CardContent,
  Grid,
  Stack,
  TextField,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import { canUseInquiry } from "utils/permissions";
import { searchTenants, getTenantInquiry } from "layouts/reports/api/reports";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch (e) {
    return "";
  }
}

const peso = (v) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function TenantInquiry() {
  const role = getRole();
  const allowed = canUseInquiry(role);
  const location = useLocation();

  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-open tenant if ?tenant_id= is present in URL (e.g. drill-down from Aging Dashboard).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tid = params.get("tenant_id");
    if (tid && /^\d+$/.test(tid)) {
      openTenant(Number(tid));
    }
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSearch = async () => {
    setError(null);
    setDetail(null);
    if (!q.trim()) return;
    setLoading(true);
    try {
      const d = await searchTenants(q.trim());
      setResults(d.results || []);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const openTenant = async (id) => {
    setError(null);
    setLoading(true);
    try {
      setDetail(await getTenantInquiry(id));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to load tenant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDTypography variant="h4" mb={1}>
          Tenant Inquiry
        </MDTypography>
        {!allowed ? (
          <Alert severity="warning">You don&apos;t have access to tenant inquiry.</Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Name / stall / receipt #"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && doSearch()}
                    />
                    <Button variant="contained" onClick={doSearch}>
                      Search
                    </Button>
                  </Stack>
                  {loading && <LinearProgress color="info" sx={{ mt: 2 }} />}
                  <List dense>
                    {results.map((r) => (
                      <ListItemButton key={r.tenant_id} onClick={() => openTenant(r.tenant_id)}>
                        <ListItemText
                          primary={r.full_name}
                          secondary={[r.business_name, r.mobile_phone].filter(Boolean).join(" · ")}
                        />
                      </ListItemButton>
                    ))}
                    {!loading && q && results.length === 0 && (
                      <MDTypography variant="caption" color="text">
                        No matches.
                      </MDTypography>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {String(error)}
                </Alert>
              )}
              {detail && (
                <Card>
                  <CardContent>
                    <MDTypography variant="h5">{detail.tenant.full_name}</MDTypography>
                    <MDTypography variant="button" color="text" display="block" mb={1}>
                      {[
                        detail.tenant.business_name,
                        detail.tenant.mobile_phone,
                        detail.tenant.email_address,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </MDTypography>
                    <Chip size="small" label={detail.tenant.status} sx={{ mb: 2 }} />

                    {/* Balance — finance roles only */}
                    {detail.can_see_balance && detail.balance ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Outstanding balance: <strong>{peso(detail.balance.outstanding)}</strong>
                      </Alert>
                    ) : (
                      !detail.can_see_balance && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Balance / SOA hidden for your role.
                        </Alert>
                      )
                    )}

                    <MDTypography variant="h6" mb={1}>
                      Leases
                    </MDTypography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Stall</TableCell>
                          <TableCell>Market</TableCell>
                          <TableCell>Start</TableCell>
                          <TableCell>End</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(detail.leases || []).map((l) => (
                          <TableRow key={l.lease_id}>
                            <TableCell>{l.stall}</TableCell>
                            <TableCell>{l.market}</TableCell>
                            <TableCell>{l.start_date}</TableCell>
                            <TableCell>{l.end_date}</TableCell>
                            <TableCell>{l.status}</TableCell>
                            <TableCell align="right">{peso(l.lease_amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {detail.can_see_balance && detail.statements?.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <MDTypography variant="h6" mb={1}>
                          Recent Statements
                        </MDTypography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Period</TableCell>
                              <TableCell align="right">Closing balance</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {detail.statements.map((s) => (
                              <TableRow key={s.id}>
                                <TableCell>{`${s.period_start} → ${s.period_end}`}</TableCell>
                                <TableCell align="right">{peso(s.closing_balance)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
