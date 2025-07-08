import { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';

/**
 * Returns Drive spreadsheets the signed-in user can at least read.
 * Drive scope: drive.metadata.readonly
 */
export function useDriveSheets() {
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSheets() {
      try {
        await gapi.client.load('drive', 'v3');

        const res = await gapi.client.drive.files.list({
          pageSize: 100,
          fields: 'files(id,name,owners(displayName))',
          q:
            "mimeType='application/vnd.google-apps.spreadsheet' " + // Sheets only
            "and ('me' in owners or 'me' in readers or 'me' in writers)",
        }); // :contentReference[oaicite:1]{index=1}

        setSheets(res.result.files ?? []);
      } catch (e) {
        console.error(e);
        setError(e);
      } finally {
        setLoading(false);
      }
    }

    fetchSheets();
  }, []);

  return { sheets, loading, error };
}
