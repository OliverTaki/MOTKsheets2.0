// src/api/updateCell.js – v2 (auth header & USER_ENTERED)
//--------------------------------------------------
/**
 * Update a single cell in Google Sheets.
 *
 * @param {Object} params
 *  - sheetId  : Spreadsheet ID
 *  - tabName  : シート名 ("SHOTS")
 *  - row      : 1‑based 行番号
 *  - col      : 1‑based 列番号 (A=1)
 *  - value    : 書き込む値
 *  - token    : OAuth access_token (推奨)
 *  - apiKey   : fallback API key (token 無い場合)
 */
export async function updateCell({ sheetId, tabName, row, col, value, token, apiKey }) {
  const colLetter = String.fromCharCode("A".charCodeAt(0) + col - 1);
  const range = `${tabName}!${colLetter}${row}`;
  const qs = new URLSearchParams({ valueInputOption: "USER_ENTERED" });
  if (!token) qs.append("key", apiKey);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?${qs}`;
  const body = {
    range,
    majorDimension: "ROWS",
    values: [[value]],
  };

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { method: "PUT", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Sheets update failed: ${res.status}`);
  return res.json();
}
