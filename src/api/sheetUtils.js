export async function ensureSheetExists(spreadsheetId, ensureValidToken, retried = false) {
  try {
    await ensureValidToken();
    const getSpreadsheetRes = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties',
    });

    const spreadsheet = getSpreadsheetRes.result;
    if (!getSpreadsheetRes.result) {
      if (getSpreadsheetRes.status === 401 && !retried) {
        console.warn("401 Unauthorized in ensureSheetExists, attempting to refresh token and retry...");
        await ensureValidToken();
        return ensureSheetExists(spreadsheetId, ensureValidToken, true);
      }
      throw new Error(getSpreadsheetRes.error?.message || `Failed to fetch spreadsheet details: ${getSpreadsheetRes.status}`);
    }

    console.log("All sheets in spreadsheet:");
    spreadsheet.sheets.forEach(s => {
      console.log(`  Title: ${s.properties.title}, ID: ${s.properties.sheetId}`);
    });

    const sheet = spreadsheet.sheets.find(s => s.properties.title.trim().toLowerCase() === 'pages');

    if (sheet) {
      console.log("PAGES sheet already exists. ID:", sheet.properties.sheetId);
      return sheet.properties.sheetId;
    }

    console.warn("PAGES sheet not found. Current sheets:", spreadsheet.sheets);
    console.log("Attempting to create PAGES sheet...");
    const addSheetRequest = {
      requests: [
        {
          addSheet: {
            properties: {
              title: 'PAGES',
            },
          },
        },
      ],
    };

    const addSheetRes = await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: addSheetRequest,
    });
    const addSheetData = addSheetRes.result;

    if (!addSheetRes.result) {
      if (addSheetRes.status === 401 && !retried) {
        console.warn("401 Unauthorized during sheet creation, attempting to refresh token and retry...");
        await ensureValidToken();
        return ensureSheetExists(spreadsheetId, ensureValidToken, true);
      }
      throw new Error(addSheetRes.error?.message || `Failed to create PAGES sheet: ${addSheetRes.status}`);
    }

    const newSheetId = addSheetData.replies[0].addSheet.properties.sheetId;
    console.log("PAGES sheet created successfully. New ID:", newSheetId);
    return newSheetId;
  } catch (err) {
    console.error('Error in ensureSheetExists:', err);
    throw err; // Re-throw the error to be handled by the caller
  }
}