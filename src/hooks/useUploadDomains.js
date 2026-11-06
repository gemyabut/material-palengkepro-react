import { useEffect, useState } from "react";
import { getMyUploadDomains } from "api/csvImport";

// The upload domains the SERVER will accept from the signed-in user
// (GET /csv-import/my-domains/). The screens show only these. If the list
// can't load, the answer is "none" (fail closed), never a guess from the role.
// One request per sign-in: cached by access token, so every screen that asks
// shares it and a different user never sees the previous user's list.
let cache = { token: null, promise: null };

function currentToken() {
  try {
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || "";
  } catch {
    return "";
  }
}

function fetchDomains() {
  const token = currentToken();
  if (!token) return Promise.resolve([]);
  if (cache.token !== token || !cache.promise) {
    const promise = getMyUploadDomains().catch(() => {
      if (cache.promise === promise) cache = { token: null, promise: null }; // retry next time
      return [];
    });
    cache = { token, promise };
  }
  return cache.promise;
}

export default function useUploadDomains() {
  const [state, setState] = useState({ domains: [], loading: true });

  useEffect(() => {
    let alive = true;
    fetchDomains().then((domains) => {
      if (alive) setState({ domains, loading: false });
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
