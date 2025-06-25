import { useEffect, useState } from 'react';

export default function usePagesData() {
  const [pages, setPages] = useState([]);

  const apiKey  = import.meta.env.VITE_SHEETS_API_KEY;
  const sheetId = import.meta.env.VITE_SHEETS_ID;

  useEffect(() => {
    if (!apiKey || !sheetId) return;

    const range = 'PAGES!A1:D';
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

    fetch(url)
      .then(r => r.json())
      .then(({ values }) => {
        if (!values) return;
        const [header, ...rows] = values;
        const col = (k) => header.indexOf(k);

        const list = rows.map((r) => {
          const raw = r[col('filter_json')] || '{}';
          let obj = {};
          try { obj = JSON.parse(raw); }
          catch (e) { console.error('Bad JSON:', raw, e); }
          return {
            page_id : r[col('page_id')],
            title   : r[col('title')],
            filters : obj,
          };
        });

        /* デバッグ用に globalThis.pages に置く */
        globalThis.pages = list;
        console.log('PAGES loaded:', list);

        setPages(list);
      })
      .catch(console.error);
  }, [apiKey, sheetId]);

  return pages;
}
