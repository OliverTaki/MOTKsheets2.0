import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../AuthContext';

const spreadsheetId = import.meta.env.VITE_SHEETS_ID;
const apiKey = import.meta.env.VITE_SHEETS_API_KEY;

const safeJsonParse = (jsonString, defaultValue) => {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error(`Failed to parse JSON for value: "${jsonString}". Error:`, e);
    return defaultValue;
  }
};

const usePagesData = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  const refreshPages = useCallback(async () => {
    console.log("refreshPages: Starting...");
    if (!token) {
      console.log("refreshPages: No token, setting loading to false.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const range = 'PAGES!A:H';
      console.log(`refreshPages: Fetching data from range: ${range}`);
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("refreshPages: Fetch response received.");

      const data = await response.json();
      console.log("refreshPages: Response data parsed.", data);

      if (!response.ok) {
        console.log("refreshPages: Response not OK.");
        // Check for specific Google Sheets API error for sheet not found (code 404 or 400 with specific message)
        if (data.error && (data.error.code === 404 || (data.error.code === 400 && data.error.message.includes("Unable to parse range")))) {
          console.warn("'PAGES' sheet does not exist or is inaccessible. Initializing with empty pages list.");
          setPages([]);
        } else {
          console.error('Error fetching pages data:', data);
          throw new Error(`Failed to fetch pages data: ${data.error.message}`);
        }
      } else {
        console.log("refreshPages: Response OK.");
        if (data.values) {
          console.log("refreshPages: Data values found.");
          const [header, ...rows] = data.values;
          if (!header || rows.length === 0) {
            console.log("refreshPages: No header or no rows, setting empty pages.");
            setPages([]);
          } else {
            console.log("refreshPages: Parsing pages data.");
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
            console.log("refreshPages: Pages parsed and set.", parsedPages);
          }
        } else {
          console.log("refreshPages: No data values found, setting empty pages.");
          setPages([]);
        }
      }
    } catch (error) {
      console.error('refreshPages: Caught error:', error);
      setPages([]); // Ensure pages is not left in an inconsistent state
    } finally {
      console.log("refreshPages: Finally block - setting loading to false.");
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      console.log("usePagesData useEffect: Token present, calling refreshPages.");
      refreshPages();
    } else {
      console.log("usePagesData useEffect: No token, setting loading to false.");
      setLoading(false); // Ensure loading state is resolved even without a token
    }
  }, [token, refreshPages]);

  return { pages, loading, refreshPages };
};

export default usePagesData;
