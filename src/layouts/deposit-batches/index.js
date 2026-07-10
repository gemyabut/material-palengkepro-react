import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canViewBatches, canEditBatches } from "utils/permissions";
import { destinationLabel } from "utils/destinationLabels";
import { listBatches } from "api/remittanceBatches";
import BatchStatusChip from "./components/BatchStatusChip";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

const peso = (v) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const STATUS_OPTIONS = ["", "OPEN", "POSTED", "CONFIRMED", "VOID"];
const DEST_OPTIONS   = ["", "BANK", "LGU_TREASURY"];

function DestinationChip({ destinationType }) {
  if (!destinationType) return <MDTypography variant="caption" color="secondary">—</MDTypography>;
  return (
    <Chip
      size="small"
      label={destinationLabel(destinationType, "destinationName")}
      color={destinationType === "LGU_TREASURY" ? "success" : "info"}
      variant="outlined"
    />
  );
}

export default function DepositBatchListPage() {
  const role = getRole();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [destFilter,   setDestFilter]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (destFilter)   params.destination_type = destFilter;
      const res = await listBatches(params);
      setBatches(Array.isArray(res) ? res : (res?.results ?? []));
    } catch {
      setError("Failed to load deposit batches.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, destFilter]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canViewBatches(role)) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          flexWrap="wrap"
          gap={2}
        >
          <MDTypography variant="h4" fontWeight="bold">
            Deposit Batches
          </MDTypography>
          <MDBox display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>{s || "All"}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Destination</InputLabel>
              <Select value={destFilter} label="Destination" onChange={(e) => setDestFilter(e.target.value)}>
                {DEST_OPTIONS.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d ? destinationLabel(d, "destinationName") : "All"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {canEditBatches(role) && (
              <Button variant="contained" color="info" onClick={() => navigate("/deposit-batches/new")}>
                + Create New Batch
              </Button>
            )}
          </MDBox>
        </MDBox>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <MDBox display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </MDBox>
        ) : (
          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Bank / LGU Office</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Items</TableCell>
                  <TableCell>Deposit Date</TableCell>
                  <TableCell>Confirmed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <MDTypography variant="body2" color="secondary">
                        No batches found.
                      </MDTypography>
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((b) => (
                    <TableRow
                      key={b.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => navigate(`/deposit-batches/${b.id}`)}
                    >
                      <TableCell>#{b.id}</TableCell>
                      <TableCell>{b.date}</TableCell>
                      <TableCell>
                        <DestinationChip destinationType={b.destination_type} />
                      </TableCell>
                      <TableCell>
                        {b.bank_name}
                        {b.bank_account_last4 ? ` ••••${b.bank_account_last4}` : ""}
                      </TableCell>
                      <TableCell>
                        <BatchStatusChip status={b.status} />
                      </TableCell>
                      <TableCell align="right">{peso((Number(b.total_to_bank) || 0) + (Number(b.total_to_lgu) || 0))}</TableCell>
                      <TableCell align="right">{b.item_count}</TableCell>
                      <TableCell>{b.deposit_date || "—"}</TableCell>
                      <TableCell>
                        {b.confirmed_at ? new Date(b.confirmed_at).toLocaleDateString() : "—"}
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
