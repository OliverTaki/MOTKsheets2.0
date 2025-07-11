import { fetchGoogle } from '../utils/google';

// src/api/batchUpdate.js

/**
 * batchUpdate – Google Sheets batchUpdate wrapper (values)
 *
 * @param {Object[]} requests - array of { range:string, values:any[][] }
 * @param {string} sheetId - Spreadsheet ID
 */
export async function batchUpdate({ requests, sheetId, token, setNeedsReAuth, ensureValidToken }) {
  if (!sheetId) throw new Error('sheetId required');
  if (!requests?.length) return;

  try {
    const res = await fetchGoogle(`spreadsheets/${sheetId}:batchUpdate`, token, ensureValidToken, {
      method: 'POST',
      body: { requests: requests },
    });

    return res;
  } catch (e) {
    console.error("Error in batchUpdate:", e);
    throw e;
  }
}
