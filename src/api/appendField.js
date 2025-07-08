const getSheetIds = async (spreadsheetId, ensureValidToken, retried = false) => {
    try {
        await ensureValidToken();
        const res = await window.gapi.client.sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'sheets.properties',
        });
        const data = res.result;
        const sheetIdMap = new Map();
        console.log("Sheets found in spreadsheet:", data.sheets.map(s => s.properties.title));
        data.sheets.forEach(sheet => {
            sheetIdMap.set(sheet.properties.title.toUpperCase(), sheet.properties.sheetId);
        });
        return sheetIdMap;
    } catch (e) {
        if (e.status === 401 && !retried) {
            console.warn("401 Unauthorized in getSheetIds, attempting to refresh token and retry...");
            await ensureValidToken();
            return getSheetIds(spreadsheetId, ensureValidToken, true); // Retry the fetch
        }
        console.error("Error in getSheetIds:", e);
        throw e;
    }
};

export const appendField = async (spreadsheetId, ensureValidToken, newFieldDetails, existingFields, retried = false) => {
    const newFieldId = newFieldDetails.id || newFieldDetails.label.toLowerCase().replace(/\s+/g, '_');
    
    try {
        await ensureValidToken();
        const sheetIds = await getSheetIds(spreadsheetId, ensureValidToken);
    const fieldsSheetId = sheetIds.get('FIELDS');
    const shotsSheetId = sheetIds.get('SHOTS');

    if (fieldsSheetId === undefined || shotsSheetId === undefined) {
        throw new Error("Could not find 'FIELDS' or 'Shots' sheet in the spreadsheet. Please check the exact sheet names.");
    }

    const requests = [
        {
            appendCells: {
                sheetId: fieldsSheetId,
                rows: [
                    {
                        values: [
                            { userEnteredValue: { stringValue: newFieldId } },
                            { userEnteredValue: { stringValue: newFieldDetails.label } },
                            { userEnteredValue: { stringValue: newFieldDetails.type } },
                            { userEnteredValue: { stringValue: newFieldDetails.editable ? 'TRUE' : 'FALSE' } },
                            { userEnteredValue: { stringValue: 'FALSE' } }, // requiredは常にFALSEで追加
                            { userEnteredValue: { stringValue: newFieldDetails.options || '' } },
                        ]
                    }
                ],
                fields: "userEnteredValue"
            }
        },
        {
            appendDimension: {
                sheetId: shotsSheetId,
                dimension: "COLUMNS",
                length: 1
            }
        },
        {
            updateCells: {
                rows: [ { values: [ { userEnteredValue: { stringValue: newFieldId } } ] } ],
                fields: "userEnteredValue",
                start: {
                    sheetId: shotsSheetId,
                    rowIndex: 0, // ヘッダー行
                    columnIndex: existingFields.length // 既存のフィールド数 = 新しい列のインデックス
                }
            }
        },
        {
            updateCells: {
                rows: [ { values: [ { userEnteredValue: { stringValue: newFieldDetails.label } } ] } ],
                fields: "userEnteredValue",
                start: {
                    sheetId: shotsSheetId,
                    rowIndex: 1, // 2行目
                    columnIndex: existingFields.length
                }
            }
        }
    ];

    const body = { requests: requests };
    const res = await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: body,
    });

    if (!res.result) {
        if (res.status === 401 && !retried) {
            console.warn("401 Unauthorized in appendField, attempting to refresh token and retry...");
            await ensureValidToken(); // Attempt to get a new token
            return appendField(spreadsheetId, ensureValidToken, newFieldDetails, existingFields, true); // Retry the append
        }
        console.error('Google Sheets API Error:', res);
        throw new Error(res.error?.message || 'Failed to append field.');
    }

    return res.result;
} catch (e) {
    console.error("Error in appendField:", e);
    throw e;
}
}