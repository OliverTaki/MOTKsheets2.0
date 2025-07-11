import { fetchGoogle } from '../utils/google';

export async function ensureSheetExists(spreadsheetId, token, setNeedsReAuth, ensureValidToken) {
  try {
    const getSpreadsheetRes = await fetchGoogle(`spreadsheets/${spreadsheetId}`, token, ensureValidToken, { fields: 'sheets.properties' });

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

    const addSheetRes = await fetchGoogle(`spreadsheets/${spreadsheetId}:batchUpdate`, token, ensureValidToken, {
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

export async function applyCheckboxFormattingToColumn(spreadsheetId, token, setNeedsReAuth, ensureValidToken, sheetName, columnIndex) {
  try {
    const getSpreadsheetRes = await fetchGoogle(`spreadsheets/${spreadsheetId}`, token, ensureValidToken, { fields: 'sheets.properties' });
    const sheet = getSpreadsheetRes.sheets.find(s => s.properties.title === sheetName);

    if (!sheet) {
      throw new Error(`Sheet '${sheetName}' not found.`);
    }

    const sheetId = sheet.properties.sheetId;

    const request = {
      requests: [
        {
          setDataValidation: {
            range: {
              sheetId: sheetId,
              startRowIndex: 2, // Assuming data starts from row 3 (0-indexed)
              endRowIndex: 1000, // Apply to a reasonable number of rows
              startColumnIndex: columnIndex,
              endColumnIndex: columnIndex + 1,
            },
            rule: {
              condition: {
                type: 'BOOLEAN',
              },
              strict: true,
              showCustomUi: true,
            },
          },
        },
      ],
    };

    const res = await fetchGoogle(`spreadsheets/${spreadsheetId}:batchUpdate`, token, ensureValidToken, {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Checkbox formatting applied to column ${columnIndex} in sheet ${sheetName}.`, res);
    return res;
  } catch (e) {
    console.error("Error in applyCheckboxFormattingToColumn:", e);
    throw e;
  }
}

export async function convertTextToCheckboxValues(spreadsheetId, token, setNeedsReAuth, ensureValidToken, sheetName, columnIndex) {
  try {
    // 1. Read the current values from the column
    const range = `${sheetName}!${String.fromCharCode(65 + columnIndex)}:${String.fromCharCode(65 + columnIndex)}`;
    const getValuesRes = await fetchGoogle(`spreadsheets/${spreadsheetId}/values/${range}`, token, ensureValidToken);
    const values = getValuesRes.values;

    if (!values || values.length === 0) {
      console.log(`No values found in column ${columnIndex} of sheet ${sheetName}.`);
      return;
    }

    // 2. Write the values back using USER_ENTERED option
    const updateRange = `${sheetName}!${String.fromCharCode(65 + columnIndex)}1`; // Start from row 1
    const updateRes = await fetchGoogle(`spreadsheets/${spreadsheetId}/values/${updateRange}:update`, token, ensureValidToken, {
      method: 'PUT',
      valueInputOption: 'USER_ENTERED',
      body: JSON.stringify({ values: values }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Converted text to checkbox values for column ${columnIndex} in sheet ${sheetName}.`, updateRes);
    return updateRes;
  } catch (e) {
    console.error("Error in convertTextToCheckboxValues:", e);
    throw e;
  }
}