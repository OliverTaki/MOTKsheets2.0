import { ensureSheetExists } from './sheetUtils';

export async function deletePage(spreadsheetId, ensureValidToken, pageId, retried = false) {
  console.log(`Attempting to delete page with ID: ${pageId}`);
  try {
    const sheetId = await ensureSheetExists(spreadsheetId, ensureValidToken);
    if (!sheetId) {
      console.warn("PAGES sheet not found during deletion attempt. No action taken.");
      return; // Exit gracefully if sheet doesn't exist
    }

    // Fetch page IDs using gapi.client
    const getPagesRes = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'PAGES!A:A',
    });

    const pagesData = getPagesRes.result;
    if (!getPagesRes.result) {
      if (getPagesRes.status === 401 && !retried) {
        console.warn("401 Unauthorized fetching pages for deletion, attempting to refresh token and retry...");
        await ensureValidToken();
        return deletePage(spreadsheetId, ensureValidToken, pageId, true);
      }
      console.error("Error fetching page data:", getPagesRes);
      throw new Error(getPagesRes.error?.message || `Failed to fetch page data: ${getPagesRes.status}`);
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

    console.log("Sending batch update request to delete rows:", requests);

    const batchUpdateRes = await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: { requests: requests },
    });

    if (!batchUpdateRes.result) {
      if (batchUpdateRes.status === 401 && !retried) {
        console.warn("401 Unauthorized during batch update for deletion, attempting to refresh token and retry...");
        await ensureValidToken();
        return deletePage(spreadsheetId, ensureValidToken, pageId, true);
      }
      console.error("Batch update failed:", batchUpdateRes);
      throw new Error(batchUpdateRes.error?.message || 'Failed to delete the page from the sheet.');
    }

    console.log("Page(s) deleted successfully. Response:", batchUpdateRes.result);
    return batchUpdateRes.result;
  } catch (err) {
    console.error('Caught error in deletePage:', err);
    throw new Error(`Failed to delete the page from the sheet: ${err.message}`);
  }
}

