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
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found.`);
  }
  return sheet.properties.sheetId;
}

export async function deletePage(spreadsheetId, token, pageId) {
  try {
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
      throw new Error('No data found in PAGES sheet.');
    }

    const rowIndex = rows.findIndex(row => row[0] === pageId);
    if (rowIndex === -1) {
      throw new Error(`Page with ID "${pageId}" not found.`);
    }

    const sheetId = await getSheetId(spreadsheetId, 'PAGES', token);
    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate?key=${apiKey}`;
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
