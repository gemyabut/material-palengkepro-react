import PropTypes from "prop-types";
import { Alert, Button, Stack, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ReplayIcon from "@mui/icons-material/Replay";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import HistoryIcon from "@mui/icons-material/History";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { downloadResultsWorkbook } from "api/csvImport";
import { SHEET_DOMAIN_LABELS } from "./ReviewScreen";

function ResultsScreen({ result, sourceWasXlsx, onTryAgain, onUploadAnother, onViewHistory }) {
  if (!result) return null;

  const sheets = (result.sheets || []).filter((s) => !s.aborted);
  const totalCreated = sheets.reduce((a, s) => a + (s.created || 0), 0);
  const totalUpdated = sheets.reduce((a, s) => a + (s.updated || 0), 0);
  const totalRejected = sheets.reduce((a, s) => a + (s.rejected || 0), 0);
  const aborted = Boolean(result.aborted);
  // job_id AND source was .xlsx — the backend only persists a source workbook
  // (and therefore only ever generates a results workbook) for .xlsx uploads;
  // CSV uploads always 404 on the download endpoint (Unit 51 Stage E).
  const canDownload = Boolean(result.job_id) && sourceWasXlsx;

  const handleDownload = async () => {
    try {
      await downloadResultsWorkbook(result.job_id);
    } catch {
      // eslint-disable-next-line no-alert
      window.alert("Results workbook isn't available for this import.");
    }
  };

  return (
    <MDBox mt={3}>
      <Alert severity={aborted ? "error" : "success"} sx={{ mb: 2 }}>
        {aborted ? (
          <>
            <strong>Import aborted.</strong> {result.abort_reason || "No rows were committed."}
          </>
        ) : (
          <>
            <strong>Import complete.</strong> {totalCreated} rows created, {totalUpdated} updated.
            {totalRejected > 0 ? ` ${totalRejected} rows rejected.` : ""}
            {"  Overall acceptance: "}
            <strong>{result.overall_acceptance_rate}%</strong>
          </>
        )}
      </Alert>

      {result.job_id && (
        <MDTypography variant="caption" color="text" display="block" mb={2}>
          Job ID: {result.job_id}
        </MDTypography>
      )}

      {sheets.length > 0 && (
        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Sheet</TableCell>
              <TableCell align="right">Created</TableCell>
              <TableCell align="right">Updated</TableCell>
              <TableCell align="right">Skipped</TableCell>
              <TableCell align="right">Rejected</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sheets.map((s) => (
              <TableRow key={s.domain}>
                <TableCell>{SHEET_DOMAIN_LABELS[s.domain] || s.domain}</TableCell>
                <TableCell align="right">{s.created ?? 0}</TableCell>
                <TableCell align="right">{s.updated ?? 0}</TableCell>
                <TableCell align="right">{s.skipped ?? 0}</TableCell>
                <TableCell align="right">{s.rejected ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {result.skipped_sheets?.length > 0 && (
        <MDTypography variant="caption" color="text" display="block" mb={2}>
          Skipped by your action choice: {result.skipped_sheets.join(", ")}
        </MDTypography>
      )}

      <Stack direction="row" spacing={2} flexWrap="wrap">
        {canDownload && (
          <Button
            variant="contained"
            color="info"
            size="large"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download results workbook
          </Button>
        )}
        <Button variant="outlined" color="info" startIcon={<ReplayIcon />} onClick={onTryAgain}>
          Try Again
        </Button>
        <Button variant="outlined" color="info" startIcon={<UploadFileIcon />} onClick={onUploadAnother}>
          Upload another file
        </Button>
        <Button variant="text" color="info" startIcon={<HistoryIcon />} onClick={onViewHistory}>
          View upload history
        </Button>
      </Stack>
    </MDBox>
  );
}

ResultsScreen.propTypes = {
  result: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  sourceWasXlsx: PropTypes.bool,
  onTryAgain: PropTypes.func.isRequired,
  onUploadAnother: PropTypes.func.isRequired,
  onViewHistory: PropTypes.func.isRequired,
};
ResultsScreen.defaultProps = { result: null, sourceWasXlsx: false };

export default ResultsScreen;
