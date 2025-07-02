import { google } from 'googleapis';

/**
 * Updates an existing page (view configuration) in the 'PAGES' sheet.
 * @param {string} spreadsheetId - The ID of the spreadsheet.
 * @param {google.auth.OAuth2} auth - The authenticated Google OAuth2 client.
 * @param {string} pageId - The ID of the page to update.
 * @param {object} pageData - The updated page data.
 * @returns {Promise<any>}
 */
export async function updatePage(spreadsheetId, auth, pageId, pageData) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const getPagesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'PAGES!A:A',
    });

    const rows = getPagesResponse.data.values;
    if (!rows) {
      throw new Error('No data found in PAGES sheet.');
    }

    const rowIndex = rows.findIndex(row => row[0] === pageId);
    if (rowIndex === -1) {
      throw new Error(`Page with ID "${pageId}" not found.`);
    }

    const sheetRowIndex = rowIndex + 1;
    const range = `PAGES!A${sheetRowIndex}:G${sheetRowIndex}`;

    const {
      title,
      columnWidths,
      columnOrder,
      filterSettings,
      fieldVisibility,
      sortOrder,
    } = pageData;

    const newRow = [
      pageId,
      title,
      JSON.stringify(columnWidths),
      JSON.stringify(columnOrder),
      JSON.stringify(filterSettings),
      JSON.stringify(fieldVisibility),
      JSON.stringify(sortOrder),
    ];

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [newRow],
      },
    });
    return response.data;
  } catch (err) {
    console.error('Error updating page:', err);
    throw new Error('Failed to update the page in the sheet.');
  }
}
