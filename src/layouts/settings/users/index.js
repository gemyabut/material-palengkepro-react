import React, { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Alert, Button, Chip, CircularProgress,
  Paper, Table, TableBody, TableCell, TableHead, TableRow,
  TextField,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { canViewMarketUsers } from "utils/permissions";
import { listMarketUsers } from "api/marketUsers";
import { getMarket } from "api/markets";
import { downloadStaffRosterExport } from "api/csvImport";
import { useAuthProfile } from "context/AuthContext";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try { return (jwtDecode(t).role || "").toLowerCase(); } catch { return ""; }
}

const ROLE_LABELS = {
  executive: "Owner",
  finance_head: "Finance Mgr",
  market_administrator: "Mkt Admin",
  admin_staff: "Admin Staff",
  leasing_officer: "Leasing",
  accounts_receivable: "A/R",
  accounts_payable: "A/P",
  cashier: "Cashier",
  collector: "Collector",
};

export default function MarketUsersPage() {
  const role = getRole();
  const { userProfile } = useAuthProfile();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMarketUsers();
      setRows(Array.isArray(data) ? data : (data.results || []));
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load market users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExportRoster = async () => {
    const marketId = userProfile?.primary_market ?? userProfile?.primary_market_id;
    if (!marketId) {
      setError("Can't export roster: no primary market on your profile.");
      return;
    }
    setExporting(true);
    setError(null);
    try {
      const market = await getMarket(marketId);
      await downloadStaffRosterExport(market.code);
    } catch (e) {
      setError(e?.response?.data?.error || "Failed to export staff roster.");
    } finally {
      setExporting(false);
    }
  };

  if (!canViewMarketUsers(role)) return <Navigate to="/dashboard" replace />;

  const q = search.trim().toLowerCase();
  const visible = q
    ? rows.filter(
        (u) =>
          (u.username || "").toLowerCase().includes(q) ||
          (u.first_name || "").toLowerCase().includes(q) ||
          (u.last_name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.role || "").toLowerCase().includes(q)
      )
    : rows;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <MDBox mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h5" fontWeight="medium">
            Market Users
          </MDTypography>
          <MDBox display="flex" alignItems="center" gap={1}>
            {role === "executive" && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportRoster}
                disabled={exporting}
              >
                {exporting ? "Exporting…" : "Export Roster"}
              </Button>
            )}
            <TextField
              size="small"
              placeholder="Search name, email, role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 280 }}
            />
          </MDBox>
        </MDBox>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <MDBox display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </MDBox>
        ) : (
          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Username</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Mobile</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Market</strong></TableCell>
                  <TableCell><strong>Last Login</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <MDTypography variant="caption" color="secondary">
                        {q ? "No matching users." : "No users in your market."}
                      </MDTypography>
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>
                        <Chip
                          label={ROLE_LABELS[u.role] || u.role || "—"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{u.email || "—"}</TableCell>
                      <TableCell>{u.mobile_number || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          label={u.is_active ? "Active" : "Inactive"}
                          size="small"
                          color={u.is_active ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell>{u.market_display || "—"}</TableCell>
                      <TableCell>
                        {u.last_login
                          ? new Date(u.last_login).toLocaleDateString("en-PH")
                          : "Never"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
