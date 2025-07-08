export async function appendPage(spreadsheetId, ensureValidToken, pageData, retried = false) {
  try {
    const token = await ensureValidToken();
    await ensureSheetExists(spreadsheetId, ensureValidToken);

  const {
    page_id,
    title,
    columnWidths,
    columnOrder,
    filterSettings,
    visibleFieldIds,
    sortOrder,
    author,
  } = pageData;

  const newRow = [
    page_id,
    title,
    JSON.stringify(columnWidths),
    JSON.stringify(columnOrder),
    JSON.stringify(filterSettings),
    JSON.stringify(visibleFieldIds),
    JSON.stringify(sortOrder),
    author,
  ];

  const range = 'PAGES!A1';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        values: [newRow],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && !retried) {
        console.warn("401 Unauthorized appending page, attempting to refresh token and retry...");
        await ensureValidToken();
        return appendPage(spreadsheetId, ensureValidToken, pageData, true);
      }
      throw new Error(data.error?.message || `Failed to append page: ${response.status}`);
    }
    return data;
  } catch (err) {
    console.error('Error appending page:', err);
    throw new Error('Failed to save the new page to the sheet.');
  }
}


