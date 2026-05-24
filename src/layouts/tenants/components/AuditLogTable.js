// src/layouts/tenants/components/AuditLogTable.js

import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
} from "@mui/material";
import PropTypes from "prop-types";
import { debugLog } from "../../stalls/utils/debug";

export default function AuditLogTable({ auditLogs = [] }) {
  debugLog("AuditLogTable render", { count: auditLogs.length });

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date/Time</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {auditLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{log.timestamp || "-"}</TableCell>
              <TableCell>{log.action || "-"}</TableCell>
              <TableCell>{log.user_name || "-"}</TableCell>
              <TableCell>
                {typeof log.details === "object" ? JSON.stringify(log.details) : log.details || "-"}
              </TableCell>
            </TableRow>
          ))}
          {auditLogs.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                No audit log entries found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

AuditLogTable.propTypes = {
  auditLogs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      timestamp: PropTypes.string,
      action: PropTypes.string,
      user_name: PropTypes.string,
      details: PropTypes.any,
    })
  ),
};

AuditLogTable.defaultProps = { auditLogs: [] };
