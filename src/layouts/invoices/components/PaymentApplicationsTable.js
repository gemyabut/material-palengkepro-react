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

function PaymentApplicationsTable({ applications = [] }) {
  if (applications.length === 0) {
    return (
      <MDBox mt={1} mb={1}>
        <MDTypography variant="body2" color="secondary">
          No payments applied to this invoice.
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Receipt #</TableCell>
            <TableCell>Payment Date</TableCell>
            <TableCell align="right">Amount Applied</TableCell>
            <TableCell>Mode</TableCell>
            <TableCell>Applied By</TableCell>
            <TableCell>Applied At</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell>{app.payment_receipt || "—"}</TableCell>
              <TableCell>{app.payment_date}</TableCell>
              <TableCell align="right">₱{app.amount}</TableCell>
              <TableCell>{app.mode_display}</TableCell>
              <TableCell>{app.created_by_name}</TableCell>
              <TableCell>{app.created_at ? app.created_at.slice(0, 10) : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default PaymentApplicationsTable;
