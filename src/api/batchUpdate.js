// src/api/batchUpdate.js

/**
 * batchUpdate – Google Sheets batchUpdate wrapper (values)
 *
 * @param {Object[]} requests - array of { range:string, values:any[][] }
 * @param {string} sheetId - Spreadsheet ID
 * @param {string} token   - OAuth access_token
 * @param {string} apiKey  - API key (optional, token takes priority)
 */
export async function batchUpdate({ requests, sheetId, ensureValidToken }, retried = false) {
  if (!sheetId) throw new Error('sheetId required');
  if (!requests?.length) return;

  try {
    const token = await ensureValidToken();

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: requests, valueInputOption: 'USER_ENTERED' }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      if (res.status === 401 && !retried) {
        console.warn("401 Unauthorized in batchUpdate, attempting to refresh token and retry...");
        await ensureValidToken(); // Attempt to get a new token
        return batchUpdate({ requests, sheetId, ensureValidToken }, true); // Retry the batchUpdate
      }
      throw new Error(errorData.error?.message || `batchUpdate failed: ${res.status} ${errorData.error?.message}`);
    }

    return res.json();
  } catch (e) {
    console.error("Error in batchUpdate:", e);
    throw e;
  }
}
