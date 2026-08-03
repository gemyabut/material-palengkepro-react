import React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { DENOM_CONFIG } from "./DenominationBreakdown";

// Unit 54 Phase 3 (DEC-066) — read-only comparison of collector-declared vs
// cashier-counted denomination. Purely informational: the sum invariant is
// already enforced server-side (Phase 1 CashierIntake.clean()) against
// collector_submitted_claim, not against this per-denomination breakdown —
// this table has no override/write path, it just helps the Cashier spot
// where a recount disagrees with what the collector declared.
function varianceChip(delta) {
  const label = delta === 0 ? "0" : `${delta > 0 ? "+" : ""}${delta}`;
  const abs = Math.abs(delta);
  const color = abs === 0 ? "success" : abs <= 20 ? "warning" : "error";
  return <Chip label={label} color={color} size="small" />;
}

// eslint-disable-next-line react/prop-types
export default function DenominationCompareTable({ declaredFields, actualFields }) {
  const declared = declaredFields || {};
  const actual = actualFields || {};

  const anyDeclared = DENOM_CONFIG.some(
    (d) => parseInt(declared[`collector_declared_${d.field}`] || 0, 10) > 0
  );
  if (!anyDeclared) return null;

  return (
    <MDBox mt={2}>
      <MDTypography variant="subtitle2" fontWeight="medium" mb={1}>
        Collector-Declared vs. Counted
      </MDTypography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Denomination</TableCell>
            <TableCell align="right">Declared</TableCell>
            <TableCell align="right">Counted</TableCell>
            <TableCell align="right">Variance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {DENOM_CONFIG.map((d) => {
            const declaredCount = parseInt(declared[`collector_declared_${d.field}`] || 0, 10);
            const actualCount = parseInt(actual[d.field] || 0, 10);
            const delta = actualCount - declaredCount;
            return (
              <TableRow key={d.field}>
                <TableCell>{d.label}</TableCell>
                <TableCell align="right">{declaredCount}</TableCell>
                <TableCell align="right">{actualCount}</TableCell>
                <TableCell align="right">{varianceChip(delta)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </MDBox>
  );
}
