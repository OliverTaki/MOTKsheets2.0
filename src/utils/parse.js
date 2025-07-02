function findHeaderAndBody(rawData) {
    if (!rawData) return { header: null, body: [] };
    const nonEmptyRows = rawData.filter(row => row && row.some(cell => cell && String(cell).trim() !== ''));
    if (nonEmptyRows.length === 0) return { header: null, body: [] };
    // The first row is the header with field_ids, the second is the human-readable header (which we skip),
    // and the rest is the body.
    return { header: nonEmptyRows[0], body: nonEmptyRows.slice(2) };
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
    const editableIndex = normalizedHeader.indexOf('editable');
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
        editable: row[editableIndex] ? row[editableIndex].toUpperCase() === 'TRUE' : false, // editable列をパース
        options: optionsIndex !== -1 ? row[optionsIndex] : null,
    })).filter(field => field.id && String(field.id).trim() !== '');
}

export function parseShots(rawData, fields) {
    const { header, body } = findHeaderAndBody(rawData);

    if (!header || body.length === 0 || !fields || fields.length === 0) {
        return [];
    }

    const idToColIndex = header.reduce((acc, id, index) => {
        if (id) {
            acc[id.trim()] = index;
        }
        return acc;
    }, {});

    return body.map(row => {
        const shot = {};
        for (const field of fields) {
            const colIndex = idToColIndex[field.id];
            if (colIndex !== undefined) {
                shot[field.id] = row[colIndex] || '';
            }
        }
        const shotIdField = fields.find(f => f.label === 'Shot ID');
        shot.shot_id = shotIdField ? shot[shotIdField.id] : (row[0] || '');
        return shot;
    });
}
