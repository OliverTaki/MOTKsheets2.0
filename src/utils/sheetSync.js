/**
 * 新しく割り当てられたIDをGoogleスプレッドシートに書き込みます。
 * @param {string} spreadsheetId - スプレッドシートのID
 * @param {string} sheetName - 対象のシート名 (例: 'Shots')
 * @param {string} token - 認証トークン
 * @param {Array<{index: number, newId: string}>} updates - 更新する行の情報配列
 * @param {Array<{id: string}>} fields - フィールド定義
 * @returns {Promise<Object>} - batchUpdate APIからのレスポンス
 */
export async function updateSheetWithNewIds(spreadsheetId, sheetName, token, updates, fields) {
    // 'id'フィールドが何番目の列かを探す
    const idColumnIndex = fields.findIndex(f => f.id === 'id');
    if (idColumnIndex === -1) {
        throw new Error("Could not find 'id' column in fields definition.");
    }
    
    // Google Sheets APIはA=0, B=1...と列を数えるので、インデックスがそのまま使える
    const idColumnLetter = String.fromCharCode('A'.charCodeAt(0) + idColumnIndex);

    // batchUpdate APIに送るリクエストの本体を作成する
    const requests = updates.map(update => {
        // シートの行番号は1から始まり、ヘッダー行があるので+2する
        // update.indexは0ベースのデータ配列のインデックス
        const rowIndex = update.index + 2; 
        const range = `${sheetName}!${idColumnLetter}${rowIndex}`;
        
        return {
            range: range,
            values: [[update.newId]]
        };
    });

    const body = {
        valueInputOption: 'USER_ENTERED',
        data: requests
    };

    const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
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
        throw new Error(errorData.error.message || 'Failed to update sheet.');
    }

    return response.json();
}
