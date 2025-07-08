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
    await ensureValidToken();

    const res = await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      resource: { requests: requests },
    });

    if (!res.result) {
      if (res.status === 401 && !retried) {
        console.warn("401 Unauthorized in batchUpdate, attempting to refresh token and retry...");
        await ensureValidToken(); // Attempt to get a new token
        return batchUpdate({ requests, sheetId, ensureValidToken }, true); // Retry the batchUpdate
      }
      throw new Error(res.error?.message || `batchUpdate failed: ${res.status} ${res.error?.message}`);
    }

    return res.result;
  } catch (e) {
    console.error("Error in batchUpdate:", e);
    throw e;
  }
}
