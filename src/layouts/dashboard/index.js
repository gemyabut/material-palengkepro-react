/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Navigate, useNavigate } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { getCashPosition } from "api/cashPosition";
import { getMarket } from "api/markets";
import useProfile from "layouts/profile/hooks/useProfile";
import APPlaceholder from "./APPlaceholder";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const peso = (v) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

// Task #106 — cash-position summary cards. Mirrors cash-position/index.js's
// getAccountTypes() bucket naming (destination_type-dependent pending/settled
// keys) so bucket sums stay consistent with that page.
function bucketTotal(accounts) {
  return (accounts || []).reduce((sum, a) => sum + Number(a.balance || 0), 0);
}

function pendingKey(destinationType) {
  return destinationType === "LGU_TREASURY" ? "LGU_TREASURY_PENDING" : "BANK_PENDING";
}

// Wraps ComplexStatisticsCard (no onClick support of its own) with
// click-through to the full Cash Position page.
function ClickableStatCard({ onClick, ...cardProps }) {
  return (
    <MDBox onClick={onClick} sx={{ cursor: "pointer" }}>
      <ComplexStatisticsCard {...cardProps} />
    </MDBox>
  );
}
ClickableStatCard.propTypes = { onClick: PropTypes.func.isRequired };

// Arrears aging buckets — shown to admin & executive (aggregate ₱, no transaction rows).
function AgingCard({ arrears }) {
  const buckets = arrears?.buckets || {};
  const order = ["0-30", "31-60", "61-90", "90+"];
  const total = Number(arrears?.total_outstanding ?? 0) || 1;
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Arrears Aging {arrears?.as_of ? `(as of ${arrears.as_of})` : ""}
        </MDTypography>
        {order.map((k) => {
          const val = Number(buckets[k] ?? 0);
          const pct = (val / total) * 100;
          return (
            <MDBox key={k} mb={1}>
              <MDBox display="flex" justifyContent="space-between">
                <MDTypography variant="caption" fontWeight="bold">
                  {k} days
                </MDTypography>
                <MDTypography variant="caption">{peso(val)}</MDTypography>
              </MDBox>
              <LinearProgress
                variant="determinate"
                value={Math.min(pct, 100)}
                color={k === "90+" ? "error" : "warning"}
              />
            </MDBox>
          );
        })}
      </CardContent>
    </Card>
  );
}
AgingCard.propTypes = { arrears: PropTypes.object }; // eslint-disable-line react/forbid-prop-types
AgingCard.defaultProps = { arrears: null };

// Stall occupancy grouped by section.
function SectionOccupancyCard({ sections }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Occupancy by Section
        </MDTypography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Section</TableCell>
              <TableCell align="right">Occupied / Total</TableCell>
              <TableCell align="right">%</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(sections || []).map((s) => (
              <TableRow key={s.section}>
                <TableCell>{s.section}</TableCell>
                <TableCell align="right">{`${s.occupied} / ${s.total}`}</TableCell>
                <TableCell align="right">{s.occupancy_pct}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
SectionOccupancyCard.propTypes = { sections: PropTypes.array }; // eslint-disable-line react/forbid-prop-types
SectionOccupancyCard.defaultProps = { sections: [] };

// Per-collector collections — operational detail (admin/manager only, NOT executive).
function CollectionsByCollectorCard({ rows }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          Collections by Collector
        </MDTypography>
        {rows && rows.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Collector</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Txns</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.collector_id}>
                  <TableCell>{r.collector}</TableCell>
                  <TableCell align="right">{peso(r.total)}</TableCell>
                  <TableCell align="right">{r.txn_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <MDTypography variant="caption" color="text">
            No collections in the selected period.
          </MDTypography>
        )}
      </CardContent>
    </Card>
  );
}
CollectionsByCollectorCard.propTypes = { rows: PropTypes.array }; // eslint-disable-line react/forbid-prop-types
CollectionsByCollectorCard.defaultProps = { rows: [] };

// JWT helper for role
function getRoleFromToken() {
  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  if (!token) return "guest";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || "guest";
  } catch (e) {
    return "guest";
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);

  // 1. Auth check (do NOT early-return before hooks — that breaks the Rules of Hooks)
  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  const rawRole = getRoleFromToken();
  // Market Administrator (and the admin_staff alias) are full market admins → admin dashboard.
  // Executive is NOT promoted to admin (doc 21 §6): they get an aggregates-only branch with
  // no per-collector / per-transaction detail.
  const ADMIN_DASHBOARD_ROLES = ["market_administrator", "admin_staff"];
  const role = ADMIN_DASHBOARD_ROLES.includes(rawRole) ? "admin" : rawRole;

  // Task #106 — cash-position summary cards for the 4 oversight roles.
  // Confirmed ADMIN_DASHBOARD_ROLES does NOT include finance_head today (it
  // falls through to the "Unknown Role" branch below), so finance gets its
  // own explicit branch here rather than merging into "admin".
  const CASH_CARD_ROLES = ["admin", "market_manager", "executive", "finance_head"];
  const { userProfile } = useProfile();
  const [marketCode, setMarketCode] = useState("");
  const [cashPosition, setCashPosition] = useState(null);

  useEffect(() => {
    const id = userProfile?.primary_market ?? userProfile?.primary_market_id;
    if (!id) return;
    getMarket(id).then((m) => setMarketCode(m.code || "")).catch(() => {});
  }, [userProfile]);

  useEffect(() => {
    if (!marketCode || !CASH_CARD_ROLES.includes(role)) return;
    getCashPosition(marketCode).then(setCashPosition).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketCode, role]);

  // 2. Data fetch
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/dashboard/admin-market/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("access_token");
          sessionStorage.removeItem("access_token");
          window.location.reload();
          return;
        }
        if (res.status === 403) {
          // Authenticated but not authorized for admin-market view (e.g. collector role).
          // Do NOT force logout — 403 means the token is valid, just insufficient permissions.
          throw new Error("You do not have permission to view this dashboard.");
        }
        if (!res.ok) throw new Error("Could not load dashboard data.");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Could not load dashboard data.");
        setLoading(false);
      });
    // eslint-disable-next-line
  }, [refresh]);

  const handleRefresh = () => setRefresh((r) => !r);

  // Now that all hooks have run, it is safe to redirect unauthenticated users.
  if (!token) {
    return <Navigate to="/authentication/sign-in" replace />;
  }

  // A/P placeholder — backend signals Tier 2 upsell (D16 / BUG #20)
  if (!loading && !error && stats.placeholder === true) {
    return <APPlaceholder data={stats} />;
  }

  // Derived cash-position bucket totals (Task #106) — computed once here so
  // both role branches below can reuse them.
  const destinationType = cashPosition?.market?.destination_type ?? "BANK";
  const pocketTotal = bucketTotal(cashPosition?.COLLECTOR_POCKET);
  const pendingTotal = bucketTotal(cashPosition?.[pendingKey(destinationType)]);
  const cashGrandTotal = cashPosition?.totals?.grand_total ?? 0;
  const cashInTransit = pocketTotal + pendingTotal;
  const goToCashPosition = () => navigate("/cash-position");

  // 3. Normal role-based dashboard UI
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
        <Grid item>
          <Button onClick={handleRefresh} variant="outlined" startIcon={<Icon>refresh</Icon>}>
            Refresh
          </Button>
        </Grid>
      </Grid>
      {loading ? (
        <Grid container justifyContent="center" alignItems="center" style={{ minHeight: 200 }}>
          <CircularProgress />
        </Grid>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Admin/Market Manager/Finance Head — Task #106 update: finance_head
              gets the identical cash-position card layout, not a separate widget */}
          {(role === "admin" || role === "market_manager" || role === "finance_head") && (
            <>
              {/* Task #106 — cash position summary, click-through to /cash-position */}
              <Grid item xs={12} md={6}>
                <ClickableStatCard
                  onClick={goToCashPosition}
                  color="dark"
                  icon={<Icon fontSize="large">account_balance</Icon>}
                  title="Grand Total Cash"
                  count={peso(cashGrandTotal)}
                  percentage={{ color: "dark", amount: "", label: "across all accounts" }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ClickableStatCard
                  onClick={goToCashPosition}
                  color="info"
                  icon={<Icon fontSize="large">account_balance_wallet</Icon>}
                  title="In Collector Pockets"
                  count={peso(pocketTotal)}
                  percentage={{ color: "info", amount: "", label: "not yet handed over" }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="info"
                  icon={<Icon fontSize="large">groups</Icon>}
                  title="Total Tenants"
                  count={stats.kpis?.occupancy?.total_tenants ?? 0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="success"
                  icon={<Icon fontSize="large">storefront</Icon>}
                  title="Total Stalls"
                  count={stats.kpis?.occupancy?.total_stalls ?? 0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="warning"
                  icon={<Icon fontSize="large">assignment</Icon>}
                  title="Active Leases"
                  count={stats.kpis?.occupancy?.active_leases ?? 0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="primary"
                  icon={<Icon fontSize="large">payments</Icon>}
                  title="Total Payments"
                  count={`₱${Number(
                    stats.kpis?.collections?.total_payments ?? 0
                  ).toLocaleString()}`}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="error"
                  icon={<Icon fontSize="large">account_balance_wallet</Icon>}
                  title="Outstanding Arrears"
                  count={peso(stats.kpis?.arrears?.total_outstanding)}
                  percentage={{ color: "error", amount: "", label: "total receivable" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="warning"
                  icon={<Icon fontSize="large">person_off</Icon>}
                  title="Debtors"
                  count={stats.kpis?.arrears?.debtor_count ?? 0}
                  percentage={{ color: "warning", amount: "", label: "tenants with balance" }}
                />
              </Grid>

              {/* Breakdowns */}
              <Grid item xs={12} md={4}>
                <AgingCard arrears={stats.kpis?.arrears} />
              </Grid>
              <Grid item xs={12} md={4}>
                <SectionOccupancyCard sections={stats.kpis?.occupancy_by_section} />
              </Grid>
              <Grid item xs={12} md={4}>
                <CollectionsByCollectorCard rows={stats.kpis?.collections_by_collector} />
              </Grid>
            </>
          )}

          {/* Executive — aggregates only (doc 21 §6): KPI cards + aging, NO collector/txn detail */}
          {role === "executive" && (
            <>
              {/* Task #106 — cash position summary, click-through to /cash-position */}
              <Grid item xs={12} md={6}>
                <ClickableStatCard
                  onClick={goToCashPosition}
                  color="dark"
                  icon={<Icon fontSize="large">account_balance</Icon>}
                  title="Grand Total Cash"
                  count={peso(cashGrandTotal)}
                  percentage={{ color: "dark", amount: "", label: "across all accounts" }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ClickableStatCard
                  onClick={goToCashPosition}
                  color="warning"
                  icon={<Icon fontSize="large">sync_alt</Icon>}
                  title="Cash In Transit"
                  count={peso(cashInTransit)}
                  percentage={{ color: "warning", amount: "", label: "pockets + pending deposits" }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="info"
                  icon={<Icon fontSize="large">store</Icon>}
                  title="Occupancy"
                  count={`${stats.kpis?.occupancy?.occupancy_pct ?? 0}%`}
                  percentage={{
                    color: "info",
                    amount: "",
                    label: `${stats.kpis?.occupancy?.active_leases ?? 0} active leases`,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="success"
                  icon={<Icon fontSize="large">groups</Icon>}
                  title="Total Tenants"
                  count={stats.kpis?.occupancy?.total_tenants ?? 0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="error"
                  icon={<Icon fontSize="large">account_balance_wallet</Icon>}
                  title="Outstanding Arrears"
                  count={peso(stats.kpis?.arrears?.total_outstanding)}
                  percentage={{ color: "error", amount: "", label: "total receivable" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ComplexStatisticsCard
                  color="warning"
                  icon={<Icon fontSize="large">person_off</Icon>}
                  title="Debtors"
                  count={stats.kpis?.arrears?.debtor_count ?? 0}
                  percentage={{ color: "warning", amount: "", label: "tenants with balance" }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <AgingCard arrears={stats.kpis?.arrears} />
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionOccupancyCard sections={stats.kpis?.occupancy_by_section} />
              </Grid>
            </>
          )}

          {/* Collector */}
          {role === "collector" && (
            <Grid item xs={12} sm={6} md={4}>
              <ComplexStatisticsCard
                color="primary"
                icon={<Icon fontSize="large">payments</Icon>}
                title="Today's Collections"
                count={`₱${stats.todays_collections?.toLocaleString() ?? "0"}`}
                percentage={{ color: "success", amount: "", label: "" }}
              />
            </Grid>
          )}

          {/* Cashier — treasury operations: collections received + occupancy snapshot (BUG #23) */}
          {role === "cashier" && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <ComplexStatisticsCard
                  color="primary"
                  icon={<Icon fontSize="large">payments</Icon>}
                  title="Collections (MTD)"
                  count={`₱${Number(stats.kpis?.collections?.total_payments ?? 0).toLocaleString()}`}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <ComplexStatisticsCard
                  color="success"
                  icon={<Icon fontSize="large">storefront</Icon>}
                  title="Occupied Stalls"
                  count={stats.kpis?.occupancy?.active_leases ?? 0}
                  percentage={{ color: "success", amount: "", label: `of ${stats.kpis?.occupancy?.total_stalls ?? 0}` }}
                />
              </Grid>
            </>
          )}

          {/* Tenant */}
          {role === "tenant" && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <ComplexStatisticsCard
                  color="info"
                  icon={<Icon fontSize="large">storefront</Icon>}
                  title="My Stalls"
                  count={stats.my_stalls ?? 0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <ComplexStatisticsCard
                  color="success"
                  icon={<Icon fontSize="large">assignment</Icon>}
                  title="My Leases"
                  count={stats.my_leases ?? 0}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <ComplexStatisticsCard
                  color="primary"
                  icon={<Icon fontSize="large">payments</Icon>}
                  title="My Payments"
                  count={`₱${stats.my_payments?.toLocaleString() ?? "0"}`}
                  percentage={{ color: "success", amount: "", label: "" }}
                />
              </Grid>
            </>
          )}

          {/* Guest */}
          {role === "guest" && (
            <Grid item xs={12} md={6}>
              <ComplexStatisticsCard
                color="info"
                icon={<Icon fontSize="large">person</Icon>}
                title="Welcome, Guest!"
                count=""
                percentage={{
                  color: "info",
                  amount: "",
                  label: "Please sign up or log in to access your dashboard.",
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/authentication/sign-up")}
                sx={{ mt: 2 }}
              >
                Register Now
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate("/authentication/sign-in")}
                sx={{ mt: 2, ml: 2 }}
              >
                Sign In
              </Button>
            </Grid>
          )}

          {/* Default for unknown roles */}
          {!role ||
            (!["admin", "executive", "market_manager", "finance_head", "collector", "cashier", "tenant", "guest"].includes(
              role
            ) && (
              <Grid item xs={12}>
                <ComplexStatisticsCard
                  color="warning"
                  icon={<Icon fontSize="large">error</Icon>}
                  title="Unknown Role"
                  count=""
                  percentage={{
                    color: "warning",
                    amount: "",
                    label: "Please contact admin for access.",
                  }}
                />
              </Grid>
            ))}
        </Grid>
      )}
    </DashboardLayout>
  );
}
