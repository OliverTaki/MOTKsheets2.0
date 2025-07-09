export async function fetchGoogle(endpoint, accessToken, params = {}) {
  if (!accessToken) {
    throw new Error('No access token');
  }
  // drive/ で始まるときは Drive API、そうでなければ Sheets API
  const base =
    endpoint.startsWith('drive/')
      ? 'https://www.googleapis.com/'       // Drive API
      : 'https://sheets.googleapis.com/v4/'; // Sheets API

  const url = new URL(base + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('[Google API] HTTP', res.status, text);    // ★追加
    throw new Error(`HTTP ${res.status} – ${text}`);
  }
  return res.json();
}

// 例: スプレッドシートのメタ情報取得
export function loadSpreadsheet(id, accessToken) {
  return fetchGoogle(`spreadsheets/${id}`, accessToken, {
    includeGridData: 'false',
  });
}