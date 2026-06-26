import React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";

function InvoiceLinesTable({ lines = [] }) {
  if (lines.length === 0) {
    return (
      <MDBox mt={1} mb={1}>
        <MDTypography variant="body2" color="secondary">
          No invoice lines recorded.
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Charge Type</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>TLE ID</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.id}>
              <TableCell>{line.line_date}</TableCell>
              <TableCell>{line.charge_type_display}</TableCell>
              <TableCell>{line.description || "—"}</TableCell>
              <TableCell align="right">₱{line.amount}</TableCell>
              <TableCell>{line.ledger_entry_id ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default InvoiceLinesTable;
