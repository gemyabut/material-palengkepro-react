import React, { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import { searchTenants } from "api/soa";

/**
 * SoaTenantPicker — SOA-scoped inline autocomplete.
 * NOT a shared TenantPicker; extract if a 2nd consumer appears (D4-A).
 *
 * Props:
 *   value: { tenant_id, full_name } | null
 *   onChange: (selection | null) => void
 */
export default function SoaTenantPicker({ value, onChange }) {
  const [inputText, setInputText] = useState(value?.full_name || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Sync display text when value is cleared externally
  useEffect(() => {
    if (!value) setInputText("");
  }, [value]);

  function handleInputChange(e) {
    const text = e.target.value;
    setInputText(text);
    onChange(null); // clear selection while typing

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const hits = await searchTenants(text.trim());
        setResults(hits);
        setOpen(hits.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  function handleSelect(tenant) {
    setInputText(tenant.full_name);
    setResults([]);
    setOpen(false);
    onChange({ tenant_id: tenant.tenant_id, full_name: tenant.full_name });
  }

  function handleClear() {
    setInputText("");
    setResults([]);
    setOpen(false);
    onChange(null);
  }

  return (
    <Box ref={containerRef} sx={{ position: "relative", minWidth: 260 }}>
      <TextField
        size="small"
        label="Tenant name"
        value={inputText}
        onChange={handleInputChange}
        autoComplete="off"
        sx={{ width: "100%" }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {searching && <CircularProgress size={16} />}
              {!searching && inputText && (
                <IconButton size="small" onClick={handleClear} tabIndex={-1}>
                  <Icon fontSize="small">close</Icon>
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        helperText={value ? `ID: ${value.tenant_id}` : "Type 2+ chars to search"}
      />
      {open && (
        <Paper
          elevation={4}
          sx={{ position: "absolute", zIndex: 1300, width: "100%", maxHeight: 240, overflow: "auto" }}
        >
          <List dense disablePadding>
            {results.map((t) => (
              <ListItemButton key={t.tenant_id} onMouseDown={() => handleSelect(t)}>
                <ListItemText
                  primary={t.full_name}
                  secondary={t.business_name || t.mobile_phone || undefined}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
