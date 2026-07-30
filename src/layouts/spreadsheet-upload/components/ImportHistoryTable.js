import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Button, Card, CardContent, Chip, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { getImportJobs } from "api/csvImport";

// ImportJobListView (csv_import/views.py) only supports page_size (capped at
// 200 server-side) — there's no page/offset concept, it always returns the
// N most recent jobs. True page-based Pagination would be non-functional
// here (clicking "page 2" would just refetch the same top-N rows), so this
// is a growing "Load more" step instead of a MUI Pagination control.
const PAGE_SIZE_STEP = 20;
const MAX_PAGE_SIZE = 200;

const STATUS_COLOR = {
  COMPLETED: "success",
  FAILED:    "error",
  ABORTED:   "error",
  RUNNING:   "info",
};

function ImportHistoryTable({ canSeeAll, refreshKey }) {
  const [jobs, setJobs] = useState([]);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_STEP);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getImportJobs({ page_size: pageSize })
      .then((data) => {
        setJobs(Array.isArray(data) ? data : (data?.results ?? []));
      })
      .catch(() => {
        // Silently hide — history is secondary; endpoint may not be deployed yet
        setJobs([]);
      })
      .finally(() => setLoading(false));
  }, [refreshKey, pageSize]);

  const canLoadMore = jobs.length >= pageSize && pageSize < MAX_PAGE_SIZE;
  const handleLoadMore = () => setPageSize((n) => Math.min(n + PAGE_SIZE_STEP, MAX_PAGE_SIZE));

  return (
    <Card>
      <CardContent>
        <MDTypography variant="h6" gutterBottom>
          {canSeeAll ? "All Import History" : "Your Import History"}
        </MDTypography>
        {loading ? (
          <MDTypography variant="caption" color="text">Loading...</MDTypography>
        ) : jobs.length === 0 ? (
          <MDTypography variant="caption" color="text">No imports yet.</MDTypography>
        ) : (
          <MDBox sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Domain</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Created</TableCell>
                  <TableCell align="right">Updated</TableCell>
                  <TableCell align="right">Rejected</TableCell>
                  <TableCell>Job ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.job_id ?? job.id}>
                    <TableCell>
                      {job.started_at ? new Date(job.started_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>{job.domain || "—"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={job.status || "UNKNOWN"}
                        color={STATUS_COLOR[job.status] || "default"}
                      />
                    </TableCell>
                    <TableCell align="right">{job.total_rows ?? "—"}</TableCell>
                    <TableCell align="right">{job.rows_created ?? "—"}</TableCell>
                    <TableCell align="right">{job.rows_updated ?? "—"}</TableCell>
                    <TableCell align="right">{job.rows_rejected ?? "—"}</TableCell>
                    <TableCell>{job.job_id ?? job.id ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </MDBox>
        )}

        {!loading && canLoadMore && (
          <MDBox mt={2} display="flex" justifyContent="center">
            <Button variant="outlined" size="small" onClick={handleLoadMore}>
              Load more
            </Button>
          </MDBox>
        )}
      </CardContent>
    </Card>
  );
}

ImportHistoryTable.propTypes = {
  canSeeAll:  PropTypes.bool,
  refreshKey: PropTypes.number,
};
ImportHistoryTable.defaultProps = { canSeeAll: false, refreshKey: 0 };

export default ImportHistoryTable;
