import PropTypes from "prop-types";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

function SheetCard({ sheet }) {
  const pct = Number(sheet.acceptance_rate) || 0;
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <MDTypography variant="h6" textTransform="capitalize">
            {sheet.domain}
          </MDTypography>
          <Chip
            size="small"
            label={sheet.gate_met ? "PASS ≥95%" : "BELOW GATE"}
            color={sheet.gate_met ? "success" : "error"}
          />
        </Stack>
        <MDTypography variant="button" color="text">
          {sheet.total_rows} rows &middot; ✓ {sheet.accepted} ok &middot; ✕ {sheet.rejected} rejected
          {sheet.warnings?.length ? ` · ⚠ ${sheet.warnings.length} warn` : ""}
        </MDTypography>
        <MDBox mt={1} mb={0.5}>
          <LinearProgress
            variant="determinate"
            value={Math.min(pct, 100)}
            color={pct >= 95 ? "success" : "error"}
          />
        </MDBox>
        <MDTypography variant="caption" color="text">
          {`created ${sheet.created ?? 0} · updated ${sheet.updated ?? 0} · acceptance ${pct}%`}
        </MDTypography>

        {sheet.errors?.length > 0 && (
          <MDBox mt={1.5}>
            <MDTypography variant="caption" fontWeight="bold" color="error">
              Rejected rows {sheet.errors.length > 50 ? "(showing first 50)" : ""}
            </MDTypography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>Field</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sheet.errors.slice(0, 50).map((e, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <TableRow key={i}>
                    <TableCell>{e.row ?? "—"}</TableCell>
                    <TableCell>{e.field}</TableCell>
                    <TableCell>{e.message}</TableCell>
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

SheetCard.propTypes = {
  sheet: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

function ImportPreview({ result, onClear, onPublish, publishing }) {
  if (!result) return null;

  const sheets = result.sheets || [];
  const allPass = sheets.every((s) => s.gate_met);
  const totalReady = sheets.reduce((a, s) => a + (s.accepted || 0), 0);

  return (
    <MDBox mt={3}>
      <Alert severity={allPass ? "success" : "warning"} sx={{ mb: 2 }}>
        <strong>Validation only — nothing saved yet.</strong>{" "}
        {allPass
          ? `All sheets pass the 95% gate. ${totalReady} rows ready to publish.`
          : "One or more sheets are below the 95% gate — fix errors in your spreadsheet and re-upload to validate again."}
        {"  Overall acceptance: "}
        <strong>{result.overall_acceptance_rate}%</strong>
      </Alert>

      {sheets.map((s) => (
        <SheetCard key={s.domain} sheet={s} />
      ))}

      <Stack direction="row" spacing={2} mt={2} flexWrap="wrap">
        <Button variant="outlined" color="dark" onClick={onClear} disabled={publishing}>
          Clear Results
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={onPublish}
          disabled={publishing || !allPass}
        >
          {publishing ? "Committing..." : `Commit ${totalReady} rows to database`}
        </Button>
      </Stack>
      {!allPass && (
        <MDTypography variant="caption" color="error" display="block" mt={1}>
          Fix the errors above in your spreadsheet, re-upload the file, then validate again.
        </MDTypography>
      )}
    </MDBox>
  );
}

ImportPreview.propTypes = {
  result: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  onClear: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  publishing: PropTypes.bool,
};
ImportPreview.defaultProps = { result: null, publishing: false };

export default ImportPreview;
