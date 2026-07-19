import { useNavigate } from "react-router-dom";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Button from "@mui/material/Button";
import PaymentStatusBadge from "components/PaymentStatusBadge";
import { canFlagPayment, canCorrectFlaggedPayment } from "utils/permissions";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FLAGGABLE_STATUSES = ["DRAFT", "UNDER_REVIEW", "APPROVED"];

export default function PaymentRow({ payment, role, onFlag }) {
  const navigate = useNavigate();

  const showFlagButton = canFlagPayment(role) && FLAGGABLE_STATUSES.includes(payment.status);
  const showCorrectButton = canCorrectFlaggedPayment(role) && payment.status === "FLAGGED";

  return (
    <TableRow>
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
            Flag
          </Button>
        )}
        {showCorrectButton && (
          <Button size="small" color="warning" onClick={() => navigate(`/payments/${payment.id}`)}>
            Correct
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
