import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../AuthContext';

const spreadsheetId = import.meta.env.VITE_SHEETS_ID;
const apiKey = import.meta.env.VITE_SHEETS_API_KEY;

const usePagesData = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state
  const { token } = useContext(AuthContext);

  const refreshPages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const range = 'PAGES!A:H'; // Update range to include author
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
      if (!header) {
        setPages([]);
        return;
      };

      const pageIdCol = header.indexOf('page_id');
      const titleCol = header.indexOf('title');
      const columnWidthsCol = header.indexOf('columnWidths');
      const columnOrderCol = header.indexOf('columnOrder');
      const filterSettingsCol = header.indexOf('filterSettings');
      const visibleFieldIdsCol = header.indexOf('visibleFieldIds');
      const sortOrderCol = header.indexOf('sortOrder');
      const authorCol = header.indexOf('author');

      const parsedPages = rows.map(row => ({
        page_id: row[pageIdCol],
        title: row[titleCol],
        columnWidths: JSON.parse(row[columnWidthsCol] || '{}'),
        columnOrder: JSON.parse(row[columnOrderCol] || '[]'),
        filterSettings: JSON.parse(row[filterSettingsCol] || '{}'),
        visibleFieldIds: JSON.parse(row[visibleFieldIdsCol] || '[]'),
        sortOrder: JSON.parse(row[sortOrderCol] || '{}'),
        author: row[authorCol] || 'Unknown',
      }));
      setPages(parsedPages);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshPages();
  }, [refreshPages]);

  return { pages, loading, refreshPages };
};

export default usePagesData;
