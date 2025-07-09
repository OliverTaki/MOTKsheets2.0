import { fetchGoogle } from '../utils/google';

export async function ensureSheetExists(spreadsheetId, token, setNeedsReAuth) {
  try {
    const getSpreadsheetRes = await fetchGoogle(`spreadsheets/${spreadsheetId}`, token, { fields: 'sheets.properties' });

    const spreadsheet = getSpreadsheetRes;
    if (!getSpreadsheetRes) {
      throw new Error(`Failed to fetch spreadsheet details: ${getSpreadsheetRes.status}`);
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

    const addSheetRes = await fetchGoogle(`spreadsheets/${spreadsheetId}:batchUpdate`, token, {
      method: 'POST',
      body: addSheetRequest,
    });
    const addSheetData = addSheetRes;

    if (!addSheetRes) {
      throw new Error(`Failed to create PAGES sheet: ${addSheetRes.status}`);
    }

    const newSheetId = addSheetData.replies[0].addSheet.properties.sheetId;
    console.log("PAGES sheet created successfully. New ID:", newSheetId);
    return newSheetId;
  } catch (err) {
    console.error('Error in ensureSheetExists:', err);
    throw err; // Re-throw the error to be handled by the caller
  }
}