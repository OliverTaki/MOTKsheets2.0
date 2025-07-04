const apiKey = import.meta.env.VITE_SHEETS_API_KEY;

export async function ensureSheetExists(spreadsheetId, token) {
  try {
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    const response = await fetch(sheetsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const spreadsheet = await response.json();

    if (spreadsheet.error) {
      console.error("Error fetching spreadsheet details:", spreadsheet.error);
      throw new Error(`Failed to fetch spreadsheet details: ${spreadsheet.error.message}`);
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
    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
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

    const addSheetResponse = await fetch(batchUpdateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(addSheetRequest),
    });
    const addSheetData = await addSheetResponse.json();

    if (!addSheetResponse.ok) {
      console.error("Error creating PAGES sheet:", addSheetData.error);
      throw new Error(`Failed to create PAGES sheet: ${addSheetData.error.message}`);
    }

    const newSheetId = addSheetData.replies[0].addSheet.properties.sheetId;
    console.log("PAGES sheet created successfully. New ID:", newSheetId);
    return newSheetId;
  } catch (err) {
    console.error('Error in ensureSheetExists:', err);
    throw err; // Re-throw the error to be handled by the caller
  }
}