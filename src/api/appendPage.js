const apiKey = import.meta.env.VITE_SHEETS_API_KEY;

export async function ensureSheetExists(spreadsheetId, token) {
  const sheetName = 'PAGES';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}&fields=sheets.properties`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const spreadsheet = await response.json();
    const sheetExists = spreadsheet.sheets.some(s => s.properties.title === sheetName);

    if (!sheetExists) {
      // Sheet doesn't exist, so create it with headers
      const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      const headers = [
        'page_id', 'title', 'columnWidths', 'columnOrder', 
        'filterSettings', 'visibleFieldIds', 'sortOrder', 'author'
      ];
      const addSheetRequest = {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: {
                  rowCount: 1,
                  columnCount: headers.length,
                },
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
      
      const addSheetResponseData = await addSheetResponse.json();
      if (!addSheetResponse.ok) {
        console.error('Error creating sheet:', addSheetResponseData);
        throw new Error(addSheetResponseData.error?.message || 'Failed to create sheet.');
      }
      
      const newSheetId = addSheetResponseData.replies[0].addSheet.properties.sheetId;

      const appendRequest = {
        requests: [
          {
            updateCells: {
              start: { sheetId: newSheetId, rowIndex: 0, columnIndex: 0 },
              rows: [
                {
                  values: headers.map(header => ({
                    userEnteredValue: {
                      stringValue: header,
                    },
                  })),
                },
              ],
              fields: 'userEnteredValue',
            },
          },
        ],
      };

      await fetch(batchUpdateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(appendRequest),
      });
    }
  } catch (err) {
    console.error('Error ensuring sheet exists:', err);
    throw new Error('Failed to ensure the PAGES sheet exists.');
  }
}

export async function appendPage(spreadsheetId, token, pageData) {
  await ensureSheetExists(spreadsheetId, token);

  const {
    page_id,
    title,
    columnWidths,
    columnOrder,
    filterSettings,
    visibleFieldIds,
    sortOrder,
    author,
  } = pageData;

  const newRow = [
    page_id,
    title,
    JSON.stringify(columnWidths),
    JSON.stringify(columnOrder),
    JSON.stringify(filterSettings),
    JSON.stringify(visibleFieldIds),
    JSON.stringify(sortOrder),
    author,
  ];

  const range = 'PAGES!A1';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        values: [newRow],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error.message);
    }
    return data;
  } catch (err) {
    console.error('Error appending page:', err);
    throw new Error('Failed to save the new page to the sheet.');
  }
}


