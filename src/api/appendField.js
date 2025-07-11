import { v4 as uuidv4 } from 'uuid';
import { fetchGoogle } from '../utils/google';

const getSheetIds = async (spreadsheetId, token, setNeedsReAuth, ensureValidToken) => {
    try {
        const res = await fetchGoogle(`spreadsheets/${spreadsheetId}`, token, ensureValidToken, { fields: 'sheets.properties' });
        const data = res;
        const sheetIdMap = new Map();
        console.log("Sheets found in spreadsheet:", data.sheets.map(s => s.properties.title));
        data.sheets.forEach(sheet => {
            sheetIdMap.set(sheet.properties.title.toUpperCase(), sheet.properties.sheetId);
        });
        return sheetIdMap;
    } catch (e) {
        console.error("Error in getSheetIds:", e);
        throw e;
    }
};

export const appendField = async (spreadsheetId, token, setNeedsReAuth, newFieldDetails, existingFields, ensureValidToken) => {
    const newFieldId = newFieldDetails.id || uuidv4(); // Use uuidv4 for unique ID
    
    try {
        const sheetIds = await getSheetIds(spreadsheetId, token, setNeedsReAuth, ensureValidToken);
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

    if (newFieldDetails.type === 'checkbox') {
        requests.push({
            setDataValidation: {
                range: {
                    sheetId: shotsSheetId,
                    startRowIndex: 2, // Start from the first data row (after headers)
                    endRowIndex: 1000, // Apply to a reasonable number of rows
                    startColumnIndex: existingFields.length,
                    endColumnIndex: existingFields.length + 1,
                },
                rule: {
                    condition: {
                        type: 'BOOLEAN',
                    },
                    strict: true,
                    showCustomUi: true,
                },
            },
        });
    }

    const body = { requests: requests };
    const res = await fetchGoogle(`spreadsheets/${spreadsheetId}:batchUpdate`, token, ensureValidToken, { method: 'POST', body: JSON.stringify(body) });

    return { id: newFieldId, label: newFieldDetails.label, type: newFieldDetails.type, editable: newFieldDetails.editable, options: newFieldDetails.options };
} catch (e) {
    console.error("Error in appendField:", e);
    throw e;
}
}