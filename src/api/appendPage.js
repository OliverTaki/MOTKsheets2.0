import { google } from 'googleapis';

/**
 * Appends a new page (view configuration) to the 'PAGES' sheet.
 * @param {string} spreadsheetId - The ID of the spreadsheet.
 * @param {google.auth.OAuth2} auth - The authenticated Google OAuth2 client.
 * @param {object} pageData - The page data to append.
 * @returns {Promise<any>}
 */
export async function appendPage(spreadsheetId, auth, pageData) {
  const sheets = google.sheets({ version: 'v4', auth });

  const {
    page_id,
    title,
    columnWidths,
    columnOrder,
    filterSettings,
    fieldVisibility,
    sortOrder,
  } = pageData;

  const newRow = [
    page_id,
    title,
    JSON.stringify(columnWidths),
    JSON.stringify(columnOrder),
    JSON.stringify(filterSettings),
    JSON.stringify(fieldVisibility),
    JSON.stringify(sortOrder),
  ];

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'PAGES!A1',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [newRow],
      },
    });
    return response.data;
  } catch (err) {
    console.error('Error appending page:', err);
    throw new Error('Failed to save the new page to the sheet.');
  }
}
