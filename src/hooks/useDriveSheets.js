import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';

export const toDisplayName = (file) =>
  file.appProperties?.projectName ?? file.name.replace(/^MOTK\s*/i, '');

/**
 * Returns Drive spreadsheets the signed-in user can at least read.
 * Drive scope: drive.metadata.readonly
 */
export function useDriveSheets() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, isGapiClientReady } = useContext(AuthContext);

  useEffect(() => {
    const fetchSheets = async () => {
      if (!token || !isGapiClientReady || !window.gapi || !window.gapi.client || !window.gapi.client.drive) {
        setLoading(false);
        return;
      }
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
    };

    if (token && isGapiClientReady) {
      fetchSheets();
    } else if (!token) {
      setLoading(false);
    }
  }, [token, isGapiClientReady]);

  return { sheets, loading, error };
}