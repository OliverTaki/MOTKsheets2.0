import { fetchGoogle } from '../utils/google';

/**
 * Google Sheetsに新しい行を追加する
 * @param {object} params
 * @param {string} params.sheetId - スプレッドシートのID
 * @param {string} params.tabName - 対象のシート（タブ）名
 * @param {Array<any>} params.values - 追加する行のデータ配列 (例: ['value1', 'value2'])
 */
export async function appendRow({ sheetId, tabName, token, setNeedsReAuth, values, ensureValidToken }) {
  if (!sheetId) throw new Error('sheetId required');
  if (!tabName) throw new Error('tabName required');
  if (!values) throw new Error('values required');

  try {
    const res = await fetchGoogle(`spreadsheets/${sheetId}/values/${tabName}!A1:append`, token, ensureValidToken, {
      method: 'POST',
      params: { valueInputOption: 'USER_ENTERED' },
      body: { values: [values] }, // APIは2次元配列を要求する
    });

    return res;
  } catch (e) {
    console.error("Error in appendRow:", e);
    throw e;
  }
}
