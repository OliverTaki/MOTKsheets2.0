/**
 * Google Sheetsに新しい行を追加する
 * @param {object} params
 * @param {string} params.sheetId - スプレッドシートのID
 * @param {string} params.tabName - 対象のシート（タブ）名
 * @param {string} params.token - 認証トークン
 * @param {Array<any>} params.values - 追加する行のデータ配列 (例: ['value1', 'value2'])
 */
export async function appendRow({ sheetId, tabName, ensureValidToken, values }, retried = false) {
  if (!sheetId) throw new Error('sheetId required');
  if (!tabName) throw new Error('tabName required');
  if (!values) throw new Error('values required');

  try {
    await ensureValidToken();

    const res = await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${tabName}!A1`, // A1を指定すると最終行に追記される
      valueInputOption: 'USER_ENTERED',
      resource: { values: [values] }, // APIは2次元配列を要求する
    });

    if (!res.result) {
      if (res.status === 401 && !retried) {
        console.warn("401 Unauthorized in appendRow, attempting to refresh token and retry...");
        await ensureValidToken();
        return appendRow({ sheetId, tabName, ensureValidToken, values }, true); // Retry the append
      }
      throw new Error(res.error?.message || 'Failed to append row.');
    }

    return res.result;
  } catch (e) {
    console.error("Error in appendRow:", e);
    throw e;
  }
}
