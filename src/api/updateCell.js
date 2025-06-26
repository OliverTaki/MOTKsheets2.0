/**
 * Googleスプレッドシートの単一セルを更新します。
 * @param {string} spreadsheetId 
 * @param {string} sheetName 
 * @param {number} row - 更新する行 (1-based index)
 * @param {number} column - 更新する列 (0-based index)
 * @param {string} value - 設定する新しい値
 * @param {string} token - 認証トークン
 */
export const updateCell = async (spreadsheetId, sheetName, row, column, value, token) => {
    // 列のインデックス（0=A, 1=B ...）をアルファベットに変換
    const columnLetter = String.fromCharCode('A'.charCodeAt(0) + column);
    const range = `${sheetName}!${columnLetter}${row}`;

    const params = new URLSearchParams({
        valueInputOption: 'USER_ENTERED'
    });
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?${params}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            values: [[value]]
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Sheets API Error:', errorData);
        throw new Error(errorData.error.message || 'Failed to update cell.');
    }

    return response.json();
};
