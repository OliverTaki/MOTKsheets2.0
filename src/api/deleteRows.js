export async function deleteRows({ sheetId, rowNumbers = [], ensureValidToken }, retried = false) {
  if (!rowNumbers.length) return;

  try {
    await ensureValidToken();

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

    const res = await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      resource: { requests },
    });

    if (!res.result) {
      if (res.status === 401 && !retried) {
        console.warn("401 Unauthorized in deleteRows, attempting to refresh token and retry...");
        await ensureValidToken();
        return deleteRows({ sheetId, rowNumbers, ensureValidToken }, true); // Retry the delete
      }
      throw new Error(res.error?.message || `delete rows failed: ${res.status}`);
    }
  } catch (e) {
    console.error("Error in deleteRows:", e);
    throw e;
  }
}
