import { useEffect, useState } from 'react';
import { toBool }              from '../utils/parse.js';

/**
 * useSheetsData
 *  - Google Sheets API から SHOTS / FIELDS を並列取得
 *  - fields…  FIELDS シートの定義
 *  - shots …  SHOTS  シートのデータ
 *  - loading / error も返却
 */
export default function useSheetsData() {
  /* ---------- React state ---------- */
  const [fields, setFields] = useState([]);
  const [shots,  setShots]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  /* ---------- .env ---------- */
  const apiKey  = import.meta.env.VITE_SHEETS_API_KEY;
  const sheetId = import.meta.env.VITE_SHEETS_ID;
  const shotsTab   = import.meta.env.VITE_TAB_NAME || 'SHOTS';
  const fieldsTab  = 'FIELDS';

  /* ---------- fetch once ---------- */
  useEffect(() => {
    if (!apiKey || !sheetId) {
      setError('Missing VITE_SHEETS_API_KEY or VITE_SHEETS_ID.');
      setLoading(false);
      return;
    }

    const shotsURL  = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(shotsTab)}!A1:Z?key=${apiKey}`;
    const fieldsURL = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(fieldsTab)}!A1:Z?key=${apiKey}`;

    setLoading(true);
    Promise.all([
      fetch(shotsURL).then((r) => r.json()),
      fetch(fieldsURL).then((r) => r.json()),
    ])
      .then(([shotsJson, fieldsJson]) => {
        /* ---------- FIELDS ---------- */
        if (!fieldsJson.values) throw new Error('FIELDS sheet not found');
        const [fHeader, ...fRows] = fieldsJson.values;
        const idx = (key) => fHeader.indexOf(key);

        setFields(
          fRows.map((row) => ({
            field_id : row[idx('field_id')],
            field_name: row[idx('field_name')],
            type     : row[idx('type')],
            editable : toBool(row[idx('editable')]),
            required : toBool(row[idx('required')]),
            options  : (row[idx('options')] || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          })),
        );

        /* ---------- SHOTS ---------- */
        if (!shotsJson.values) throw new Error('SHOTS sheet not found');
        const [sHeader, ...sRows] = shotsJson.values;

        setShots(
          sRows.map((row, i) =>
            sHeader.reduce(
              (obj, key, col) => ({ ...obj, [key]: row[col] ?? '' }),
              { __rowNum: i + 2 },
            ),
          ),
        );

        setError('');
      })
      .catch((e) => setError(`Failed to fetch Sheets data: ${e.message}`))
      .finally(() => setLoading(false));
  }, [apiKey, sheetId, shotsTab]);

  return { shots, fields, loading, error };
}
