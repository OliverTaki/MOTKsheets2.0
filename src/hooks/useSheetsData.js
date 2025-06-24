import { useEffect, useState } from 'react';

export default function useSheetsData() {
  const [shots, setShots] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);

  const apiKey  = import.meta.env.VITE_SHEETS_API_KEY;
  const sheetId = import.meta.env.VITE_SHEETS_ID;

  useEffect(() => {
    if (!apiKey || !sheetId) return;

    const range = 'Sheet1!A1:Z';
    const url   =
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (!json.values) return;
        const [header, ...rows] = json.values;

        setFields(
          header.map((h: string) => ({
            field_id: h,
            field_name: h.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          })),
        );

        setShots(
          rows.map((row: string[]) =>
            header.reduce((obj: any, key: string, i: number) => ({ ...obj, [key]: row[i] }), {}),
          ),
        );
      })
      .catch(console.error);
  }, [apiKey, sheetId]);

  return { shots, fields };
}
