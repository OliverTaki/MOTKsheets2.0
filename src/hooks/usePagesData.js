import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../AuthContext';

const spreadsheetId = import.meta.env.VITE_SHEETS_ID;
const apiKey = import.meta.env.VITE_SHEETS_API_KEY;

const safeJsonParse = (jsonString, defaultValue) => {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse JSON:", jsonString, e);
    return defaultValue;
  }
};

const usePagesData = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  const refreshPages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const range = 'PAGES!A:H';
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      const [header, ...rows] = data.values || [];
      
      if (!header || !rows) {
        setPages([]);
        setLoading(false);
        return;
      }

      const pageIdCol = header.indexOf('page_id');
      const titleCol = header.indexOf('title');
      const columnWidthsCol = header.indexOf('columnWidths');
      const columnOrderCol = header.indexOf('columnOrder');
      const filterSettingsCol = header.indexOf('filterSettings');
      const visibleFieldIdsCol = header.indexOf('visibleFieldIds');
      const sortOrderCol = header.indexOf('sortOrder');
      const authorCol = header.indexOf('author');

      const parsedPages = rows.reduce((acc, row) => {
        const page = {};
        try {
          page.page_id = row[pageIdCol];
          page.title = row[titleCol];
          page.columnWidths = safeJsonParse(row[columnWidthsCol], {});
          page.columnOrder = safeJsonParse(row[columnOrderCol], []);
          page.filterSettings = safeJsonParse(row[filterSettingsCol], {});
          page.visibleFieldIds = safeJsonParse(row[visibleFieldIdsCol], []);
          page.sortOrder = safeJsonParse(row[sortOrderCol], {});
          page.author = row[authorCol] || 'Unknown';

          if (page.page_id) {
            acc.push(page);
          }
        } catch (e) {
          console.error("Skipping corrupted page data:", row, e);
        }
        return acc;
      }, []);
      
      setPages(parsedPages);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if(token) {
      refreshPages();
    }
  }, [token, refreshPages]);

  return { pages, loading, refreshPages };
};

export default usePagesData;
