import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MDTypography from "components/MDTypography";
import PaymentRow from "./PaymentRow";

export default function PaymentList({ payments, role, onFlag }) {
  if (!payments || payments.length === 0) {
    return (
      <MDTypography variant="body2" color="secondary">
        No payments in this intake.
      </MDTypography>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Tenant</TableCell>
          <TableCell>Stall</TableCell>
          <TableCell>Charge</TableCell>
          <TableCell align="right">Amount</TableCell>
          <TableCell>Receipt#</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {payments.map((p) => (
          <PaymentRow key={p.id} payment={p} role={role} onFlag={onFlag} />
        ))}
      </TableBody>
    </Table>
  );
}
