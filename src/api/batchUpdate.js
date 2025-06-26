// src/api/batchUpdate.js

/**
 * batchUpdate – Google Sheets batchUpdate wrapper (values)
 *
 * @param {Object[]} requests - array of { range:string, values:any[][] }
 * @param {string} sheetId - Spreadsheet ID
 * @param {string} token   - OAuth access_token
 * @param {string} apiKey  - API key (optional, token takes priority)
 */
export async function batchUpdate({ requests, sheetId, token, apiKey }) {
  if (!sheetId) throw new Error('sheetId required');
  if (!token && !apiKey) throw new Error('token or apiKey required');
  if (!requests?.length) return;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`;

  const res = await fetch(apiKey ? `${url}?key=${apiKey}` : url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ data: requests, valueInputOption: 'USER_ENTERED' }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`batchUpdate failed: ${res.status} ${msg}`);
  }

  return res.json();
}
