function findHeaderAndBody(rawData) {
    if (!rawData) return { header: null, body: [] };
    const nonEmptyRows = rawData.filter(row => row && row.some(cell => cell && String(cell).trim() !== ''));
    if (nonEmptyRows.length === 0) return { header: null, body: [] };
    return { header: nonEmptyRows[0], body: nonEmptyRows.slice(1) };
}

export function parseFields(rawData) {
    const { header, body } = findHeaderAndBody(rawData);
    if (!header) {
        console.error("No valid header found in FIELDS sheet data.");
        return [];
    }

    const normalizedHeader = header.map(cell => String(cell || '').trim().toLowerCase());

    // ユーザーのシートに合わせて、検索する列名を 'field_id' から 'fields_id' に修正しました
    let idIndex = normalizedHeader.indexOf('fields_id');
    const labelIndex = normalizedHeader.indexOf('field_name');
    const typeIndex = normalizedHeader.indexOf('type');
    const optionsIndex = normalizedHeader.indexOf('options');

    if (idIndex === -1 && normalizedHeader[0] === '') {
        console.warn("Header 'fields_id' not found, but first column was empty. Assuming it is the ID column.");
        idIndex = 0;
    }

    if (idIndex === -1 || labelIndex === -1) {
        console.error("Could not determine 'fields_id' or 'field_name' columns from header:", normalizedHeader);
        return [];
    }

    return body.map(row => ({
        id: row[idIndex],
        label: row[labelIndex],
        type: row[typeIndex] || 'text',
        options: optionsIndex !== -1 ? row[optionsIndex] : null,
    })).filter(field => field.id && String(field.id).trim() !== '');
}

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
