import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import MDTypography from "components/MDTypography";

const STATUS_COLORS = {
  PAID: "success",
  PARTIAL: "warning",
  OPEN: "default",
  VOID: "error",
};

// M1 (UNIT_53 Phase D.3) — canonical SOA order is already applied
// server-side (generate_statement's lines_summary); this just abbreviates
// for the chip, same mapping as the Invoices page (D.1).
const TYPE_ABBREV = {
  RENT: "RENT",
  RIGHTS: "RIGHTS",
  ELECTRICITY: "ELEC",
  WATER: "WATER",
  OTHER: "OTHER",
};

function typeChipLabel(linesSummary) {
  if (!linesSummary || linesSummary.length === 0) return "—";
  return linesSummary.map((code) => TYPE_ABBREV[code] || code).join("+");
}

// Neither date-fns nor dayjs is installed in this project — native
// Date.toLocaleDateString covers "MMM yyyy" without a new dependency (same
// pattern as the Invoices page, D.1). Appending T00:00:00 (no Z) parses the
// ISO date as local time, avoiding an off-by-one-day shift in
// negative-UTC-offset timezones.
function formatPeriod(periodStart) {
  if (!periodStart) return "—";
  const d = new Date(`${periodStart}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const peso = (v) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

function SoaTable({ invoices = [] }) {
  const navigate = useNavigate();

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
          <TableCell>Type</TableCell>
          <TableCell align="right">Charged</TableCell>
          <TableCell align="right">Paid</TableCell>
          <TableCell align="right">Balance</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {invoices.map((inv) => (
          <TableRow
            key={inv.invoice_id}
            hover
            sx={{ cursor: "pointer" }}
            onClick={() => navigate(`/invoices/${inv.invoice_id}`)}
          >
            <TableCell
              sx={{
                fontFamily: "monospace",
                fontSize: "0.8rem",
                color: "info.main",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {inv.invoice_number}
            </TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>{formatPeriod(inv.period_start)}</TableCell>
            <TableCell>
              <Chip
                label={typeChipLabel(inv.lines_summary)}
                size="small"
                color="default"
                variant="outlined"
              />
            </TableCell>
            <TableCell align="right">{peso(inv.total)}</TableCell>
            <TableCell align="right">{peso(inv.paid)}</TableCell>
            <TableCell align="right" sx={{ fontWeight: Number(inv.balance) > 0 ? 700 : 400 }}>
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

SoaTable.propTypes = {
  invoices: PropTypes.arrayOf(
    PropTypes.shape({
      invoice_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      invoice_number: PropTypes.string,
      period_start: PropTypes.string,
      period_end: PropTypes.string,
      lines_summary: PropTypes.arrayOf(PropTypes.string),
      total: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      paid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      balance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      status: PropTypes.string,
    })
  ),
};

export default SoaTable;
