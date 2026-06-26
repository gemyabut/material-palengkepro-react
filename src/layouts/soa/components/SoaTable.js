import React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import MDTypography from "components/MDTypography";

const STATUS_COLORS = {
  PAID:    "success",
  PARTIAL: "warning",
  OPEN:    "default",
  VOID:    "error",
};

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

function SoaTable({ invoices = [] }) {
  if (invoices.length === 0) {
    return (
      <MDTypography variant="body2" color="secondary" mt={1}>
        No invoices in this period.
      </MDTypography>
    );
  }

  return (
    <Table size="small" sx={{ mt: 1 }}>
      <TableHead>
        <TableRow sx={{ "& th": { fontWeight: 700, whiteSpace: "nowrap" } }}>
          <TableCell>Invoice #</TableCell>
          <TableCell>Period</TableCell>
          <TableCell align="right">Charged</TableCell>
          <TableCell align="right">Paid</TableCell>
          <TableCell align="right">Balance</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {invoices.map((inv) => (
          <TableRow key={inv.invoice_id}>
            <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
              {inv.invoice_number}
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
              {inv.period_start} → {inv.period_end}
            </TableCell>
            <TableCell align="right">{peso(inv.total)}</TableCell>
            <TableCell align="right">{peso(inv.paid)}</TableCell>
            <TableCell
              align="right"
              sx={{ fontWeight: Number(inv.balance) > 0 ? 700 : 400 }}
            >
              {peso(inv.balance)}
            </TableCell>
            <TableCell>
              <Chip
                label={inv.status}
                color={STATUS_COLORS[inv.status] || "default"}
                size="small"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default SoaTable;
