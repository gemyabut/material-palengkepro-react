import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  FormControlLabel,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Tab,
  Tabs,
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

// Unit 27 F6 — group domains by ERP module for the tab layout.
export const DOMAIN_MODULE = {
  tenant: "crm", stall: "crm", lease: "crm",
  payment: "ar", collection_summary: "ar", receipt_book: "ar", receipt_issue: "ar",
  cashier_intake: "treasury", remittance_batch: "treasury", deposit_slip: "treasury",
};

const ERP_TABS = [
  { key: "crm",      label: "CRM" },
  { key: "ar",       label: "Accounts Receivable" },
  { key: "treasury", label: "Treasury" },
];

// Unit 27 — scope options for the master template download.
const TEMPLATE_SCOPES = [
  { scope: "full",         label: "Full master template",  hint: "All domains (Tenants, Stalls, Leases, Collections)" },
  { scope: "crm-golive",   label: "CRM Go-Live template",  hint: "One-time bulk load: Stalls + Tenants + Leases" },
  { scope: "crm-crud",     label: "CRM CRUD template",     hint: "Day-to-day changes with action column" },
];

function DomainPicker({ domain, allowedDomains, onChange, onDownloadTemplate }) {
  // Group user's allowed domains by ERP module. Tabs with zero domains auto-hide.
  const domainsByModule = useMemo(() => {
    const acc = { crm: [], ar: [], treasury: [] };
    allowedDomains.forEach((d) => {
      const m = DOMAIN_MODULE[d];
      if (m && acc[m]) acc[m].push(d);
    });
    return acc;
  }, [allowedDomains]);

  const visibleTabs = ERP_TABS.filter((t) => domainsByModule[t.key].length > 0);

  // The active tab derives from the current domain, or defaults to the first visible tab.
  const currentModule = DOMAIN_MODULE[domain];
  const initialTab =
    (currentModule && domainsByModule[currentModule]?.length && currentModule) ||
    visibleTabs[0]?.key ||
    "";
  const [activeTab, setActiveTab] = useState(initialTab);

  // If the user's role changes (allowedDomains changes) and the active tab becomes empty,
  // fall back to the first visible tab.
  useEffect(() => {
    if (!domainsByModule[activeTab]?.length) {
      setActiveTab(visibleTabs[0]?.key || "");
    }
  }, [activeTab, domainsByModule, visibleTabs]);

  const handleTabChange = (_evt, next) => {
    setActiveTab(next);
    // Reset domain to first of the newly-selected tab so the picker below stays consistent.
    const first = domainsByModule[next]?.[0];
    if (first && first !== domain) onChange(first);
  };

  const handleRadioChange = (e) => onChange(e.target.value);

  // Template-download split menu.
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = (e) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);
  const handlePick = (scope) => {
    closeMenu();
    onDownloadTemplate(scope);
  };

  if (visibleTabs.length === 0) {
    return (
      <Box color="text.secondary" fontSize={14}>
        No import domains available for your role.
      </Box>
    );
  }

  const activeDomains = domainsByModule[activeTab] || [];

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} justifyContent="space-between">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          {visibleTabs.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
        <Box>
          <Button variant="outlined" color="info" endIcon={<ArrowDropDownIcon />} onClick={openMenu}>
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
        </Box>
      </Stack>

      <RadioGroup value={domain || ""} onChange={handleRadioChange}>
        <Stack spacing={0.5}>
          {activeDomains.map((d) => (
            <FormControlLabel
              key={d}
              value={d}
              control={<Radio size="small" />}
              label={DOMAIN_LABELS[d] || d}
            />
          ))}
        </Stack>
      </RadioGroup>
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
