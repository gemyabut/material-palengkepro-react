// src/layouts/profile/hooks/useProfile.js

import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../api/profileApi";

import axios from "../../../api/axios"; // ✅ Uses central axios instance
import { debugLog } from "../../stalls/utils/debug";

function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  debugLog("[useProfile] Loaded profile:", profile);

  // Fetch profile data from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get("/users/profile/");
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Save profile data to backend
  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const data = await updateProfile(profile); // ← Reuse
      setProfile(data);
      setSnackbar({ open: true, message: "Profile updated!", severity: "success" });
    } catch (err) {
      console.error("Failed to save profile:", err?.response?.data || err);
      setSnackbar({
        open: true,
        message: "Failed to update profile.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    setProfile, // ✅ Included
    loading,
    saving,
    handleSave,
    snackbar,
    setSnackbar,
  };
}

export default useProfile;
