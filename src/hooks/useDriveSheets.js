import { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../AuthContext';
import { toProjectName } from '../utils/id';

export function useDriveSheets() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, isGapiClientReady } = useContext(AuthContext);

  const fetchSheets = useCallback(async () => {
    if (!token || !isGapiClientReady || !window.gapi || !window.gapi.client || !window.gapi.client.drive) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
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
      console.error(e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [token, isGapiClientReady]);

  useEffect(() => {
    if (isGapiClientReady) {
      fetchSheets();
    }
  }, [isGapiClientReady, fetchSheets]);

  return { sheets, loading, error, fetchSheets };
}
