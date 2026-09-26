import PropTypes from "prop-types";
import { Alert, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// MDU-014 (Heart QA 2026-09-26, BUGS.md BUG-113; Lead decision 2026-09-26) —
// one market per upload, set once, here in Step 1: a fixed label for a
// single-market user (their market can't be changed by picking a different
// one — see csv_import.market_resolution.resolve_upload_market), or a
// required dropdown scoped to the markets GET /csv-import/my-markets/
// returned for anyone with several markets or none (Octal/platform staff,
// an Owner with two markets).
function MarketStep({
  loading, mode, fixedMarket, markets, marketCode, onMarketCodeChange, locked, blockedMessage,
}) {
  return (
    <MDBox mb={3}>
      <MDTypography variant="h6" mb={1}>
        1. Market
      </MDTypography>
      {loading ? (
        <MDTypography variant="caption" color="text">Loading your markets…</MDTypography>
      ) : mode === "fixed" && fixedMarket ? (
        <MDTypography variant="button" fontWeight="medium">
          Market: {fixedMarket.name} ({fixedMarket.code})
        </MDTypography>
      ) : mode === "choose" ? (
        <FormControl size="small" required sx={{ minWidth: 280 }} disabled={locked}>
          <InputLabel id="upload-market-label">Market</InputLabel>
          <Select
            labelId="upload-market-label"
            label="Market"
            value={marketCode || ""}
            onChange={(e) => onMarketCodeChange(e.target.value)}
          >
            {markets.map((m) => (
              <MenuItem key={m.code} value={m.code}>
                {m.name} ({m.code})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : mode === "blocked" ? (
        <Alert severity="warning">
          {blockedMessage || "Your account has no assigned market — ask an administrator."}
        </Alert>
      ) : (
        <MDTypography variant="caption" color="text">—</MDTypography>
      )}
    </MDBox>
  );
}

MarketStep.propTypes = {
  loading: PropTypes.bool,
  mode: PropTypes.oneOf(["fixed", "choose", "blocked"]),
  fixedMarket: PropTypes.shape({ code: PropTypes.string, name: PropTypes.string }),
  markets: PropTypes.arrayOf(PropTypes.shape({ code: PropTypes.string, name: PropTypes.string })),
  marketCode: PropTypes.string,
  onMarketCodeChange: PropTypes.func.isRequired,
  locked: PropTypes.bool,
  blockedMessage: PropTypes.string,
};
MarketStep.defaultProps = {
  loading: false, mode: null, fixedMarket: null, markets: [], marketCode: "", locked: false,
  blockedMessage: "",
};

export default MarketStep;
