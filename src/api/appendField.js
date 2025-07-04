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
    // デバッグのため、取得したシート名をコンソールに出力します
    console.log("Sheets found in spreadsheet:", data.sheets.map(s => s.properties.title));
    data.sheets.forEach(sheet => {
        // シート名を大文字に変換して、大文字小文字を区別しないようにします
        sheetIdMap.set(sheet.properties.title.toUpperCase(), sheet.properties.sheetId);
    });
    return sheetIdMap;
};


/**
 * Googleスプレッドシートに新しいフィールド（列）を追加します。
 * @param {string} spreadsheetId スプレッドシートのID
 * @param {string} token 認証トークン
 * @param {object} newFieldDetails 追加する新しいフィールドの詳細情報 { label, type, editable, options }
 * @param {Array<object>} existingFields 既存のフィールドリスト
 * @returns {Promise<object>} Google Sheets APIからのレスポンス
 */
export const appendField = async (spreadsheetId, token, newFieldDetails, existingFields) => {
    // 新しいフィールドIDを自動生成 (例: "new_field_name")
    const newFieldId = newFieldDetails.id || newFieldDetails.label.toLowerCase().replace(/\s+/g, '_');
    
    // シート名から実際のシートIDを取得 (大文字に変換して比較)
    const sheetIds = await getSheetIds(spreadsheetId, token);
    const fieldsSheetId = sheetIds.get('FIELDS');
    const shotsSheetId = sheetIds.get('SHOTS');

    if (fieldsSheetId === undefined || shotsSheetId === undefined) {
        throw new Error("Could not find 'FIELDS' or 'Shots' sheet in the spreadsheet. Please check the exact sheet names.");
    }

    // APIに送るリクエストを作成
    const requests = [
        // 1. 'FIELDS'シートに新しい行を追加して、フィールド定義を書き込む
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
        // 2. 'Shots'シートに新しい列を追加する
        {
            appendDimension: {
                sheetId: shotsSheetId,
                dimension: "COLUMNS",
                length: 1
            }
        },
        // 3. 追加した新しい列のヘッダーにフィールドIDを設定する
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
        // 4. 追加した新しい列���2行目にフィールド名を設定する
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
        throw new Error(errorData.error?.message || 'Failed to append field.');
    }

    return response.json();
};
