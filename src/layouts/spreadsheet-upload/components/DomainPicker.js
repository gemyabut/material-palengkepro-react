import PropTypes from "prop-types";
import { Button, FormControl, InputLabel, MenuItem, Select, Stack } from "@mui/material";

export const DOMAIN_LABELS = {
  tenant:             "Tenant — onboarding & updates",
  stall:              "Stall — master data",
  lease:              "Lease — agreements",
  payment:            "Payment — daily collections (most common)",
  collection_summary: "Collection Summary — day-sheet totals",
  receipt_issue:      "Receipt Issue — manual issuance log",
  receipt_book:       "Receipt Book — inventory",
  deposit_slip:       "Deposit Slip — bank/LGU deposits",
  cashier_intake:     "Cashier Intake — EOD cash count history",
  remittance_batch:   "Remittance Batch — bank/LGU batches",
};

function DomainPicker({ domain, allowedDomains, onChange, onDownloadTemplate }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end">
      <FormControl sx={{ minWidth: 320 }} size="small">
        <InputLabel id="domain-select-label">Domain / sheet type</InputLabel>
        <Select
          labelId="domain-select-label"
          value={domain}
          label="Domain / sheet type"
          onChange={(e) => onChange(e.target.value)}
        >
          {allowedDomains.map((d) => (
            <MenuItem key={d} value={d}>
              {DOMAIN_LABELS[d] || d}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="outlined" color="info" onClick={onDownloadTemplate}>
        Download master template
      </Button>
    </Stack>
  );
}

DomainPicker.propTypes = {
  domain: PropTypes.string.isRequired,
  allowedDomains: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  onDownloadTemplate: PropTypes.func.isRequired,
};

export default DomainPicker;
