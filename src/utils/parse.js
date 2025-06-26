/**
 * データの配列から、空でない最初の行をヘッダーとして見つけ、
 * ヘッダーとボディ（残りのデータ行）を分割します。
 * @param {Array<Array<string>>} rawData - スプレッドシートから取得した生のデータ
 * @returns {{header: Array<string>|null, body: Array<Array<string>>}}
 */
function findHeaderAndBody(rawData) {
    if (!rawData) return { header: null, body: [] };
    const nonEmptyRows = rawData.filter(row => row && row.some(cell => cell && String(cell).trim() !== ''));
    if (nonEmptyRows.length === 0) return { header: null, body: [] };
    return { header: nonEmptyRows[0], body: nonEmptyRows.slice(1) };
}

/**
 * FIELDSシートのデータを解析して、フィールド定義の配列を生成します。
 * @param {Array<Array<string>>} rawData - スプレッドシートから取得した生のデータ
 * @returns {Array<{id: string, label: string, type: string, options?: string}>} - 解析後のフィールドオブジェクトの配列
 */
export function parseFields(rawData) {
    const { header, body } = findHeaderAndBody(rawData);
    if (!header) {
        console.error("No valid header found in FIELDS sheet data.");
        return [];
    }

    const normalizedHeader = header.map(cell => String(cell || '').trim().toLowerCase());

    const idIndex = normalizedHeader.indexOf('field_id');
    const labelIndex = normalizedHeader.indexOf('field_name');
    const typeIndex = normalizedHeader.indexOf('type');
    const optionsIndex = normalizedHeader.indexOf('options'); // options列のインデックスを取得

    if (idIndex === -1 || labelIndex === -1) {
        console.error("Header 'field_id' or 'field_name' not found in normalized FIELDS header:", normalizedHeader);
        return [];
    }

    return body.map(row => ({
        id: row[idIndex],
        label: row[labelIndex],
        type: row[typeIndex] || 'text',
        // options列が存在すればその値を、なければnullを設定
        options: optionsIndex !== -1 ? row[optionsIndex] : null,
    })).filter(field => field.id && String(field.id).trim() !== '');
}

/**
 * Shotsシートのデータを、フィールド定義を元に解析してオブジェクトの配列に変換します。
 * @param {Array<Array<string>>} rawData - スプレッドシートから取得した生のデータ
 * @param {Array<{id: string}>} fields - parseFieldsによって生成されたフィールド定義
 * @returns {Array<Object>} - 各行をプロパティに持つオブジェクトの配列
 */
export function parseShots(rawData, fields) {
    const { header, body } = findHeaderAndBody(rawData);

    if (!header || body.length === 0 || !fields || fields.length === 0) {
        return [];
    }
    
    const normalizedHeader = header.map(cell => String(cell || '').trim().toLowerCase());

    const fieldMap = fields.reduce((acc, field) => {
        const index = normalizedHeader.indexOf(String(field.id).trim().toLowerCase());
        if (index !== -1) {
            acc[field.id] = index;
        }
        return acc;
    }, {});

    return body.map(row => {
        const shot = {};
        for (const field of fields) {
            const colIndex = fieldMap[field.id];
            shot[field.id] = colIndex !== undefined ? row[colIndex] : '';
        }
        return shot;
    });
}
