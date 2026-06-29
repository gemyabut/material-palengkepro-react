import React, { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Chip from "@mui/material/Chip";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { destinationLabel } from "utils/destinationLabels";
import BatchRowsTable from "./BatchRowsTable";
import UnmatchedAlert from "./UnmatchedAlert";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function BankAccountAccordion({ entry, destinationType, canConfirm, onConfirmClick }) {
  const [expanded, setExpanded] = useState(true);
  const hasUnmatched = entry.unmatched && entry.unmatched.length > 0;

  const sectionTitle = entry.bank_name ||
    destinationLabel(destinationType ?? "BANK", "destinationName");

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, val) => setExpanded(val)}
      disableGutters
      sx={{ mb: 2, "&:before": { display: "none" } }}
    >
      <AccordionSummary expandIcon={<Icon>expand_more</Icon>}>
        <MDBox display="flex" alignItems="center" gap={2} flexWrap="wrap" width="100%">
          <MDTypography variant="h6" fontWeight="bold">
            {sectionTitle}
          </MDTypography>

          <MDBox display="flex" gap={1} alignItems="center">
            <Chip
              size="small"
              label={`${entry.confirmed_count} confirmed · ${peso(entry.confirmed_amount)}`}
              color="success"
              variant="outlined"
            />
            {hasUnmatched && (
              <Chip
                size="small"
                label={`${entry.unmatched.length} unmatched · ${peso(entry.unmatched_amount)}`}
                color="warning"
                variant="outlined"
              />
            )}
          </MDBox>
        </MDBox>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0 }}>
        <MDBox px={2} pt={1}>
          <UnmatchedAlert
            count={entry.unmatched ? entry.unmatched.length : 0}
            amount={entry.unmatched_amount}
          />
        </MDBox>
        <BatchRowsTable
          batches={entry.deposited}
          canConfirm={canConfirm}
          onConfirmClick={onConfirmClick}
        />
      </AccordionDetails>
    </Accordion>
  );
}
