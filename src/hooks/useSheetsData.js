import { useEffect, useState } from 'react';

export default function useSheetsData() {
  const [shots,  setShots]  = useState([]);
  const [fields, setFields] = useState([]);

  const apiKey   = import.meta.env.VITE_SHEETS_API_KEY;
  const sheetId  = import.meta.env.VITE_SHEETS_ID;
  const tabName  = import.meta.env.VITE_TAB_NAME || 'SHOTS';   // ← 追加

  useEffect(() => {
    if (!apiKey || !sheetId) return;

    const range = `${tabName}!A1:Z`;                           // ← 変更
    const url   =
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

    fetch(url)
      .then(r => r.json())
      .then(({ values }) => {
        if (!values) return;
        const [header, ...rows] = values;

        setFields(header.map(h => ({
          field_id:   h,
          field_name: h.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        })));

        setShots(rows.map((row, i) =>
          header.reduce(
            (o, key, col) => ({ ...o, [key]: row[col], __rowNum: i + 2 }),
            {},
          ),
        ));
      })
      .catch(console.error);
  }, [apiKey, sheetId, tabName]);

  return { shots, fields };
}
