import { google } from 'googleapis';

/**
 * Deletes a page (view configuration) from the 'PAGES' sheet.
 * @param {string} spreadsheetId - The ID of the spreadsheet.
 * @param {google.auth.OAuth2} auth - The authenticated Google OAuth2 client.
 * @param {string} pageId - The ID of the page to delete.
 * @returns {Promise<any>}
 */
export async function deletePage(spreadsheetId, auth, pageId) {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // First, get all the data from the PAGES sheet to find the row index of the pageId.
    const getPagesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'PAGES!A:A', // Look in the first column for the page_id
    });

    const rows = getPagesResponse.data.values;
    if (!rows) {
      throw new Error('No data found in PAGES sheet.');
    }

    const rowIndex = rows.findIndex(row => row[0] === pageId);
    if (rowIndex === -1) {
      throw new Error(`Page with ID "${pageId}" not found.`);
    }

    // The sheet is 1-indexed, so add 1 to the rowIndex.
    const sheetRowIndex = rowIndex + 1;

    // Now, create a request to delete that row.
    const batchUpdateRequest = {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: await getSheetId(sheets, spreadsheetId, 'PAGES'), // Helper to get sheetId by name
              dimension: 'ROWS',
              startIndex: rowIndex, // 0-indexed
              endIndex: sheetRowIndex,
            },
          },
        },
      ],
    };

    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: batchUpdateRequest,
    });

    return response.data;
  } catch (err) {
    console.error('Error deleting page:', err);
    throw new Error('Failed to delete the page from the sheet.');
  }
}

// Helper function to get the sheetId from its name, as the deleteDimension request requires a sheetId.
async function getSheetId(sheets, spreadsheetId, sheetName) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
  });
  const sheet = spreadsheet.data.sheets.find(
    s => s.properties.title === sheetName
  );
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found.`);
  }
  return sheet.properties.sheetId;
}
