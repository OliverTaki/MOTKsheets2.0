import { fetchGoogle } from '../utils/google';

export const updateCell = async (spreadsheetId, token, setNeedsReAuth, range, value, ensureValidToken) => {
    console.log('[updateCell] Preparing to update:', { spreadsheetId, range, value });
    try {
        const res = await fetchGoogle(`spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED&includeValuesInResponse=true`, token, ensureValidToken, {
            method: 'PUT',
            body: JSON.stringify({ values: [[value]] }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('[updateCell] Google API response:', res);
        return res;
    } catch (e) {
        console.error("Error in updateCell:", e);
        throw e;
    }
};