import { fetchGoogle } from '../utils/google';

export async function updatePage(spreadsheetId, token, setNeedsReAuth, pageId, pageData, ensureValidToken) {
  try {
    const getPagesRes = await fetchGoogle(`spreadsheets/${spreadsheetId}/values/PAGES!A:A`, token, ensureValidToken);

    const pagesData = getPagesRes;
    if (!getPagesRes) {
      throw new Error(`Failed to fetch page data: ${getPagesRes.status}`);
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

    const updateRes = await fetchGoogle(`spreadsheets/${spreadsheetId}/values/${range}`, token, ensureValidToken, {
      method: 'PUT',
      params: { valueInputOption: 'USER_ENTERED' },
      body: { values: [newRow] },
    });

    return updateRes;
  } catch (err) {
    console.error('Error updating page:', err);
    throw new Error('Failed to update the page in the sheet.');
  }
}

