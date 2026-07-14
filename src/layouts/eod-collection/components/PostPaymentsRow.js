import { useState } from "react";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import PaymentStatusBadge from "components/PaymentStatusBadge";
import { canFlagPayment } from "utils/permissions";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FLAGGABLE_STATUSES = ["DRAFT", "UNDER_REVIEW", "APPROVED"];

// Unit 21.5 F1b-7 Page 3 — expandable payment row for the A/R Post Payments
// page: tenant/stall/lease details + invoice application preview on expand.
export default function PostPaymentsRow({ payment, role, onFlag }) {
  const [open, setOpen] = useState(false);
  const showFlagButton = canFlagPayment(role) && FLAGGABLE_STATUSES.includes(payment.status);
  const preview = payment.invoice_preview || [];

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ width: 40 }}>
          <IconButton size="small" onClick={() => setOpen((v) => !v)}>
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>{payment.tenant_name || "—"}</TableCell>
        <TableCell>{payment.stall_code || "—"}</TableCell>
        <TableCell>{payment.payment_type}</TableCell>
        <TableCell align="right">{peso(payment.amount)}</TableCell>
        <TableCell>
          {payment.receipt_type}-{payment.receipt_number || "—"}
        </TableCell>
        <TableCell>
          <PaymentStatusBadge status={payment.status} />
        </TableCell>
        <TableCell>
          {showFlagButton && (
            <Button size="small" color="error" onClick={() => onFlag(payment)}>
              Flag as wrong
            </Button>
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, borderBottom: open ? undefined : "none" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <MDBox py={2} px={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <MDTypography variant="caption" color="secondary" fontWeight="bold" display="block">
                    LEASE
                  </MDTypography>
                  <MDTypography variant="body2">
                    {payment.lease_start_date || "—"} &rarr; {payment.lease_end_date || "—"}
                  </MDTypography>
                  <MDTypography variant="body2">
                    Monthly rent: {peso(payment.lease_amount)}
                  </MDTypography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <MDTypography variant="caption" color="secondary" fontWeight="bold" display="block">
                    INVOICE APPLICATION PREVIEW
                  </MDTypography>
                  {preview.length === 0 ? (
                    <MDTypography variant="body2" color="secondary">
                      No open invoice lines to apply against.
                    </MDTypography>
                  ) : (
                    preview.map((p, i) => (
                      <MDBox key={i} mb={1}>
                        <MDTypography variant="body2">
                          {p.invoice_number} ({p.charge_type}) &mdash; {peso(p.amount_applied)}
                        </MDTypography>
                        <MDTypography variant="caption" color="secondary">
                          Balance {peso(p.invoice_balance_before)} &rarr; {peso(p.invoice_balance_after)}
                        </MDTypography>
                      </MDBox>
                    ))
                  )}
                </Grid>
              </Grid>
            </MDBox>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
