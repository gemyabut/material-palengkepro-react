// src/layouts/profile/hooks/useProfile.js

// src/layouts/profile/hooks/useProfile.js

import { useAuth } from "context/AuthContext";
import { debugLog } from "../../stalls/utils/debug";

// This hook simply delegates to AuthContext.
// No direct API fetch—context manages loading and refreshing!
export default function useProfile() {
  const context = useAuth();
  debugLog("[useProfile] (via context) Profile loaded:", context.userProfile);
  return context;
}
