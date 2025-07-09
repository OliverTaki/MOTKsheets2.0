import { ensureSheetExists } from './sheetUtils';
import { fetchGoogle } from '../utils/google';

export async function deletePage(spreadsheetId, token, setNeedsReAuth, pageId) {
  console.log(`Attempting to delete page with ID: ${pageId}`);
  try {
    const sheetId = await ensureSheetExists(spreadsheetId, token, setNeedsReAuth);
    if (!sheetId) {
      console.warn("PAGES sheet not found during deletion attempt. No action taken.");
      return; // Exit gracefully if sheet doesn't exist
    }

    // Fetch page IDs
    const getPagesRes = await fetchGoogle(`spreadsheets/${spreadsheetId}/values/PAGES!A:A`, token);

    const pagesData = getPagesRes;
    if (!getPagesRes) {
      console.error("Error fetching page data:", getPagesRes);
      throw new Error(`Failed to fetch page data: ${getPagesRes.status}`);
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

    const batchUpdateRes = await fetchGoogle(`spreadsheets/${spreadsheetId}:batchUpdate`, token, {
      method: 'POST',
      body: { requests: requests },
    });

    console.log("Page(s) deleted successfully. Response:", batchUpdateRes);
    return batchUpdateRes;
  } catch (err) {
    console.error('Caught error in deletePage:', err);
    throw new Error(`Failed to delete the page from the sheet: ${err.message}`);
  }
}

