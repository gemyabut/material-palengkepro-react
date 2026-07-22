import PropTypes from "prop-types";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Unit 51 Stage F — friendly labels for every domain the inspect endpoint can
// resolve a sheet to. Kept here (not DomainPicker, which is deleted) since
// ReviewScreen is now the only consumer of "what do we call this domain".
export const SHEET_DOMAIN_LABELS = {
  tenant: "Tenant",
  stall: "Stall",
  lease: "Lease",
  payment: "Payment",
  collection_summary: "Collection Summary",
  receipt_issue: "Receipt Issue",
  receipt_book: "Receipt Book",
  deposit_slip: "Deposit Slip",
  cashier_intake: "Cashier Intake",
  remittance_batch: "Remittance Batch",
  opening_balance: "Opening Balance",
  expense: "Expense / Cash Deduction",
  leaseholder_rights: "Leaseholder Rights",
};

const ACTION_OPTIONS = [
  { value: "upsert", label: "Upsert — create or update (default)" },
  { value: "create", label: "Create — insert new only; error on duplicate" },
  { value: "skip-existing", label: "Skip existing — insert new; skip duplicates" },
  { value: "skip", label: "Skip this sheet entirely" },
];

function SheetCard({ sheet, action, onActionChange, attachment, onAttachmentChange }) {
  const total = sheet.total || 0;
  const valid = sheet.valid || 0;
  const rate = total ? Math.round((valid / total) * 1000) / 10 : 0;
  const gateMet = rate >= 95;
  const isSkipped = action === "skip";

  return (
    <Card sx={{ mb: 2, opacity: isSkipped ? 0.6 : 1 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <MDTypography variant="h6">{SHEET_DOMAIN_LABELS[sheet.domain] || sheet.domain}</MDTypography>
          <Chip
            size="small"
            label={isSkipped ? "SKIPPED" : gateMet ? "PASS ≥95%" : "BELOW GATE"}
            color={isSkipped ? "default" : gateMet ? "success" : "error"}
          />
        </Stack>

        <MDTypography variant="button" color="text">
          {total} rows &middot; ✓ {valid} valid &middot; ✕ {sheet.rejected || 0} rejected
          {sheet.warnings?.length ? ` · ⚠ ${sheet.warnings.length} warn` : ""}
        </MDTypography>

        {sheet.method_breakdown && (
          <MDBox mt={1}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {Object.entries(sheet.method_breakdown).map(([method, count]) => (
                <Chip key={method} size="small" variant="outlined" label={`${method}: ${count}`} />
              ))}
            </Stack>
          </MDBox>
        )}

        <MDBox mt={2} maxWidth={340}>
          <FormControl size="small" fullWidth>
            <InputLabel id={`action-label-${sheet.domain}`}>Action for this sheet</InputLabel>
            <Select
              labelId={`action-label-${sheet.domain}`}
              label="Action for this sheet"
              value={action}
              onChange={(e) => onActionChange(sheet.domain, e.target.value)}
            >
              {ACTION_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </MDBox>

        {sheet.domain === "deposit_slip" && !isSkipped && (
          <MDBox mt={2}>
            <MDTypography variant="caption" color="text" display="block" mb={0.5}>
              Optional — one scan (PDF or image) applied to every deposit-slip row in this upload.
            </MDTypography>
            <Button variant="outlined" component="label" color="info" size="small">
              {attachment ? attachment.name : "Attach scan"}
              <input
                hidden
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => onAttachmentChange(e.target.files?.[0] || null)}
              />
            </Button>
            {attachment && (
              <Button size="small" onClick={() => onAttachmentChange(null)} sx={{ ml: 1 }}>
                Remove
              </Button>
            )}
          </MDBox>
        )}

        {sheet.errors?.length > 0 && !isSkipped && (
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
  action: PropTypes.string.isRequired,
  onActionChange: PropTypes.func.isRequired,
  attachment: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  onAttachmentChange: PropTypes.func.isRequired,
};
SheetCard.defaultProps = { attachment: null };

function ReviewScreen({ inspectResult, perSheetActions, onActionChange, attachment, onAttachmentChange }) {
  if (!inspectResult) return null;

  const sheets = inspectResult.sheets || [];
  const unrecognized = inspectResult.unrecognized_sheets || [];

  return (
    <MDBox mt={3}>
      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Validation only — nothing saved yet.</strong> Review each sheet below, choose an
        action per sheet, then configure how to save.
      </Alert>

      {unrecognized.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {unrecognized.length} sheet(s) not recognized and will be skipped: {unrecognized.join(", ")}
        </Alert>
      )}

      {sheets.map((s) => (
        <SheetCard
          key={s.domain}
          sheet={s}
          action={perSheetActions[s.domain] || "upsert"}
          onActionChange={onActionChange}
          attachment={s.domain === "deposit_slip" ? attachment : null}
          onAttachmentChange={onAttachmentChange}
        />
      ))}
    </MDBox>
  );
}

ReviewScreen.propTypes = {
  inspectResult: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  perSheetActions: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  onActionChange: PropTypes.func.isRequired,
  attachment: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  onAttachmentChange: PropTypes.func.isRequired,
};
ReviewScreen.defaultProps = { inspectResult: null, attachment: null };

export default ReviewScreen;
