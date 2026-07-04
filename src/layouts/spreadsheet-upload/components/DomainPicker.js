import { useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  FormControl,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

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

// Unit 27 — scope options for the master template download.
const TEMPLATE_SCOPES = [
  { scope: "full",         label: "Full master template",          hint: "All domains (Tenants, Stalls, Leases, Collections)" },
  { scope: "crm-golive",   label: "CRM Go-Live template",           hint: "One-time bulk load: Stalls + Tenants + Leases" },
  { scope: "crm-crud",     label: "CRM CRUD template",              hint: "Day-to-day changes with action column" },
];

function DomainPicker({ domain, allowedDomains, onChange, onDownloadTemplate }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const handlePick = (scope) => {
    closeMenu();
    onDownloadTemplate(scope);
  };

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
      <Button
        variant="outlined"
        color="info"
        endIcon={<ArrowDropDownIcon />}
        onClick={openMenu}
      >
        Download template
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        {TEMPLATE_SCOPES.map(({ scope, label, hint }) => (
          <MenuItem key={scope} onClick={() => handlePick(scope)} sx={{ display: "block", py: 1 }}>
            <div style={{ fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{hint}</div>
          </MenuItem>
        ))}
      </Menu>
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
