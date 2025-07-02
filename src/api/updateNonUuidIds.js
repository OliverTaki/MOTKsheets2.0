import { isValidUUID } from '../utils/id';

/**
 * スプレッドシートのメタデータを取得し、シート名からシートIDへのマップを返します。
 * @param {string} spreadsheetId 
 * @param {string} token 
 * @returns {Promise<Map<string, number>>}
 */
const getSheetIds = async (spreadsheetId, token) => {
    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
        {
            headers: { 'Authorization': `Bearer ${token}` }
        }
    );
    if (!response.ok) throw new Error('Could not fetch spreadsheet metadata.');
    const data = await response.json();
    const sheetIdMap = new Map();
    data.sheets.forEach(sheet => {
        sheetIdMap.set(sheet.properties.title.toUpperCase(), sheet.properties.sheetId);
    });
    return sheetIdMap;
};

/**
 * Googleスプレッドシート内の非UUIDのIDを新しいUUIDに置き換えます。
 * @param {string} spreadsheetId スプレッドシートのID
 * @param {string} token 認証トークン
 * @param {Array<object>} sheets ショットデータの配列
 * @param {Array<object>} fields フィールド定義の配列
 * @returns {Promise<object>} Google Sheets APIからのレスポ1ンス
 */
export const updateNonUuidIds = async (spreadsheetId, token, sheets, fields) => {
    const requests = [];
    const sheetIds = await getSheetIds(spreadsheetId, token);
    const shotsSheetId = sheetIds.get('SHOTS');
    const fieldsSheetId = sheetIds.get('FIELDS');

    if (shotsSheetId === undefined || fieldsSheetId === undefined) {
        throw new Error("Could not find 'Shots' or 'FIELDS' sheet in the spreadsheet. Please check the exact sheet names.");
    }

    // ショットIDの更新
    sheets.forEach((shot, rowIndex) => {
        // Google Sheetsの行は1から始まるため、ヘッダー行を考慮して+2
        const sheetRowIndex = rowIndex + 2; 
        if (!isValidUUID(shot.shot_id)) {
            const newUuid = crypto.randomUUID();
            requests.push({
                updateCells: {
                    rows: [{ values: [{ userEnteredValue: { stringValue: newUuid } }] }],
                    fields: "userEnteredValue",
                    start: {
                        sheetId: shotsSheetId,
                        rowIndex: sheetRowIndex - 1, // APIは0-indexed
                        // shot_idがどの列にあるかを見つける必要がある
                        // 現状、shot_idは常に最初の列（A列）にあると仮定
                        columnIndex: 0 
                    }
                }
            });
            // 関連するセルも更新する必要がある場合はここに追加
            // 例: shot_codeがshot_idに依存している場合など
        }
    });

    // フィールドIDの更新
    fields.forEach((field, fieldIndex) => {
        // FIELDSシートの行は1から始まるため、ヘッダー行を考慮して+2
        const fieldSheetRowIndex = fieldIndex + 2;
        if (!isValidUUID(field.id)) {
            const newUuid = crypto.randomUUID();
            requests.push({
                updateCells: {
                    rows: [{ values: [{ userEnteredValue: { stringValue: newUuid } }] }],
                    fields: "userEnteredValue",
                    start: {
                        sheetId: fieldsSheetId,
                        rowIndex: fieldSheetRowIndex - 1, // APIは0-indexed
                        // field.idがどの列にあるかを見つける必要がある
                        // 現状、field.idは常に最初の列（A列）にあると仮定
                        columnIndex: 0 
                    }
                }
            });
        }
    });

    if (requests.length === 0) {
        console.log("No non-UUID IDs found to update.");
        return { message: "No non-UUID IDs found to update." };
    }

    const body = { requests };
    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }
    );

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Sheets API Error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to update non-UUID IDs.');
    }

    return response.json();
};
