// src/layouts/tenants/components/ContactLogTable.js

import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Paper,
  TableContainer,
} from "@mui/material";
import PropTypes from "prop-types";
import { debugLog } from "../../stalls/utils/debug";
import { canEdit } from "../../leases/utils/roleUtils";

export default function ContactLogTable({ contactLogs = [], user, onAddLog }) {
  debugLog("ContactLogTable render", { count: contactLogs.length });

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Note</TableCell>
            <TableCell>Recorded By</TableCell>
            {canEdit(user) && <TableCell>Action</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {contactLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{log.date || "-"}</TableCell>
              <TableCell>{log.type || "-"}</TableCell>
              <TableCell>{log.note || "-"}</TableCell>
              <TableCell>{log.user_name || "-"}</TableCell>
              {canEdit(user) && <TableCell>{/* future actions */}</TableCell>}
            </TableRow>
          ))}
          {contactLogs.length === 0 && (
            <TableRow>
              <TableCell colSpan={canEdit(user) ? 5 : 4} align="center">
                No contact log entries found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {canEdit(user) && onAddLog && (
        <Button sx={{ mt: 1, ml: 2 }} variant="outlined" onClick={onAddLog}>
          Add Contact Log
        </Button>
      )}
    </TableContainer>
  );
}

ContactLogTable.propTypes = {
  contactLogs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      date: PropTypes.string,
      type: PropTypes.string,
      note: PropTypes.string,
      user_name: PropTypes.string,
    })
  ),
  user: PropTypes.object,
  onAddLog: PropTypes.func,
};

ContactLogTable.defaultProps = { contactLogs: [] };
