// src/utils/missingIdHandler.js  (V2 – safe sheetId)

import { scanRows } from './sheetSync.js';
import { batchUpdate } from '../api/batchUpdate.js';

export async function detectAndPatchIds(rows, sheetId, tabName, token) {
  if (!sheetId || !token) return false; // 安全ガード

  const { missing, patched } = scanRows(rows, 'shot_id');
  if (!missing.length) return false;

  const data = patched.map((r) => [r.shot_id]);
  const range = `${tabName}!A${missing[0].index}:${missing[missing.length - 1].index}`;

  await batchUpdate({
    sheetId,
    token,
    requests: [
      {
        range,
        values: data,
      },
    ],
  });
  return true;
}
