/**
 * Market Admin contact card — Task #115 item 4.
 *
 * Read-only, persistent-chrome display of the tenant's market's first
 * active market_administrator (name/phone/email/address). Renders in
 * PortalLayout's footer (dashboard/SOA/payments) and standalone on
 * change-password.js (which uses its own layout — see that file).
 *
 * Per-field empty state: skips any missing sub-field. If no contact at
 * all (no market, or no active market_administrator), shows a single
 * fallback line instead.
 */
import PropTypes from "prop-types";
import { Stack, Typography } from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";

export default function MarketAdminContactCard({ contact }) {
  if (!contact) {
    return (
      <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mt={1}>
        Market admin contact not available
      </Typography>
    );
  }

  return (
    <Stack
      direction="row"
      spacing={2}
      justifyContent="center"
      flexWrap="wrap"
      sx={{ mt: 1 }}
    >
      {contact.name && (
        <Typography variant="caption" color="text.secondary">
          {contact.name}
        </Typography>
      )}
      {contact.phone && (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <PhoneIcon sx={{ fontSize: 14 }} color="disabled" />
          <Typography variant="caption" color="text.secondary">
            {contact.phone}
          </Typography>
        </Stack>
      )}
      {contact.email && (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <EmailIcon sx={{ fontSize: 14 }} color="disabled" />
          <Typography variant="caption" color="text.secondary">
            {contact.email}
          </Typography>
        </Stack>
      )}
      {contact.address && (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <LocationOnIcon sx={{ fontSize: 14 }} color="disabled" />
          <Typography variant="caption" color="text.secondary">
            {contact.address}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

MarketAdminContactCard.propTypes = {
  contact: PropTypes.shape({
    name: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    address: PropTypes.string,
  }),
};

MarketAdminContactCard.defaultProps = {
  contact: null,
};
