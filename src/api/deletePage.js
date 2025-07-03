import { ensureSheetExists } from './appendPage';
const apiKey = import.meta.env.VITE_SHEETS_API_KEY;

export async function deletePage(spreadsheetId, token, pageId) {
  try {
    console.log("Deleting page with ID:", pageId);
    const sheetId = await ensureSheetExists(spreadsheetId, token);
    if (!sheetId) {
      console.log("PAGES sheet not found, nothing to delete.");
      return; // Exit gracefully
    }
    console.log("Sheet ID:", sheetId);

    const range = 'PAGES!A:A';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    console.log("Getting pages from:", url);
    const getPagesResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const pagesData = await getPagesResponse.json();
    console.log("Pages data:", pagesData);
    const rows = pagesData.values;
    if (!rows) {
      console.log("No data found in PAGES sheet, nothing to delete.");
      return;
    }

    const rowIndex = rows.findIndex(row => row[0] === pageId);
    console.log("Row index to delete:", rowIndex);
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

    console.log("Deleting row with request:", batchUpdateRequest);
    const response = await fetch(batchUpdateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(batchUpdateRequest),
    });
    const data = await response.json();
    console.log("Delete response:", data);
    if (!response.ok) {
      throw new Error(data.error.message);
    }
    return data;
  } catch (err) {
    console.error('Error deleting page:', err);
    throw new Error('Failed to delete the page from the sheet.');
  }
}

