import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext, PROMPT_REQUIRED } from '../AuthContext';
import { fetchGoogle } from '../utils/google';

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
  const { ensureValidToken, setNeedsReAuth, token } = useContext(AuthContext);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false); // Initial state should be false or true based on initial fetch
  const [error, setError] = useState(null);

  const refreshPages = useCallback(async () => {
    if (!sheetId || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const res = await fetchGoogle(`spreadsheets/${sheetId}/values:batchGet`, token, ensureValidToken, {
        ranges: [`PAGES!A:Z`],
      });
      console.log('usePagesData: API response', res);

      if (res.status === 404 || (res.error && (res.error.code === 404 || (res.error.code === 400 && res.error.message.includes("Unable to parse range"))))) {
        console.warn("'PAGES' sheet does not exist or is inaccessible. Using empty pages list.");

      } else if (res.valueRanges && res.valueRanges[0] && res.valueRanges[0].values) {
        const [header, ...rows] = res.valueRanges[0].values;
        if (!header || rows.length === 0) {
          setPages([]);
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
      if (e === PROMPT_REQUIRED) {
        setNeedsReAuth(true); // show dialog
        return;
      }
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [sheetId, token, setNeedsReAuth]);

  useEffect(() => {
    if (sheetId) {
      refreshPages();
    }
  }, [sheetId, refreshPages, token]);

  return { pages, loading, error, refreshPages };
};

export { usePagesData };
