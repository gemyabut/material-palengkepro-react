import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Chip,
  Typography,
} from "@mui/material";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
const peso = (v) => `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

// Standalone, tenant-facing, read-only inquiry portal (IAM-3 interim).
// Open via a QR link (?t=<token>) or look up by mobile/email. No operator login/chrome.
export default function TenantPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  const load = useCallback(async (qs) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`${API_URL}/tenant/inquiry/?${qs}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || body.error_code || "Not found or not available.");
      setData(body);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // QR path: ?t=<token> in the URL → auto-load.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t");
    if (t) load(`t=${encodeURIComponent(t)}`);
  }, [load]);

  const lookup = () => {
    if (mobile.trim()) load(`mobile=${encodeURIComponent(mobile.trim())}`);
    else if (email.trim()) load(`email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Tenant Inquiry
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Scan your QR code, or look up your record with your mobile number or email.
      </Typography>

      {!data && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <TextField size="small" label="Mobile number" value={mobile}
                onChange={(e) => setMobile(e.target.value)} />
              <TextField size="small" label="Email" value={email}
                onChange={(e) => setEmail(e.target.value)} />
              <Button variant="contained" onClick={lookup} disabled={loading || (!mobile && !email)}>
                View my information
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {loading && <CircularProgress />}
      {error && <Alert severity="warning">{String(error)}</Alert>}

      {data && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5">{data.tenant.full_name}</Typography>
              <Chip size="small" label={data.tenant.status} />
            </Stack>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {[data.tenant.business_name, data.tenant.mobile_phone, data.tenant.email_address]
                .filter(Boolean)
                .join(" · ")}
            </Typography>

            <Alert severity="info" sx={{ my: 2 }}>
              Outstanding balance: <strong>{peso(data.balance?.outstanding)}</strong> ({data.balance?.note})
            </Alert>

            <Typography variant="h6">Leases</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Stall</TableCell><TableCell>Market</TableCell>
                  <TableCell>Status</TableCell><TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data.leases || []).map((l, i) => (
                  <TableRow key={i}>
                    <TableCell>{l.stall}</TableCell><TableCell>{l.market}</TableCell>
                    <TableCell>{l.status}</TableCell><TableCell align="right">{peso(l.lease_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {data.recent_payments?.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6">Recent payments</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell><TableCell>Receipt</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recent_payments.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>{p.date}</TableCell><TableCell>{p.receipt_number}</TableCell>
                        <TableCell align="right">{peso(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            <Button sx={{ mt: 2 }} onClick={() => setData(null)}>Look up another</Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
