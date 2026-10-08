import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { canViewMarketUsers, canManageMarketUsers } from "utils/permissions";
import {
  listMarketUsers,
  getMarketUser,
  updateMarketUser,
  resetMarketUserPassword,
  deactivateMarketUser,
  reactivateMarketUser,
  checkMarketUserDeactivation,
} from "api/marketUsers";
import { getMarket } from "api/markets";
import { downloadStaffRosterExport } from "api/csvImport";
import { useAuthProfile } from "context/AuthContext";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

const ROLE_LABELS = {
  executive: "Owner",
  finance_head: "Finance Mgr",
  market_administrator: "Mkt Admin",
  admin_staff: "Admin Staff",
  leasing_officer: "Leasing",
  accounts_receivable: "A/R",
  accounts_payable: "A/P",
  accounting_staff: "Accounting",
  market_manager: "Mkt Manager",
  cashier: "Cashier",
  collector: "Collector",
};

const errText = (e, fallback) => {
  const d = e?.response?.data;
  if (!d) return fallback;
  if (typeof d === "string") return d;
  if (d.detail) return d.detail;
  if (d.error) return d.error;
  const first = Object.values(d)[0];
  return Array.isArray(first) ? first.join(" ") : String(first || fallback);
};

const fmtDate = (v) => (v ? new Date(v).toLocaleString("en-PH") : "—");

function Field({ label, children }) {
  return (
    <Grid item xs={6}>
      <MDTypography variant="caption" color="secondary" display="block">
        {label}
      </MDTypography>
      <MDTypography variant="body2">{children || "—"}</MDTypography>
    </Grid>
  );
}

// View: the details panel (Staff ID, role, market, status, password status, last login, created).
function DetailsDialog({ userId, onClose }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    getMarketUser(userId)
      .then(setD)
      .catch((e) => setErr(errText(e, "Could not load details.")));
  }, [userId]);
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Staff details</DialogTitle>
      <DialogContent>
        {err && <Alert severity="error">{err}</Alert>}
        {!d && !err && <CircularProgress size={24} />}
        {d && (
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Field label="Staff ID">{d.user_id_number}</Field>
            <Field label="Name">{d.full_name}</Field>
            <Field label="Username">{d.username}</Field>
            <Field label="Role">{ROLE_LABELS[d.role] || d.role}</Field>
            <Field label="Market">{d.market?.name}</Field>
            <Field label="Status">{d.status}</Field>
            <Field label="Password status">{d.password_status}</Field>
            <Field label="Email">{d.email}</Field>
            <Field label="Mobile">{d.mobile_number}</Field>
            <Field label="Last login">{d.last_login ? fmtDate(d.last_login) : "Never"}</Field>
            <Field label="Created">{fmtDate(d.created)}</Field>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// Edit: name, email and mobile only — to change a role, deactivate and add the person again.
function EditDialog({ user, onClose, onDone }) {
  const [form, setForm] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    mobile_number: user.mobile_number || "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await updateMarketUser(user.id, form);
      onDone("Details saved.");
    } catch (e) {
      setErr(errText(e, "Could not save."));
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit {user.user_id_number || user.username}</DialogTitle>
      <DialogContent>
        <MDTypography variant="caption" color="secondary" display="block" mb={1}>
          Name, email and mobile only. To change a role or market, deactivate this person and add
          them again.
        </MDTypography>
        {err && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {err}
          </Alert>
        )}
        <TextField
          fullWidth
          margin="dense"
          size="small"
          label="First name"
          value={form.first_name}
          onChange={set("first_name")}
        />
        <TextField
          fullWidth
          margin="dense"
          size="small"
          label="Last name"
          value={form.last_name}
          onChange={set("last_name")}
        />
        <TextField
          fullWidth
          margin="dense"
          size="small"
          label="Email"
          value={form.email}
          onChange={set("email")}
        />
        <TextField
          fullWidth
          margin="dense"
          size="small"
          label="Mobile"
          value={form.mobile_number}
          onChange={set("mobile_number")}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={busy || !form.first_name.trim() || !form.last_name.trim()}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Reset password: the manager types a new temporary password (same rules as Add Staff).
function ResetDialog({ user, onClose, onDone }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await resetMarketUserPassword(user.id, pw);
      onDone("Temporary password set. They must change it at their next login.");
    } catch (e) {
      setErr(errText(e, "Could not reset the password."));
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Reset password — {user.user_id_number || user.username}</DialogTitle>
      <DialogContent>
        {err && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {err}
          </Alert>
        )}
        <TextField
          fullWidth
          required
          margin="dense"
          size="small"
          label="New temporary password"
          type={show ? "text" : "password"}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoComplete="new-password"
          helperText="You set it and hand it over in person. They must change it at their next login."
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={submit} disabled={busy || !pw}>
          Set password
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Deactivate / Reactivate with a confirm dialog. Deactivating first asks the server what is
// outstanding: blockers (receipt books, day sheets, cashier intakes, open batches) stop it;
// payments under review / flagged and pending deductions are only shown so the office can reassign.
function ItemList({ items, more }) {
  return (
    <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
      {items.map((x) => (
        <li key={x}>
          <MDTypography variant="caption">{x}</MDTypography>
        </li>
      ))}
      {more > 0 && (
        <li>
          <MDTypography variant="caption">…and {more} more</MDTypography>
        </li>
      )}
    </ul>
  );
}

function ToggleDialog({ user, onClose, onDone }) {
  const activating = !user.is_active;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [check, setCheck] = useState(null); // { blockers, review }
  const [checking, setChecking] = useState(!activating);

  useEffect(() => {
    if (activating) return;
    checkMarketUserDeactivation(user.id)
      .then(setCheck)
      .catch((e) => setErr(errText(e, "Could not check this account.")))
      .finally(() => setChecking(false));
  }, [user.id, activating]);

  const blockers = check?.blockers || [];
  const review = check?.review;
  const hasReview = review && (review.payments.length || review.deductions.length);

  const confirm = async () => {
    setBusy(true);
    setErr(null);
    try {
      await (activating ? reactivateMarketUser(user.id) : deactivateMarketUser(user.id));
      onDone(activating ? "Account reactivated." : "Account deactivated.");
    } catch (e) {
      setErr(errText(e, "Could not complete that."));
      setBusy(false);
    }
  };
  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {activating ? "Reactivate" : "Deactivate"} {user.user_id_number || user.username}?
      </DialogTitle>
      <DialogContent>
        <MDTypography variant="body2">
          {activating
            ? "They will be able to sign in again with their current password."
            : "They will no longer be able to sign in."}
        </MDTypography>
        {checking && <CircularProgress size={20} sx={{ mt: 2 }} />}
        {blockers.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Can&apos;t deactivate yet — clear these first:
            <ItemList items={blockers} />
          </Alert>
        )}
        {hasReview && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Not blocking, but you may want to reassign these:
            {review.payments.length > 0 && (
              <>
                <MDTypography variant="caption" display="block" fontWeight="bold" mt={1}>
                  Payments they recorded, still under review or flagged
                </MDTypography>
                <ItemList items={review.payments} more={review.payments_more} />
              </>
            )}
            {review.deductions.length > 0 && (
              <>
                <MDTypography variant="caption" display="block" fontWeight="bold" mt={1}>
                  Cash deductions they submitted, pending approval
                </MDTypography>
                <ItemList items={review.deductions} more={review.deductions_more} />
              </>
            )}
          </Alert>
        )}
        {err && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {err}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={activating ? "success" : "error"}
          onClick={confirm}
          disabled={busy || checking || blockers.length > 0}
        >
          {activating ? "Reactivate" : "Deactivate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

Field.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node };
DetailsDialog.propTypes = {
  userId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
};
const userShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  user_id_number: PropTypes.string,
  username: PropTypes.string,
  first_name: PropTypes.string,
  last_name: PropTypes.string,
  email: PropTypes.string,
  mobile_number: PropTypes.string,
  is_active: PropTypes.bool,
  can_manage: PropTypes.bool,
  manage_block_reason: PropTypes.string,
});
const dialogProps = {
  user: userShape.isRequired,
  onClose: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
};
EditDialog.propTypes = dialogProps;
ResetDialog.propTypes = dialogProps;
ToggleDialog.propTypes = dialogProps;
ItemList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  more: PropTypes.number,
};

function RowActions({ user, onPick }) {
  const [anchor, setAnchor] = useState(null);
  const pick = (what) => {
    setAnchor(null);
    onPick(what, user);
  };
  const blocked = !user.can_manage;
  const item = (what, label) => (
    <Tooltip title={blocked ? user.manage_block_reason || "" : ""} placement="left">
      <span>
        <MenuItem disabled={blocked} onClick={() => pick(what)}>
          <ListItemText>{label}</ListItemText>
        </MenuItem>
      </span>
    </Tooltip>
  );
  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label="Row actions">
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem onClick={() => pick("view")}>
          <ListItemText>View</ListItemText>
        </MenuItem>
        {item("edit", "Edit")}
        {item("reset", "Reset password")}
        {item("toggle", user.is_active ? "Deactivate" : "Reactivate")}
      </Menu>
    </>
  );
}

RowActions.propTypes = { user: userShape.isRequired, onPick: PropTypes.func.isRequired };

export default function MarketUsersPage() {
  const role = getRole();
  const { userProfile } = useAuthProfile();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [rosterRole, setRosterRole] = useState("");
  const [exporting, setExporting] = useState(false);
  const [dialog, setDialog] = useState(null); // { what, user }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMarketUsers();
      setRows(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load market users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const roleOptions = useMemo(
    () => Array.from(new Set(rows.map((u) => u.role).filter(Boolean))).sort(),
    [rows]
  );

  const canManage = canManageMarketUsers(role);

  const handleExportRoster = async () => {
    // Own market for Owner / Market Administrator; a platform admin has none, so use the list's market.
    const marketId =
      userProfile?.primary_market ?? userProfile?.primary_market_id ?? rows[0]?.primary_market;
    if (!marketId) {
      setError("Can't export roster: no market found for your account.");
      return;
    }
    setExporting(true);
    setError(null);
    try {
      const market = await getMarket(marketId);
      await downloadStaffRosterExport(market.code, { role: rosterRole });
    } catch (e) {
      setError(errText(e, "Failed to export staff roster."));
    } finally {
      setExporting(false);
    }
  };

  const onPick = (what, user) => {
    setNotice(null);
    setDialog({ what, user });
  };
  const done = (msg) => {
    setDialog(null);
    setNotice(msg);
    load();
  };

  if (!canViewMarketUsers(role)) return <Navigate to="/dashboard" replace />;

  const q = search.trim().toLowerCase();
  const visible = rows.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false;
    if (!q) return true;
    return (
      (u.user_id_number || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.first_name || "").toLowerCase().includes(q) ||
      (u.last_name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    );
  });
  const colCount = canManage ? 11 : 10;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <MDBox
          mb={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <MDTypography variant="h5" fontWeight="medium">
            Market Users
          </MDTypography>
          <MDBox display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <TextField
              select
              size="small"
              label="Role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ width: 160 }}
            >
              <MenuItem value="">All roles</MenuItem>
              {roleOptions.map((r) => (
                <MenuItem key={r} value={r}>
                  {ROLE_LABELS[r] || r}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              placeholder="Search ID, name, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 240 }}
            />
            {canManage && (
              <>
                <TextField
                  select
                  size="small"
                  label="Roster role"
                  value={rosterRole}
                  onChange={(e) => setRosterRole(e.target.value)}
                  sx={{ width: 150 }}
                >
                  <MenuItem value="">All roles</MenuItem>
                  {roleOptions.map((r) => (
                    <MenuItem key={r} value={r}>
                      {ROLE_LABELS[r] || r}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportRoster}
                  disabled={exporting}
                >
                  {exporting ? "Exporting…" : "Export Roster"}
                </Button>
              </>
            )}
          </MDBox>
        </MDBox>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {notice && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}

        {loading ? (
          <MDBox display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </MDBox>
        ) : (
          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Staff ID</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Username</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Role</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Email</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Mobile</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Password</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Market</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Last Login</strong>
                  </TableCell>
                  {canManage && (
                    <TableCell align="right">
                      <strong>Actions</strong>
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colCount} align="center">
                      <MDTypography variant="caption" color="secondary">
                        {q || roleFilter ? "No matching users." : "No users in your market."}
                      </MDTypography>
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>{u.user_id_number || "—"}</TableCell>
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
                      <TableCell>
                        <Chip
                          label={u.password_status || "—"}
                          size="small"
                          color={u.password_status === "Temporary" ? "warning" : "default"}
                          variant={u.password_status === "Temporary" ? "filled" : "outlined"}
                        />
                      </TableCell>
                      <TableCell>{u.market_display || "—"}</TableCell>
                      <TableCell>
                        {u.last_login
                          ? new Date(u.last_login).toLocaleDateString("en-PH")
                          : "Never"}
                      </TableCell>
                      {canManage && (
                        <TableCell align="right">
                          <RowActions user={u} onPick={onPick} />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        )}
      </MDBox>

      {dialog?.what === "view" && (
        <DetailsDialog userId={dialog.user.id} onClose={() => setDialog(null)} />
      )}
      {dialog?.what === "edit" && (
        <EditDialog user={dialog.user} onClose={() => setDialog(null)} onDone={done} />
      )}
      {dialog?.what === "reset" && (
        <ResetDialog user={dialog.user} onClose={() => setDialog(null)} onDone={done} />
      )}
      {dialog?.what === "toggle" && (
        <ToggleDialog user={dialog.user} onClose={() => setDialog(null)} onDone={done} />
      )}
    </DashboardLayout>
  );
}
