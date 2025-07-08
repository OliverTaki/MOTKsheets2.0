export async function updatePage(spreadsheetId, ensureValidToken, pageId, pageData, retried = false) {
  try {
    await ensureValidToken();
    const getPagesRes = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'PAGES!A:A',
    });

    const pagesData = getPagesRes.result;
    if (!getPagesRes.result) {
      if (getPagesRes.status === 401 && !retried) {
        console.warn("401 Unauthorized fetching pages for update, attempting to refresh token and retry...");
        await ensureValidToken();
        return updatePage(spreadsheetId, ensureValidToken, pageId, pageData, true);
      }
      throw new Error(getPagesRes.error?.message || `Failed to fetch page data: ${getPagesRes.status}`);
    }

    const rows = pagesData.values;
    if (!rows) {
      throw new Error('No data found in PAGES sheet.');
    }

    const rowIndex = rows.findIndex(row => row[0] === pageId);
    if (rowIndex === -1) {
      throw new Error(`Page with ID "${pageId}" not found.`);
    }

    const sheetRowIndex = rowIndex + 1;
    const range = `PAGES!A${sheetRowIndex}:H${sheetRowIndex}`;

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

    const updateRes = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [newRow] },
    });

    if (!updateRes.result) {
      if (updateRes.status === 401 && !retried) {
        console.warn("401 Unauthorized updating page, attempting to refresh token and retry...");
        await ensureValidToken();
        return updatePage(spreadsheetId, ensureValidToken, pageId, pageData, true);
      }
      throw new Error(updateRes.error?.message || `Failed to update page: ${updateRes.status}`);
    }
    return updateRes.result;
  } catch (err) {
    console.error('Error updating page:', err);
    throw new Error('Failed to update the page in the sheet.');
  }
}

