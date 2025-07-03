import { ensureSheetExists } from './appendPage';
const apiKey = import.meta.env.VITE_SHEETS_API_KEY;

async function getSheetId(spreadsheetId, sheetName, token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const spreadsheet = await response.json();
  const sheet = spreadsheet.sheets.find(s => s.properties.title === sheetName);
  return sheet ? sheet.properties.sheetId : null;
}

export async function deletePage(spreadsheetId, token, pageId) {
  try {
    await ensureSheetExists(spreadsheetId, token);
    const sheetId = await getSheetId(spreadsheetId, 'PAGES', token);
    if (!sheetId) {
      console.log("PAGES sheet not found, nothing to delete.");
      return; // Exit gracefully
    }

    const range = 'PAGES!A:A';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    const getPagesResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const pagesData = await getPagesResponse.json();
    const rows = pagesData.values;
    if (!rows) {
      console.log("No data found in PAGES sheet, nothing to delete.");
      return;
    }

    const rowIndex = rows.findIndex(row => row[0] === pageId);
    if (rowIndex === -1) {
      console.log(`Page with ID "${pageId}" not found, nothing to delete.`);
      return;
    }

    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const batchUpdateRequest = {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    };

    const response = await fetch(batchUpdateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(batchUpdateRequest),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error.message);
    }
    return data;
  } catch (err) {
    console.error('Error deleting page:', err);
    throw new Error('Failed to delete the page from the sheet.');
  }
}

