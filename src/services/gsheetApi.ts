const SHEET_ID = import.meta.env.VITE_SHEETS_ID;
const API_KEY = import.meta.env.VITE_GS_API_KEY;

export async function fetchRows(sheetName: string): Promise<unknown[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.values.slice(1);
}

export async function batchUpdate(sheetName: string, rows: unknown[][]): Promise<void> {
  await fetch('/.netlify/functions/updateRows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sheetName, rows }),
  });
}