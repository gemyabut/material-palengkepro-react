import React from "react";
import { useNavigate } from "react-router-dom";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";

const peso = (v) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const COLS = [
  { key: "full_name",        label: "Tenant"       },
  { key: "stall",            label: "Stall"        },
  { key: "current",          label: "Current"      },
  { key: "d31_60",           label: "31–60"        },
  { key: "d61_90",           label: "61–90"        },
  { key: "d90_plus",         label: "90+"          },
  { key: "past_due_over_30", label: "Past Due >30" },
  { key: "total",            label: "Total"        },
];

const AMOUNT_KEYS = new Set(["current","d31_60","d61_90","d90_plus","past_due_over_30","total"]);

export default function AgingBucketTable({ rows, pastDueOnly }) {
  const navigate = useNavigate();

  const displayRows = pastDueOnly
    ? rows.filter((r) => Number(r.past_due_over_30 ?? 0) > 0)
    : rows;

  if (!displayRows || displayRows.length === 0) {
    return (
      <MDBox p={2}>
        <MDTypography variant="body2" color="secondary">
          No outstanding balances{pastDueOnly ? " past 30 days" : ""}.
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            {COLS.map((c) => (
              <TableCell
                key={c.key}
                align={AMOUNT_KEYS.has(c.key) ? "right" : "left"}
                sx={{ fontWeight: "bold", whiteSpace: "nowrap" }}
              >
                {c.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {displayRows.map((row) => {
            const isPastDue = Number(row.past_due_over_30 ?? 0) > 0;
            return (
              <TableRow
                key={row.tenant_id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/tenant-inquiry?tenant_id=${row.tenant_id}`)}
              >
                {COLS.map((c) => (
                  <TableCell
                    key={c.key}
                    align={AMOUNT_KEYS.has(c.key) ? "right" : "left"}
                    sx={
                      c.key === "past_due_over_30" && isPastDue
                        ? { color: "error.main", fontWeight: "bold" }
                        : {}
                    }
                  >
                    {AMOUNT_KEYS.has(c.key) ? peso(row[c.key]) : (row[c.key] || "—")}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
