import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../AuthContext';

const safeJsonParse = (jsonString, defaultValue) => {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error(`Failed to parse JSON for value: "${jsonString}". Error:`, e);
    return defaultValue;
  }
};

const usePagesData = (sheetId) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false); // Initial state should be false or true based on initial fetch
  const [error, setError] = useState(null);
  const { isGapiClientReady, ensureValidToken } = useContext(AuthContext);

  const refreshPages = useCallback(async (retried = false) => {
    if (!isGapiClientReady || !sheetId || !window.gapi || !window.gapi.client || !window.gapi.client.sheets) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      await ensureValidToken(); // Ensure valid token before making the request

      const res = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'PAGES!A:H',
      });

      if (res.status === 404 || (res.result.error && (res.result.error.code === 404 || (res.result.error.code === 400 && res.result.error.message.includes("Unable to parse range"))))) {
        console.warn("'PAGES' sheet does not exist or is inaccessible. Using empty pages list.");

      } else if (res.result.values) {
        const [header, ...rows] = res.result.values;
        if (!header || rows.length === 0) {
  
        } else {
          const pageIdCol = header.indexOf('page_id');
          const titleCol = header.indexOf('title');
          const columnWidthsCol = header.indexOf('columnWidths');
          const columnOrderCol = header.indexOf('columnOrder');
          const filterSettingsCol = header.indexOf('filterSettings');
          const visibleFieldIdsCol = header.indexOf('visibleFieldIds');
          const sortOrderCol = header.indexOf('sortOrder');
          const authorCol = header.indexOf('author');

          const parsedPages = rows.reduce((acc, row) => {
            try {
              const page = {
                page_id: row[pageIdCol],
                title: row[titleCol],
                columnWidths: safeJsonParse(row[columnWidthsCol], {}),
                columnOrder: safeJsonParse(row[columnOrderCol], []),
                filterSettings: safeJsonParse(row[filterSettingsCol], {}),
                visibleFieldIds: safeJsonParse(row[visibleFieldIdsCol], []),
                sortOrder: safeJsonParse(row[sortOrderCol], {}),
                author: row[authorCol] || 'Unknown',
              };
              if (page.page_id) {
                acc.push(page);
              }
            } catch (e) {
              console.error("Skipping corrupted page data:", row, e);
            }
            return acc;
          }, []);
          setPages(parsedPages);
        }
      }
    } catch (e) {
      console.error('refreshPages: Caught error:', e);
      if (e.status === 401 && !retried) {
        console.warn("401 Unauthorized, attempting to refresh token and retry...");
        try {
          await ensureValidToken(); // Attempt to get a new token
          return refreshPages(true); // Retry the fetch
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
  }, [isGapiClientReady, sheetId, ensureValidToken]);

  useEffect(() => {
    if (isGapiClientReady) {
      refreshPages();
    }
  }, [isGapiClientReady, refreshPages]);

  return { pages, loading, error, refreshPages };
};

export { usePagesData };
