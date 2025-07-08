export async function updatePage(spreadsheetId, ensureValidToken, pageId, pageData, retried = false) {
  try {
    const token = await ensureValidToken();
    const getPagesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/PAGES!A:A`;
    const getPagesResponse = await fetch(getPagesUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const pagesData = await getPagesResponse.json();
    if (!getPagesResponse.ok) {
      if (getPagesResponse.status === 401 && !retried) {
        console.warn("401 Unauthorized fetching pages for update, attempting to refresh token and retry...");
        await ensureValidToken();
        return updatePage(spreadsheetId, ensureValidToken, pageId, pageData, true);
      }
      throw new Error(pagesData.error?.message || `Failed to fetch page data: ${getPagesResponse.status}`);
    }

    const rowIndex = rows.findIndex(row => row[0] === pageId);
    if (rowIndex === -1) {
      throw new Error(`Page with ID "${pageId}" not found.`);
    }

    const sheetRowIndex = rowIndex + 1;
    const range = `PAGES!A${sheetRowIndex}:H${sheetRowIndex}`;
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

    const {
      title,
      columnWidths,
      columnOrder,
      filterSettings,
      visibleFieldIds,
      sortOrder,
      author,
    } = pageData;

    const newRow = [
      pageId,
      title,
      JSON.stringify(columnWidths),
      JSON.stringify(columnOrder),
      JSON.stringify(filterSettings),
      JSON.stringify(visibleFieldIds),
      JSON.stringify(sortOrder),
      author,
    ];

    const response = await fetch(updateUrl, {
      method: 'PUT',
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
    console.error('Error updating page:', err);
    throw new Error('Failed to update the page in the sheet.');
  }
}

