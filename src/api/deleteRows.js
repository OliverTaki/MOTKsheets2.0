export async function deleteRows({ sheetId, rowNumbers = [], token }) {
  if (!token) throw new Error("Not authenticated");
  if (!rowNumbers.length) return;

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

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requests }),
    }
  );
  if (!res.ok) throw new Error(`delete rows failed: ${res.status}`);
}
