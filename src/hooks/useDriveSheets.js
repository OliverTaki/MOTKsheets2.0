import { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext, PROMPT_REQUIRED } from '../AuthContext';
import { toProjectName } from '../utils/id';

export function useDriveSheets() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isGapiClientReady, ensureValidToken, setNeedsReAuth } = useContext(AuthContext);

  const fetchSheets = useCallback(async (retried = false) => {
    if (!isGapiClientReady || !window.gapi || !window.gapi.client || !window.gapi.client.drive) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = ensureValidToken(); // Ensure valid token before making the request
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await window.gapi.client.drive.files.list({
        pageSize: 100,
        fields: 'files(id,name,owners(displayName))',
        q:
          "mimeType='application/vnd.google-apps.spreadsheet' " +
          "and name contains 'MOTK[Project:' " +
          "and ('me' in owners or 'me' in readers or 'me' in writers)",
      });

      setSheets(res.result.files ?? []);
    } catch (e) {
      console.error("Error fetching sheets:", e);
      if (e.status === 401 && !retried) {
        setNeedsReAuth(true); // show dialog
        return;
      }
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [isGapiClientReady, ensureValidToken, setNeedsReAuth]);

  useEffect(() => {
    if (isGapiClientReady) {
      fetchSheets();
    }
  }, [isGapiClientReady, fetchSheets]);

  return { sheets, loading, error, fetchSheets };
}
