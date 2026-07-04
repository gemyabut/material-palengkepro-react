export const STATUS_CHOICES = [
  { value: "AVAILABLE", label: "Available" },
  { value: "OCCUPIED", label: "Occupied" },
  { value: "REPURPOSED", label: "Repurposed" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "INACTIVE", label: "Inactive" },
];

export const COMMERCE_TYPE_CHOICES = [
  { value: "FISH", label: "Fish" },
  { value: "MEAT", label: "Meat / Poultry" },
  { value: "DRY_GOODS", label: "Dry Goods" },
  { value: "VEGETABLES_FRUITS", label: "Vegetables / Fruits" },
  { value: "COOKED_FOOD", label: "Cooked Food / Carinderia" },
  { value: "SARI_SARI", label: "Sari-Sari / Variety" },
  { value: "BAGSAKAN", label: "Bagsakan / Bulk" },
  { value: "NON_FOOD", label: "Non-food" },
  { value: "OTHER", label: "Other" },
];

export const LEASE_MODEL_CHOICES = [
  { value: "PERMANENT", label: "Permanent" },
  { value: "AMBULANT", label: "Ambulant / Roving" },
  { value: "DAY", label: "Day / Weekly" },
  { value: "SEASONAL", label: "Seasonal" },
];

// Legacy alias — kept so any still-existing code importing STALL_TYPE_CHOICES doesn't break
export const STALL_TYPE_CHOICES = COMMERCE_TYPE_CHOICES;
