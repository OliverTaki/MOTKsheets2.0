export async function fetchGoogle(endpoint, accessToken, params = {}) {
  const url = new URL(`https://sheets.googleapis.com/v4/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// 例: スプレッドシートのメタ情報取得
export function loadSpreadsheet(id, accessToken) {
  return fetchGoogle(`spreadsheets/${id}`, accessToken, {
    includeGridData: 'false',
  });
}