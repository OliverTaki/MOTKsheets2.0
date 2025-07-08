import { ensureSheetExists } from './sheetUtils';

export async function deletePage(spreadsheetId, ensureValidToken, pageId, retried = false) {
  console.log(`Attempting to delete page with ID: ${pageId}`);
  try {
    const sheetId = await ensureSheetExists(spreadsheetId, ensureValidToken);
    if (!sheetId) {
      console.warn("PAGES sheet not found during deletion attempt. No action taken.");
      return; // Exit gracefully if sheet doesn't exist
    }

    const range = 'PAGES!A:A'; // Assuming page_id is in column A
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    console.log(`Fetching page IDs from: ${url}`);

    const getPagesResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const pagesData = await getPagesResponse.json();
    if (!getPagesResponse.ok) {
      if (getPagesResponse.status === 401 && !retried) {
        console.warn("401 Unauthorized fetching pages for deletion, attempting to refresh token and retry...");
        await ensureValidToken();
        return deletePage(spreadsheetId, ensureValidToken, pageId, true);
      }
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
      // Trim whitespace from the pageId read from the sheet before comparison
      if (rows[i][0] && rows[i][0].trim() === pageId) {
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
      body: JSON.stringify({ requests: requests }), // requests should be wrapped in an object
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && !retried) {
        console.warn("401 Unauthorized during batch update for deletion, attempting to refresh token and retry...");
        await ensureValidToken();
        return deletePage(spreadsheetId, ensureValidToken, pageId, true);
      }
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

