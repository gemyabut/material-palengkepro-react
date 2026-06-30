import PropTypes from "prop-types";
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";

const ACTIONS = [
  { value: "upsert",        label: "UPSERT — create or update (default)" },
  { value: "create",        label: "CREATE — insert new only; error on duplicate key" },
  { value: "skip-existing", label: "SKIP-EXISTING — insert new; silently skip duplicates" },
];

function ActionPicker({ value, onChange }) {
  return (
    <FormControl>
      <FormLabel>Action (row behavior)</FormLabel>
      <RadioGroup value={value} onChange={(e) => onChange(e.target.value)}>
        {ACTIONS.map((a) => (
          <FormControlLabel
            key={a.value}
            value={a.value}
            control={<Radio size="small" />}
            label={a.label}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}

ActionPicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ActionPicker;
