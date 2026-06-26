import React from "react";
import { useNavigate } from "react-router-dom";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

const STATUS_COLOR = {
  OPEN: "info",
  PARTIAL: "warning",
  PAID: "success",
  VOID: "default",
};

function InvoiceTable({ invoices, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <MDBox display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </MDBox>
    );
  }

  if (invoices.length === 0) {
    return (
      <MDBox mt={3} textAlign="center">
        <MDTypography variant="body2" color="secondary">
          No invoices match your filters.
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Invoice #</TableCell>
            <TableCell>Tenant</TableCell>
            <TableCell>Period</TableCell>
            <TableCell align="right">Total</TableCell>
            <TableCell align="right">Paid</TableCell>
            <TableCell align="right">Balance</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Due Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow
              key={inv.id}
              hover
              sx={{ cursor: "pointer" }}
              onClick={() => navigate(`/invoices/${inv.id}`)}
            >
              <TableCell>{inv.invoice_number || `#${inv.id}`}</TableCell>
              <TableCell>{inv.tenant_full_name}</TableCell>
              <TableCell>
                {inv.period_start} – {inv.period_end}
              </TableCell>
              <TableCell align="right">₱{inv.total}</TableCell>
              <TableCell align="right">₱{inv.paid}</TableCell>
              <TableCell align="right">₱{inv.balance}</TableCell>
              <TableCell>
                <Chip
                  label={inv.status}
                  color={STATUS_COLOR[inv.status] || "default"}
                  size="small"
                />
              </TableCell>
              <TableCell>{inv.due_date ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default InvoiceTable;
