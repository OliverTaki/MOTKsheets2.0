import { useEffect, useState } from 'react';

/**
 * PAGESシートから、保存されたビュー（ページ）の一覧を取得するフック
 */
export default function usePagesData() {
  const [pages, setPages] = useState([]);
  const apiKey  = import.meta.env.VITE_SHEETS_API_KEY;
  const sheetId = import.meta.env.VITE_SHEETS_ID;

  useEffect(() => {
    if (!apiKey || !sheetId) return;

    const range = 'PAGES!A1:C'; // page_id, title, settings_json
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

    fetch(url)
      .then(r => r.json())
      .then(({ values }) => {
        if (!values) return;
        const [header, ...rows] = values;
        const pageIdCol = header.indexOf('page_id');
        const titleCol = header.indexOf('title');
        const settingsCol = header.indexOf('settings_json');

        const list = rows.map((row) => {
          const rawSettings = row[settingsCol] || '{}';
          let settings = { filters: [], sort: {} };
          try {
            const parsed = JSON.parse(rawSettings);
            // 過去のデータ形式にも対応
            if (parsed.filters) {
              settings = { ...settings, ...parsed };
            } else {
              // 古い形式(filter_json)の場合
              settings.filters = Object.entries(parsed).map(([field_id, value]) => ({
                id: field_id, field_id, operator: 'is', value
              }));
            }
          }
          catch (e) {
            console.error('Failed to parse page settings JSON:', rawSettings, e);
          }
          return {
            page_id: row[pageIdCol],
            title:   row[titleCol],
            settings,
          };
        });
        setPages(list);
      })
      .catch(console.error);
  }, [apiKey, sheetId]);

  return pages;
}
