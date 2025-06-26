// src/utils/sheetSync.js

import { generateId } from './idGenerator.js';

/**
 * scanRows – detect rows lacking a primary key (shot_id) and suggest IDs.
 * @param {Object[]} rows – array of row objects as returned by useSheetsData()
 * @param {string} idField – usually 'shot_id'
 * @returns {{ missing: { index:number, suggestedId:string }[], patched:Object[] }}
 */
export function scanRows(rows, idField = 'shot_id') {
  const missing = [];
  const patched = rows.map((r, idx) => {
    if (!r[idField]) {
      const sug = generateId('shot');
      missing.push({ index: idx, suggestedId: sug });
      return { ...r, [idField]: sug };
    }
    return r;
  });
  return { missing, patched };
}

/**
 * applyIds – write back suggested IDs to Google Sheets in bulk.
 * Caller decides whether to commit or discard.
 * @param {Object[]} missing – result of scanRows().missing
 * @param {string} sheetId
 * @param {string} tabName
 * @param {string} token – OAuth access_token
 * @param {string} apiKey
 */
export async function applyIds({ missing, sheetId, tabName, token, apiKey }) {
  if (!missing.length) return;
  const requests = missing.map(({ index, suggestedId }) => ({
    range: `${tabName}!A${index + 2}`, // assuming ID is column A and header row is 1
    values: [[suggestedId]],
  }));
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate?key=${apiKey}`;
  await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: requests,
    }),
  });
}
