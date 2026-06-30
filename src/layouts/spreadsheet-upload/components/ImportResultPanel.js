import PropTypes from "prop-types";
import { Alert, Button, Stack } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

function ImportResultPanel({ result, onUploadAnother }) {
  if (!result) return null;

  const sheets = result.sheets || [];
  const totalCreated = sheets.reduce((a, s) => a + (s.created || 0), 0);
  const totalUpdated = sheets.reduce((a, s) => a + (s.updated || 0), 0);
  const totalRejected = sheets.reduce((a, s) => a + (s.rejected || 0), 0);
  const aborted = result.aborted;

  return (
    <MDBox mt={3}>
      <Alert severity={aborted ? "error" : "success"} sx={{ mb: 2 }}>
        {aborted ? (
          <>Import aborted — a chunk exceeded the 5% rejection gate. No rows were committed.</>
        ) : (
          <>
            <strong>Import complete.</strong>{" "}
            {totalCreated} rows created, {totalUpdated} updated.
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

      <Stack direction="row" spacing={2}>
        <Button variant="outlined" color="info" onClick={onUploadAnother}>
          Upload Another
        </Button>
      </Stack>
    </MDBox>
  );
}

ImportResultPanel.propTypes = {
  result: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  onUploadAnother: PropTypes.func.isRequired,
};
ImportResultPanel.defaultProps = { result: null };

export default ImportResultPanel;
