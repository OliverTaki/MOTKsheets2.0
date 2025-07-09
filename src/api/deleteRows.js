import { fetchGoogle } from '../utils/google';

export async function deleteRows({ sheetId, rowNumbers = [], token, setNeedsReAuth }) {
  if (!rowNumbers.length) return;

  try {
    const requests = rowNumbers
      .sort((a, b) => b - a) // delete bottom‑up to avoid index shift
      .map((row) => ({
        deleteDimension: {
          range: {
            sheetId: 0,
            dimension: "ROWS",
            startIndex: row - 1,
            endIndex: row,
          },
        },
      }));

    const res = await fetchGoogle(`spreadsheets/${sheetId}:batchUpdate`, token, {
      method: 'POST',
      body: { requests },
    });

  } catch (e) {
    console.error("Error in deleteRows:", e);
    throw e;
  }
}
