import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Chip, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import Pagination from "@mui/material/Pagination";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { getImportJobs } from "api/csvImport";

const DEFAULT_LIMIT = 20;

const STATUS_COLOR = {
  COMPLETED: "success",
  FAILED:    "error",
  ABORTED:   "error",
  RUNNING:   "info",
};

function ImportHistoryTable({ canSeeAll, refreshKey }) {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // A fresh import should surface on page 1, not wherever the user had paged to.
  useEffect(() => { setPage(1); }, [refreshKey]);

  useEffect(() => {
    setLoading(true);
    getImportJobs({ page, page_size: DEFAULT_LIMIT })
      .then((data) => {
        const results = Array.isArray(data) ? data : (data?.results ?? []);
        const count = Array.isArray(data) ? data.length : (data?.count ?? results.length);
        setJobs(results);
        setTotal(count);
      })
      .catch(() => {
        // Silently hide — history is secondary; endpoint may not be deployed yet
        setJobs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [refreshKey, page]);

  const handlePageChange = (_, value) => setPage(value);

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

        {!loading && jobs.length > 0 && (
          <MDBox mt={2} display="flex" justifyContent="center">
            <Pagination
              count={Math.ceil(total / DEFAULT_LIMIT) || 1}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
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
