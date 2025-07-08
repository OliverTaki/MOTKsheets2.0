import { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import { toProjectName } from '../utils/id';

export function useDriveSheets() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isGapiClientReady, ensureValidToken } = useContext(AuthContext);

  const fetchSheets = useCallback(async (retried = false) => {
    if (!isGapiClientReady || !window.gapi || !window.gapi.client || !window.gapi.client.drive) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await ensureValidToken(); // Ensure valid token before making the request

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
        console.warn("401 Unauthorized, attempting to refresh token and retry...");
        try {
          await ensureValidToken(); // Attempt to get a new token
          return fetchSheets(true); // Retry the fetch
        } catch (refreshError) {
          console.error("Failed to refresh token during retry:", refreshError);
          setError(refreshError);
        }
      } else {
        setError(e);
      }
    } finally {
      setLoading(false);
    }
  }, [isGapiClientReady, ensureValidToken]);

  useEffect(() => {
    if (isGapiClientReady) {
      fetchSheets();
    }
  }, [isGapiClientReady, fetchSheets]);

  return { sheets, loading, error, fetchSheets };
}
