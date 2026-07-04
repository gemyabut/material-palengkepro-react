// src/layouts/tenants/components/TenantTable.js — Unit 28
// 8-column tenant list: TEN-ID, Name/Business, Mobile, Status, Verification, Leases, Balance, Actions
// Search (300ms debounce) + sort dropdown live in the toolbar above the table.
import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PropTypes from "prop-types";
import { canEdit, canBulk } from "../../leases/utils/roleUtils";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CHIP = {
  ACTIVE:      { label: 'Active',      color: 'success' },
  INACTIVE:    { label: 'Inactive',    color: 'default' },
  DELINQUENT:  { label: 'Delinquent',  color: 'warning' },
  BLACKLISTED: { label: 'Blacklisted', color: 'error'   },
};

const VERIFICATION_CHIP = {
  VERIFIED:   { label: 'Verified',   color: 'success' },
  PENDING:    { label: 'Pending',    color: 'warning' },
  UNVERIFIED: { label: 'Unverified', color: 'default' },
  REJECTED:   { label: 'Rejected',   color: 'error'   },
};

function formatBalance(val) {
  const n = parseFloat(val) || 0;
  return '₱' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const SORT_OPTIONS = [
  { value: 'full_name',            label: 'Name (A → Z)' },
  { value: '-full_name',           label: 'Name (Z → A)' },
  { value: 'tenant_id',            label: 'TEN-ID (ascending)' },
  { value: 'status',               label: 'Status' },
  { value: '-outstanding_balance', label: 'Balance (High → Low)' },
  { value: '-active_lease_count',  label: 'Active Leases (Most)' },
  { value: '-last_updated',        label: 'Recently Updated' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TenantTable({
  tenants,
  user,
  showCheckbox,
  selectedIds,
  onSelect,
  onSelectAll,
  onView,
  onEdit,
  onDeactivate,
  search,
  onSearchChange,
  ordering,
  onOrderingChange,
}) {
  const [inputVal, setInputVal] = useState(search ?? '');
  const debounceRef = useRef(null);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setInputVal(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange?.(val), 300);
  };

  const colSpan = showCheckbox ? 9 : 8;

  return (
    <Box>
      {/* Toolbar */}
      <Stack direction="row" spacing={2} alignItems="center" px={2} pt={2} pb={1}>
        <TextField
          size="small"
          placeholder="Search tenants…"
          value={inputVal}
          onChange={handleSearchInput}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 210 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={ordering ?? 'full_name'}
            label="Sort by"
            onChange={(e) => onOrderingChange?.(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {showCheckbox && (
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={tenants.length > 0 && selectedIds.length === tenants.length}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                  />
                </TableCell>
              )}
              <TableCell sx={{ fontWeight: 600, width: 110 }}>TEN-ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name / Business</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 140 }}>Mobile</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 110 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>Verification</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 70 }} align="center">Leases</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 120 }} align="right">Balance</TableCell>
              <TableCell sx={{ width: 130 }} />
            </TableRow>
          </TableHead>

          <TableBody>
            {tenants.map((t) => {
              const statusMeta = STATUS_CHIP[t.status] || { label: t.status, color: 'default' };
              const kycMeta    = VERIFICATION_CHIP[t.verification_status] || { label: t.verification_status, color: 'default' };
              const balance    = parseFloat(t.outstanding_balance) || 0;

              return (
                <TableRow key={t.id} hover>
                  {showCheckbox && (
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(t.id)}
                        onChange={(e) =>
                          onSelect?.(
                            e.target.checked
                              ? [...selectedIds, t.id]
                              : selectedIds.filter((id) => id !== t.id)
                          )
                        }
                      />
                    </TableCell>
                  )}

                  <TableCell>
                    <Typography variant="caption" fontWeight="medium" sx={{ fontFamily: 'monospace' }}>
                      {t.tenant_id || '—'}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight="medium" lineHeight={1.2}>
                      {t.full_name}
                    </Typography>
                    {t.business_name && t.business_name !== t.full_name && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t.business_name}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{t.mobile_phone || '—'}</Typography>
                  </TableCell>

                  <TableCell>
                    <Chip size="small" label={statusMeta.label} color={statusMeta.color} />
                  </TableCell>

                  <TableCell>
                    <Chip size="small" label={kycMeta.label} color={kycMeta.color} />
                  </TableCell>

                  <TableCell align="center">
                    <Typography variant="body2">{t.active_lease_count ?? 0}</Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={balance > 0 ? 'bold' : 'normal'}
                      color={balance > 0 ? 'error' : 'text.primary'}
                    >
                      {formatBalance(t.outstanding_balance)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Button size="small" onClick={() => onView?.(t.id)}>View</Button>
                      {canEdit(user) && onEdit && (
                        <Button size="small" onClick={() => onEdit(t.id)}>Edit</Button>
                      )}
                      {canBulk(user) && onDeactivate && (
                        <Button size="small" color="error" onClick={() => onDeactivate(t.id)}>
                          Off
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}

            {tenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No tenants found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

TenantTable.propTypes = {
  tenants: PropTypes.arrayOf(PropTypes.object),
  user: PropTypes.shape({ role: PropTypes.string }),
  showCheckbox: PropTypes.bool,
  selectedIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])),
  onSelect: PropTypes.func,
  onSelectAll: PropTypes.func,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDeactivate: PropTypes.func,
  search: PropTypes.string,
  onSearchChange: PropTypes.func,
  ordering: PropTypes.string,
  onOrderingChange: PropTypes.func,
};

TenantTable.defaultProps = {
  tenants: [],
  showCheckbox: false,
  selectedIds: [],
};
