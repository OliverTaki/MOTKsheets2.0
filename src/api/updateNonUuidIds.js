import { isValidUUID } from '../utils/id';
import { apiFetch } from '../utils/api';

/**
 * スプレッドシートのメタデータを取得し、シート名からシートIDへのマップを返します。
 * @param {string} spreadsheetId 
 * @returns {Promise<Map<string, number>>}
 */
const getSheetIds = async (spreadsheetId, token, setNeedsReAuth, ensureValidToken) => {
    try {
        const response = await apiFetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
            {},
            token,
            setNeedsReAuth,
            ensureValidToken
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Could not fetch spreadsheet metadata.');
        }
        const data = await response.json();
        const sheetIdMap = new Map();
        data.sheets.forEach(sheet => {
            sheetIdMap.set(sheet.properties.title.toUpperCase(), sheet.properties.sheetId);
        });
        return sheetIdMap;
    } catch (e) {
        console.error("Error in getSheetIds:", e);
        throw e;
    }
};

/**
 * Googleスプレッドシート内の非UUIDのIDを新しいUUIDに置き換えます。
 * @param {string} spreadsheetId スプレッドシートのID
 * @param {string} token 認証トークン
 * @param {Array<object>} sheets ショットデータの配列
 * @param {Array<object>} fields フィールド定義の配列
 * @returns {Promise<object>} Google Sheets APIからのレスポ1ンス
 */
export const getNonUuidIds = async (spreadsheetId, sheets, fields) => {
    try {
        console.log("getNonUuidIds: Received sheets data:", sheets);
        console.log("getNonUuidIds: Received fields data:", fields);
        const nonUuidShotIds = [];
        const nonUuidFieldIds = [];

        sheets.forEach((shot) => {
            console.log(`Checking shot ID: ${shot.shot_id}, isValidUUID: ${isValidUUID(shot.shot_id)}`);
            if (!isValidUUID(shot.shot_id) || shot.shot_id === '') {
                nonUuidShotIds.push(shot.shot_id);
            }
        });

        fields.forEach((field) => {
            console.log(`Checking field ID: ${field.id}, isValidUUID: ${isValidUUID(field.id)}`);
            if (!isValidUUID(field.id) || field.id === '') {
                nonUuidFieldIds.push(field.id);
            }
        });

        return { nonUuidShotIds, nonUuidFieldIds };
    } catch (e) {
        console.error("Error in getNonUuidIds:", e);
        throw e;
    }
};

export const updateNonUuidIds = async (spreadsheetId, token, setNeedsReAuth, sheets, fields, idsToUpdate, ensureValidToken) => {
    const requests = [];
    const sheetIds = await getSheetIds(spreadsheetId, token, setNeedsReAuth, ensureValidToken);
    const shotsSheetId = sheetIds.get('SHOTS');
    const fieldsSheetId = sheetIds.get('FIELDS');

    if (shotsSheetId === undefined || fieldsSheetId === undefined) {
        throw new Error("Could not find 'Shots' or 'FIELDS' sheet in the spreadsheet. Please check the exact sheet names.");
    }

    // ショットIDの更新
    sheets.forEach((shot, rowIndex) => {
        const sheetRowIndex = rowIndex + 2; 
        console.log(`updateNonUuidIds: Checking shot ID: ${shot.shot_id}, isValidUUID: ${isValidUUID(shot.shot_id)}, idsToUpdate includes: ${idsToUpdate.includes(shot.shot_id)}`);
        if ((!isValidUUID(shot.shot_id) || shot.shot_id === '') && idsToUpdate.includes(shot.shot_id)) {
            const newUuid = crypto.randomUUID();
            console.log(`updateNonUuidIds: Shot - rowIndex: ${rowIndex}, sheetRowIndex: ${sheetRowIndex}, newUuid: ${newUuid}`);
            requests.push({
                updateCells: {
                    rows: [{ values: [{ userEnteredValue: { stringValue: newUuid } }] }],
                    fields: "userEnteredValue",
                    start: {
                        sheetId: shotsSheetId,
                        rowIndex: rowIndex + 2,
                        columnIndex: 0 
                    }
                }
            });
            console.log("updateNonUuidIds: Shot - Added request:", requests[requests.length - 1]);
        }
    });

    fields.forEach((field, fieldIndex) => {
        const fieldSheetRowIndex = fieldIndex + 2;
        console.log(`updateNonUuidIds: Checking field ID: ${field.id}, isValidUUID: ${isValidUUID(field.id)}, idsToUpdate includes: ${idsToUpdate.includes(field.id)}`);
        if ((!isValidUUID(field.id) || field.id === '') && idsToUpdate.includes(field.id)) {
            const newUuid = crypto.randomUUID();
            console.log(`updateNonUuidIds: Field - fieldIndex: ${fieldIndex}, fieldSheetRowIndex: ${fieldSheetRowIndex}, newUuid: ${newUuid}`);
            requests.push({
                updateCells: {
                    rows: [{ values: [{ userEnteredValue: { stringValue: newUuid } }] }],
                    fields: "userEnteredValue",
                    start: {
                        sheetId: fieldsSheetId,
                        rowIndex: fieldIndex + 2,
                        columnIndex: 0 
                    }
                }
            });
            console.log("updateNonUuidIds: Field - Added request:", requests[requests.length - 1]);
        }
    });

    if (requests.length === 0) {
        console.log("No non-UUID IDs found to update.");
        return { message: "No non-UUID IDs found to update." };
    }

    const body = { requests };
    try {
        const response = await apiFetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            },
            token,
            setNeedsReAuth,
            ensureValidToken
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Google Sheets API Error:', errorData);
            throw new Error(errorData.error?.message || 'Failed to update non-UUID IDs.');
        }

        return response.json();
    } catch (e) {
        console.error("Error in updateNonUuidIds:", e);
        throw e;
    }
};
