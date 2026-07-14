import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { canApproveIntake } from "utils/permissions";
import { getEodCount } from "api/cashierIntakes";
import { approveAndAdvance } from "api/cashierIntakeReview";
import FlagDialog from "layouts/cashier-intake/components/FlagDialog";
import PostPaymentsRow from "./components/PostPaymentsRow";

function getRole() {
  const t = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  try {
    return (jwtDecode(t).role || "").toLowerCase();
  } catch {
    return "";
  }
}

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Unit 21.5 F1b-7 Page 3 — A/R's Post Payments page. Separates A/R's review
// work (flag/post) from the Cashier's Cash Verification page, instead of
// both roles sharing /cashier-intake/:id.
export default function PostPaymentsPage() {
  const role = getRole();
  const { id } = useParams();
  const navigate = useNavigate();

  const [intake, setIntake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flagTarget, setFlagTarget] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);

  const load = useCallback(() => {
    return getEodCount(id)
      .then(setIntake)
      .catch(() => setError("Could not load this cashier intake."));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  if (!canApproveIntake(role)) return <Navigate to="/eod-collection" replace />;

  const payments = intake?.payments || [];
  const hasFlagged = payments.some((p) => p.status === "FLAGGED");
  const totalToPost = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const handlePostAll = async () => {
    setPosting(true);
    setPostError(null);
    try {
      await approveAndAdvance(id);
      navigate("/eod-collection");
    } catch (e) {
      setPostError(
        e?.response?.data?.message || e?.response?.data?.detail || "Could not post payments."
      );
      setPosting(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {loading && <CircularProgress size={24} />}

        {!loading && error && (
          <Alert severity="error" icon={false}>
            {error}
          </Alert>
        )}

        {!loading && intake && (
          <>
            <MDBox mb={3}>
              <MDTypography variant="h5">Post Payments</MDTypography>
              <MDTypography variant="body2" color="secondary">
                {intake.collector_name} &middot; {intake.date} &middot; Total to post: {peso(totalToPost)}
              </MDTypography>
            </MDBox>

            <Paper>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Tenant</TableCell>
                    <TableCell>Stall</TableCell>
                    <TableCell>Charge</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Receipt#</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <PostPaymentsRow key={p.id} payment={p} role={role} onFlag={setFlagTarget} />
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <MDBox mt={3}>
              <Tooltip title={hasFlagged ? "Resolve all flagged payments before posting." : ""}>
                <span>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={posting || hasFlagged || payments.length === 0}
                    onClick={handlePostAll}
                  >
                    {posting ? "Posting…" : "Post All to Ledgers"}
                  </Button>
                </span>
              </Tooltip>
              {postError && (
                <Alert severity="error" sx={{ mt: 1.5 }} icon={false}>
                  {postError}
                </Alert>
              )}
            </MDBox>

            <FlagDialog
              open={!!flagTarget}
              payment={flagTarget}
              onClose={() => setFlagTarget(null)}
              onFlagged={load}
            />
          </>
        )}
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}
