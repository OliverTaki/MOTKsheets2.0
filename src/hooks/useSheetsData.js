// src/hooks/useSheetsData.js  (V8 – auto‑retry after 401)

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

/**
 * fetchRangeWithRetry – Sheets GET with one automatic retry after silent
 * token refresh (handles expired / invalid tokens).
 */
async function fetchRangeWithRetry({ sheetId, range, token, refreshToken }) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    range
  )}`;

  const doRequest = async (bearer) =>
    fetch(url, {
      headers: { Authorization: `Bearer ${bearer}` },
    });

  // 1st try
  let res = await doRequest(token);
  if (res.status === 401 && refreshToken) {
    const ok = await refreshToken();
    if (ok) {
      // second try with new token
      res = await doRequest(sessionStorage.getItem('motk_access_token'));
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Sheets 401: ${body.error?.message || 'Unauthorized'}`);
  }
  const json = await res.json();
  return json.values || [];
}

export default function useSheetsData() {
  const { token, refreshToken } = useAuth();
  const sheetId = import.meta.env.VITE_SHEETS_ID;

  const [shots, setShots] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, f] = await Promise.all([
        fetchRangeWithRetry({
          sheetId,
          range: 'SHOTS!A1:Z',
          token,
          refreshToken,
        }),
        fetchRangeWithRetry({
          sheetId,
          range: 'FIELDS!A1:Z',
          token,
          refreshToken,
        }),
      ]);
      setShots(s);
      setFields(f);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return; // wait for sign‑in
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { shots, fields, loading, error, mutate: load };
}
