import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, Chip, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { getImportJobs } from "api/csvImport";

const STATUS_COLOR = {
  COMPLETED: "success",
  FAILED:    "error",
  ABORTED:   "error",
  RUNNING:   "info",
};

function ImportHistoryTable({ canSeeAll, refreshKey }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getImportJobs({ page_size: 50 })
      .then((data) => {
        setJobs(Array.isArray(data) ? data : (data?.results ?? []));
      })
      .catch(() => {
        // Silently hide — history is secondary; endpoint may not be deployed yet
        setJobs([]);
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

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
