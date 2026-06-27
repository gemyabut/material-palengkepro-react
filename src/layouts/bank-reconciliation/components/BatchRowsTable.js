import React from "react";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MDTypography from "components/MDTypography";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ROW_BG = {
  CONFIRMED: "#f0fdf4",  // green-50
  POSTED:    "#fefce8",  // yellow-50
};

export default function BatchRowsTable({ batches, canConfirm, onConfirmClick }) {
  if (!batches || batches.length === 0) {
    return (
      <MDTypography variant="body2" color="secondary" sx={{ px: 1, pb: 1 }}>
        No deposits in this period.
      </MDTypography>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Date</TableCell>
          <TableCell>Batch #</TableCell>
          <TableCell align="right">Total</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Deposit Date</TableCell>
          <TableCell>Bank Ref</TableCell>
          <TableCell>Confirmed At</TableCell>
          <TableCell>Confirmation Ref</TableCell>
          {canConfirm && <TableCell className="no-print">Action</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {batches.map((b) => (
          <TableRow key={b.id} sx={{ backgroundColor: ROW_BG[b.status] ?? "inherit" }}>
            <TableCell>{b.date}</TableCell>
            <TableCell>#{b.id}</TableCell>
            <TableCell align="right">{peso(b.total)}</TableCell>
            <TableCell>
              <MDTypography
                variant="caption"
                fontWeight="medium"
                color={b.status === "CONFIRMED" ? "success" : "warning"}
              >
                {b.status}
              </MDTypography>
            </TableCell>
            <TableCell>{b.deposit_date || "—"}</TableCell>
            <TableCell>{b.bank_account_last4 ? `••••${b.bank_account_last4}` : "—"}</TableCell>
            <TableCell>
              {b.confirmed_at ? new Date(b.confirmed_at).toLocaleString() : "—"}
            </TableCell>
            <TableCell>{b.bank_confirmation_ref || "—"}</TableCell>
            {canConfirm && (
              <TableCell className="no-print">
                {b.status === "POSTED" && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => onConfirmClick(b)}
                  >
                    Confirm
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
