/**
 * Googleスプレッドシートの単一セルを更新します。
 * @param {string} spreadsheetId スプレッドシートのID
 * @param {string} token 認証トークン
 * @param {string} range 更新するセルの範囲 (例: "Shots!C5")
 * @param {string} value 設定する新しい値
 * @returns {Promise<object>} Google Sheets APIからのレスポンス
 */
export const updateCell = async (spreadsheetId, token, range, value) => {
    const params = new URLSearchParams({
        valueInputOption: 'USER_ENTERED'
    });
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?${params}`;

    const body = {
        values: [[value]]
    };

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Sheets API Error:', errorData);
        throw new Error(errorData.error.message || 'Failed to update cell.');
    }

    return response.json();
};
