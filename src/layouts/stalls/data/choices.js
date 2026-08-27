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
  // Part 6 (2026-08-27): missing since PR #93 added it backend-side
  // (stalls/models.py Stall.CommerceType.SERVICE) — without this entry the
  // Type dropdown can't select/display SERVICE-type stalls (parking, dental,
  // repair, etc.) and their subtypes would be unreachable in the paired UI.
  { value: "SERVICE", label: "Service (parking, CR, repair, dental, etc.)" },
  { value: "OTHER", label: "Other" },
];

export const LEASE_MODEL_CHOICES = [
  { value: "PERMANENT", label: "Permanent" },
  { value: "AMBULANT", label: "Ambulant / Roving" },
  { value: "DAY", label: "Day / Weekly" },
  { value: "SEASONAL", label: "Seasonal" },
  // Part 6 (2026-08-27): missing since PR #93 added it backend-side
  // (stalls/models.py Stall.LeaseModel.NON_REVENUE).
  { value: "NON_REVENUE", label: "Non-Revenue (internal operations)" },
];

// Legacy alias — kept so any still-existing code importing STALL_TYPE_CHOICES doesn't break
export const STALL_TYPE_CHOICES = COMMERCE_TYPE_CHOICES;

export const FLOOR_LEVEL_CHOICES = [
  { value: "GROUND", label: "Ground Floor" },
  { value: "MEZZANINE", label: "Mezzanine" },
  { value: "SECOND_FLOOR", label: "Second Floor" },
  { value: "THIRD_FLOOR", label: "Third Floor" },
  { value: "BASEMENT", label: "Basement" },
  { value: "ROOFTOP", label: "Rooftop" },
];

export const FRONTAGE_TYPE_CHOICES = [
  { value: "CORNER", label: "Corner" },
  { value: "MIDBLOCK", label: "Midblock" },
  { value: "END", label: "End of Row" },
  { value: "AISLE_FACING", label: "Aisle-Facing" },
  { value: "ENTRANCE_FACING", label: "Entrance-Facing" },
];

// commerce_subtype is NOT cross-validated against commerce_type backend-side
// (csv_import/validators.py checks it against the flat CommerceSubtype set
// only) -- this grouping is transcribed from the comment-delimited blocks in
// stalls/models.py::Stall.CommerceSubtype, which map 1:1 to CommerceType.
// It's a UX filter only, not an enforced constraint.
export const COMMERCE_SUBTYPE_BY_TYPE = {
  FISH: [
    { value: "FRESHWATER_FISH", label: "Freshwater Fish" },
    { value: "SALTWATER_FISH", label: "Saltwater Fish" },
    { value: "SHELLFISH", label: "Shellfish" },
    { value: "SQUID_OCTOPUS", label: "Squid / Octopus" },
  ],
  MEAT: [
    { value: "PORK", label: "Pork" },
    { value: "BEEF", label: "Beef" },
    { value: "CHICKEN", label: "Chicken / Poultry" },
    { value: "GOAT", label: "Goat" },
    { value: "PROCESSED_MEAT", label: "Processed Meat (tocino, longganisa, etc.)" },
  ],
  VEGETABLES_FRUITS: [
    { value: "LEAFY_GREENS", label: "Leafy Greens" },
    { value: "ROOT_CROPS", label: "Root Crops" },
    { value: "TROPICAL_FRUITS", label: "Tropical Fruits" },
    { value: "TEMPERATE_FRUITS", label: "Temperate Fruits" },
  ],
  COOKED_FOOD: [
    { value: "CARINDERIA", label: "Carinderia (Filipino turo-turo)" },
    { value: "FOOD_COURT", label: "Food Court" },
    { value: "STREET_FOOD", label: "Street Food" },
    { value: "PASTRY_BAKED", label: "Pastry / Baked Goods" },
    { value: "BEVERAGES", label: "Beverages" },
    { value: "NIGHT_FOOD_MARKET", label: "Night Food Market (NFM)" },
  ],
  DRY_GOODS: [
    { value: "RICE", label: "Rice" },
    { value: "GRAINS_CEREALS", label: "Grains / Cereals" },
    { value: "SPICES_CONDIMENTS", label: "Spices / Condiments" },
  ],
  SARI_SARI: [
    { value: "GENERAL_VARIETY", label: "General Variety" },
    { value: "SPECIALTY", label: "Specialty" },
  ],
  BAGSAKAN: [
    { value: "WHOLESALE_PRODUCE", label: "Wholesale Produce" },
    { value: "WHOLESALE_FISH", label: "Wholesale Fish" },
    { value: "WHOLESALE_MEAT", label: "Wholesale Meat" },
  ],
  NON_FOOD: [
    { value: "RTW", label: "Ready-to-Wear" },
    { value: "THRIFT", label: "Thrift / Ukay-ukay" },
    { value: "HARDWARE", label: "Hardware" },
    { value: "ELECTRONICS", label: "Electronics" },
    { value: "COSMETICS", label: "Cosmetics" },
    { value: "TOYS", label: "Toys" },
    { value: "KITCHENWARE", label: "Kitchenware / Houseware" },
    { value: "BOOKS_STATIONERY", label: "Books / Stationery" },
    { value: "FOOTWEAR", label: "Footwear" },
  ],
  SERVICE: [
    { value: "PARKING", label: "Parking Area" },
    { value: "COMFORT_ROOM", label: "Comfort Room" },
    { value: "MOBILE_REPAIR", label: "Mobile / Electronics Repair" },
    { value: "WATCH_REPAIR", label: "Watch Repair" },
    { value: "DENTAL", label: "Dental Clinic" },
    { value: "MEDICAL", label: "Medical Clinic" },
    { value: "LAUNDRY", label: "Laundry Service" },
    { value: "BARBER_SALON", label: "Barber / Salon" },
    { value: "SANITARY", label: "Sanitary Supplies" },
    { value: "ENTERTAINMENT", label: "Entertainment (Arcade / KTV)" },
  ],
  OTHER: [
    { value: "ADMINISTRATIVE", label: "Administrative" },
    { value: "STORAGE", label: "Storage" },
    { value: "TRANSIT_TERMINAL", label: "Transit Terminal" },
  ],
};
