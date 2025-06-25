/**
 * Google Sheetsに新しい行を追加する
 * @param {object} params
 * @param {string} params.sheetId - スプレッドシートのID
 * @param {string} params.tabName - 対象のシート（タブ）名
 * @param {string} params.token - 認証トークン
 * @param {Array<any>} params.values - 追加する行のデータ配列 (例: ['value1', 'value2'])
 */
export async function appendRow({ sheetId, tabName, token, values }) {
  const range = `${tabName}!A1`; // A1を指定すると最終行に追記される
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const body = {
    values: [values], // APIは2次元配列を要求する
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.json();
    console.error('Failed to append row:', errorBody);
    throw new Error(errorBody.error.message || 'Could not append row to the sheet.');
  }

  return await res.json();
}
