const apiKey = import.meta.env.VITE_SHEETS_API_KEY;

export async function appendPage(spreadsheetId, token, pageData) {
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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&key=${apiKey}`;

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
      throw new Error(data.error.message);
    }
    return data;
  } catch (err) {
    console.error('Error appending page:', err);
    throw new Error('Failed to save the new page to the sheet.');
  }
}

