import { useEffect, useState } from 'react';

export default function useSheetsData() {
  const [shots, setShots] = useState([]);
  const [shotsHeader, setShotsHeader] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiKey = import.meta.env.VITE_SHEETS_API_KEY;
  const sheetId = import.meta.env.VITE_SHEETS_ID;

  const SHOTS_TAB_NAME = import.meta.env.VITE_TAB_NAME || 'SHOTS';
  const FIELDS_TAB_NAME = 'FIELDS';

  useEffect(() => {
    if (!apiKey || !sheetId) {
      setError('VITE_SHEETS_API_KEY or VITE_SHEETS_ID is not configured in .env file.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const shotsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${SHOTS_TAB_NAME}?key=${apiKey}`;
      const fieldsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${FIELDS_TAB_NAME}?key=${apiKey}`;

      try {
        const [shotsResponse, fieldsResponse] = await Promise.all([
          fetch(shotsUrl),
          fetch(fieldsUrl),
        ]);

        if (!shotsResponse.ok) {
          const errorBody = await shotsResponse.text();
          console.error("Error fetching SHOTS data from API:", errorBody);
          throw new Error(`Failed to fetch SHOTS data (${shotsResponse.status})`);
        }
        if (!fieldsResponse.ok) {
          const errorBody = await fieldsResponse.text();
          console.error("Error fetching FIELDS data from API:", errorBody);
          throw new Error(`Failed to fetch FIELDS data (${fieldsResponse.status})`);
        }

        const shotsData = await shotsResponse.json();
        const fieldsData = await fieldsResponse.json();

        if (fieldsData.values) {
          const [header, ...rows] = fieldsData.values;
          const newFields = rows.map(row => {
            const field = header.reduce((obj, key, index) => {
              obj[key] = row[index] || '';
              return obj;
            }, {});
            field.editable = field.editable === 'true';
            field.required = field.required === 'true';
            field.options = field.options ? field.options.split(',').map(s => s.trim()) : [];
            return field;
          });
          setFields(newFields);
        } else {
           setFields([]);
        }

        if (shotsData.values) {
          const [header, ...rows] = shotsData.values;
          setShotsHeader(header); // SHOTSシートのヘッダーを保存
          const newShots = rows.map((row, i) =>
            header.reduce(
              (obj, key, colIndex) => {
                obj[key] = row[colIndex];
                obj.__rowNum = i + 2; 
                return obj;
              },
              {}
            )
          );
          setShots(newShots);
        } else {
          setShots([]);
        }

      } catch (err) {
        console.error("Error details:", err);
        console.error("Attempted to fetch from:", { shotsUrl, fieldsUrl });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiKey, sheetId, SHOTS_TAB_NAME]);

  return { shots, shotsHeader, fields, loading, error };
}
