import { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext, PROMPT_REQUIRED } from '../AuthContext';
import { toProjectName } from '../utils/id';
import { fetchGoogle } from '../utils/google';

export function useDriveSheets() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { ensureValidToken, setNeedsReAuth, token } = useContext(AuthContext);

  const fetchSheets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchGoogle('drive/v3/files', token, {
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
  }, [token, setNeedsReAuth]);

  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  return { sheets, loading, error, fetchSheets };
}
