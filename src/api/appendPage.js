const apiKey = import.meta.env.VITE_SHEETS_API_KEY;

export async function ensureSheetExists(spreadsheetId, token) {
  const sheetName = 'PAGES';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const spreadsheet = await response.json();
    const sheet = spreadsheet.sheets.find(s => s.properties.title === sheetName);

    if (!sheet) {
      // Sheet doesn't exist, so create it with headers
      const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      const addSheetRequest = {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
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
        body: JSON.stringify(addSheetRequest),
      });

      // Now, add the headers to the newly created sheet
      const headers = [
        'page_id', 'title', 'columnWidths', 'columnOrder', 
        'filterSettings', 'visibleFieldIds', 'sortOrder', 'author'
      ];
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED&key=${apiKey}`;
      await fetch(appendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          values: [headers],
        }),
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


