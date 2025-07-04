import { ensureSheetExists } from './sheetUtils';
const apiKey = import.meta.env.VITE_SHEETS_API_KEY;

export async function deletePage(spreadsheetId, token, pageId) {
  console.log(`Attempting to delete page with ID: ${pageId}`);
  try {
    const sheetId = await ensureSheetExists(spreadsheetId, token);
    if (!sheetId) {
      console.warn("PAGES sheet not found during deletion attempt. No action taken.");
      return; // Exit gracefully if sheet doesn't exist
    }

    const range = 'PAGES!A:A'; // Assuming page_id is in column A
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    console.log(`Fetching page IDs from: ${url}`);

    const getPagesResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const pagesData = await getPagesResponse.json();
    if (!getPagesResponse.ok) {
      console.error("Error fetching page data:", pagesData);
      throw new Error(`Failed to fetch page data: ${pagesData.error.message}`);
    }

    const rows = pagesData.values;

    if (!rows || rows.length === 0) {
      console.log("No data found in PAGES sheet, nothing to delete.");
      return;
    }

    console.log("Current rows in PAGES sheet:", rows);

    const rowsToDelete = [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === pageId) {
        rowsToDelete.push(i); // Store the 0-based index
      }
    }

    if (rowsToDelete.length === 0) {
      console.log(`Page with ID "${pageId}" not found in sheet, nothing to delete.`);
      return;
    }

    // Sort indices in descending order to avoid shifting issues when deleting multiple rows
    rowsToDelete.sort((a, b) => b - a);
    console.log("Rows to delete (0-based indices, descending):", rowsToDelete);

    const requests = rowsToDelete.map(rowIndex => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    }));

    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    console.log("Sending batch update request to delete rows:", requests);

    const response = await fetch(batchUpdateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requests),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Batch update failed:", data);
      throw new Error(data.error.message || 'Failed to delete the page from the sheet.');
    }

    console.log("Page(s) deleted successfully. Response:", data);
    return data;
  } catch (err) {
    console.error('Caught error in deletePage:', err);
    throw new Error(`Failed to delete the page from the sheet: ${err.message}`);
  }
}

