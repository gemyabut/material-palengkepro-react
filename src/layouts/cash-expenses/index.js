import React, { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { canApproveDeduction } from "utils/permissions";
import { listDeductions, approveDeduction, rejectDeduction } from "api/deductions";
import { getMarket } from "api/markets";
import useProfile from "layouts/profile/hooks/useProfile";

// Unit 52 Stage D — Cash Expenses list + approve page.
// Reuses the flat GET/POST /api/deductions/ surface added in Stage C rather
// than deposit-batches/components/DeductionList.js: that component is shaped
// around a single batch's nested {items, approved_total, ...} summary, while
// this page lists across markets/dates with a different column set (Date,
// Requester, Receipt thumbnail, Reason) — extending it would've meant
// branching most of its render logic, so the row rendering here is new but
// reuses the same approve/reject API calls + rejection-dialog UX pattern
// already established in DeductionApprovalQueue.js.

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const TABS = [
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function RejectDialog({ id, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const submit = async () => {
    if (!reason.trim()) {
      setErr("Required.");
      return;
    }
    setSubmitting(true);
    try {
      await rejectDeduction(id, reason.trim());
      onDone();
    } catch (e) {
      setErr(e?.response?.data?.rejection_reason?.[0] || "Failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MDBox p={1} bgcolor="#fff8e1" borderRadius={1} border="1px solid #ffcc80">
      <TextField
        size="small"
        fullWidth
        placeholder="Rejection reason (required)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={submitting}
      />
      {err && (
        <MDTypography variant="caption" color="error">
          {err}
        </MDTypography>
      )}
      <Stack direction="row" spacing={1} mt={0.5}>
        <Button
          size="small"
          variant="contained"
          color="error"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? <CircularProgress size={14} sx={{ color: "white" }} /> : "Confirm"}
        </Button>
        <Button size="small" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
      </Stack>
    </MDBox>
  );
}

export default function CashExpensesPage() {
  const role = getRole();
  const canApprove = canApproveDeduction(role);
  const { userProfile, loading: profileLoading } = useProfile();

  const [marketCode, setMarketCode] = useState("");
  const [dateFrom, setDateFrom] = useState(daysAgoStr(30));
  const [dateTo, setDateTo] = useState(todayStr());
  const [tab, setTab] = useState("PENDING_APPROVAL");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [actionErr, setActionErr] = useState(null);

  useEffect(() => {
    const id = userProfile?.primary_market ?? userProfile?.primary_market_id;
    if (!id) return;
    getMarket(id).then((m) => setMarketCode(m.code || "")).catch(() => {});
  }, [userProfile]);

  const doFetch = useCallback(
    async (overrides = {}) => {
      if (profileLoading || !marketCode) return;
      setLoading(true);
      setError(null);
      try {
        setItems(
          await listDeductions({
            status: overrides.status ?? tab,
            market: marketCode,
            date_from: dateFrom,
            date_to: dateTo,
          })
        );
      } catch (e) {
        setError(
          e?.response?.data?.detail || e?.response?.data?.error || "Failed to load cash expenses."
        );
      } finally {
        setLoading(false);
      }
    },
    [marketCode, dateFrom, dateTo, tab, profileLoading]
  );

  // Auto-load once the profile resolves a default market; subsequent market/
  // date edits go through the explicit Load button (same as Cash Position /
  // Daily Verification) so typing doesn't fire a request per keystroke. Tab
  // clicks are a discrete action, not free text, so they refetch immediately.
  const initialLoadRef = React.useRef(false);
  useEffect(() => {
    if (marketCode && !initialLoadRef.current) {
      initialLoadRef.current = true;
      doFetch();
    }
  }, [marketCode, doFetch]);

  const handleTabChange = (event, newTab) => {
    setTab(newTab);
    doFetch({ status: newTab });
  };

  const act = async (fn, id) => {
    setBusy(id);
    setActionErr(null);
    try {
      await fn(id);
      setItems((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setActionErr(e?.response?.data?.detail || "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDTypography variant="h4" fontWeight="bold" mb={3}>
          Cash Expenses
        </MDTypography>

        {/* Filter bar */}
        <MDBox display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={2}>
          <TextField
            label="Market Code"
            value={marketCode}
            onChange={(e) => setMarketCode(e.target.value.toUpperCase())}
            size="small"
            sx={{ width: 160 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") doFetch();
            }}
          />
          <TextField
            label="Date From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180 }}
          />
          <TextField
            label="Date To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180 }}
          />
          <Button variant="contained" color="info" onClick={() => doFetch()} disabled={loading}>
            {loading ? <CircularProgress size={16} color="inherit" /> : "Load"}
          </Button>
        </MDBox>

        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
          {TABS.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} />
          ))}
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {actionErr && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionErr(null)}>
            {actionErr}
          </Alert>
        )}

        {loading && (
          <MDBox display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </MDBox>
        )}

        {!loading && items.length === 0 && !error && (
          <MDTypography variant="body2" color="secondary">
            No cash expenses in this range.
          </MDTypography>
        )}

        {!loading && items.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                {["Date", "Requester", "Recipient", "Category", "Amount", "Receipt", "Reason", ""].map(
                  (h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      {h}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((d) => (
                <React.Fragment key={d.id}>
                  <TableRow sx={{ verticalAlign: "top" }}>
                    <TableCell sx={{ fontSize: "0.8rem" }}>{d.date}</TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>{d.created_by_username}</TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>
                      {d.recipient_name}
                      <MDTypography variant="caption" color="secondary" display="block">
                        {d.description}
                      </MDTypography>
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem" }}>
                      {d.expense_category_name || "—"}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }} align="right">
                      {peso(d.amount)}
                    </TableCell>
                    <TableCell>
                      {d.receipt_image_url ? (
                        <a href={d.receipt_image_url} target="_blank" rel="noreferrer">
                          <img
                            src={d.receipt_image_url}
                            alt="Receipt"
                            style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4 }}
                          />
                        </a>
                      ) : (
                        <MDTypography variant="caption" color="secondary">
                          —
                        </MDTypography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.75rem", maxWidth: 220 }}>
                      {d.reason || "—"}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {busy === d.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        canApprove &&
                        d.status === "PENDING_APPROVAL" && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => act(approveDeduction, d.id)}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  setRejectingId(rejectingId === d.id ? null : d.id)
                                }
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                  {rejectingId === d.id && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ pt: 0, pb: 1 }}>
                        <RejectDialog
                          id={d.id}
                          onClose={() => setRejectingId(null)}
                          onDone={() => {
                            setRejectingId(null);
                            setItems((prev) => prev.filter((x) => x.id !== d.id));
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </MDBox>
    </DashboardLayout>
  );
}
