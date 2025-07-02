import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../AuthContext';

const spreadsheetId = import.meta.env.VITE_SHEETS_ID;
const apiKey = import.meta.env.VITE_SHEETS_API_KEY;

const usePagesData = () => {
  const [pages, setPages] = useState([]);
  const { token } = useContext(AuthContext);

  const refreshPages = useCallback(async () => {
    if (!token) return;
    try {
      const range = 'PAGES!A:G';
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
      if (!header) return;

      const pageIdCol = header.indexOf('page_id');
      const titleCol = header.indexOf('title');
      const columnWidthsCol = header.indexOf('columnWidths');
      const columnOrderCol = header.indexOf('columnOrder');
      const filterSettingsCol = header.indexOf('filterSettings');
      const visibleFieldIdsCol = header.indexOf('visibleFieldIds'); // Corrected property name
      const sortOrderCol = header.indexOf('sortOrder');

      const parsedPages = rows.map(row => ({
        page_id: row[pageIdCol],
        title: row[titleCol],
        columnWidths: JSON.parse(row[columnWidthsCol] || '{}'),
        columnOrder: JSON.parse(row[columnOrderCol] || '[]'),
        filterSettings: JSON.parse(row[filterSettingsCol] || '{}'),
        visibleFieldIds: JSON.parse(row[visibleFieldIdsCol] || '[]'), // Corrected property name
        sortOrder: JSON.parse(row[sortOrderCol] || '{}'),
      }));
      setPages(parsedPages);
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  }, [token]);

  useEffect(() => {
    refreshPages();
  }, [refreshPages]);

  return { pages, refreshPages };
};

export default usePagesData;
