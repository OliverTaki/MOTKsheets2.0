import { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext, PROMPT_REQUIRED } from '../AuthContext';
import { toProjectName } from '../utils/id';
import { fetchGoogle } from '../utils/google';

export const useDriveSheets = (sheetId = null) => {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, ensureValidToken, setNeedsReAuth } = useContext(AuthContext);

  const fetchSheets = useCallback(async () => {
    if (!token) {
      setLoading(false);     // ★永遠に true にならないよう明示的に false
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGoogle('drive/v3/files', token, ensureValidToken, {
        pageSize: 100,
        fields: 'files(id,name,owners(displayName))',
        q:
          "mimeType='application/vnd.google-apps.spreadsheet' " +
          "and name contains 'MOTK[Project:' " +
          "and ('me' in owners or 'me' in readers or 'me' in writers)",
      });

      setSheets(res.files ?? []);
    } catch (e) {
      console.error("Error fetching sheets:", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [token, ensureValidToken, setNeedsReAuth]);

  useEffect(() => {
    fetchSheets();
  }, [token]);

  console.log('[useDriveSheets] called with', sheetId);

  return { sheets, loading, error, fetchSheets };
}